import { PDFDocument } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, getOutputFilename } from '../utils/helpers.js';
import { loadPdfDocument, renderPageToCanvas, canvasToBlob } from '../utils/pdfHelper.js';

export function createCompressTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let fileBuffer = null;
  let pdfjsDoc = null;
  let totalPages = 0;
  let isProcessing = false;

  // Presets: [scale, quality]
  let compressionLevel = 'medium'; // 'low' | 'medium' | 'high' | 'custom'
  let customScale = 1.0;
  let customQuality = 0.65;

  function render() {
    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.compress}</span>
              Nén file PDF (Compress PDF)
            </h2>
            <p class="text-sm text-slate-500 mt-1">Giảm kích thước tệp PDF bằng cách tối ưu hóa và nén hình ảnh trang trực tiếp trên trình duyệt.</p>
          </div>
        </div>

        <!-- Drag & Drop Zone -->
        <div id="drop-zone" class="${currentFile ? 'hidden' : ''} relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all rounded-2xl p-8 text-center cursor-pointer group shadow-sm">
          <input type="file" id="file-input" accept="application/pdf" class="hidden" />
          <div class="flex flex-col items-center justify-center space-y-3">
            <div class="p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
              ${icons.upload}
            </div>
            <div>
              <p class="text-base font-semibold text-slate-700">Kéo & thả tệp PDF cần nén vào đây, hoặc <span class="text-indigo-600 underline">chọn tệp</span></p>
              <p class="text-xs text-slate-400 mt-1">Hỗ trợ các tệp PDF tài liệu, sách scan, hóa đơn...</p>
            </div>
          </div>
        </div>

        <!-- Options Section -->
        <div id="options-container" class="${currentFile ? '' : 'hidden'} space-y-5 bg-white p-6 border border-slate-200 rounded-2xl shadow-xs">
          <!-- File info card -->
          <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-center gap-3 min-w-0">
              <div class="shrink-0">${icons.filePdf}</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate" id="file-name-label">${currentFile?.name || ''}</p>
                <p class="text-xs text-slate-500">Dung lượng gốc: <span class="font-bold text-slate-700">${currentFile ? formatBytes(currentFile.size) : ''}</span> • ${totalPages} trang</p>
              </div>
            </div>
            <button id="change-file-btn" class="text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
              Đổi tệp khác
            </button>
          </div>

          <!-- Compression Levels -->
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-slate-700">Chọn mức độ nén:</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${compressionLevel === 'low' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <input type="radio" name="compressionLevel" value="low" ${compressionLevel === 'low' ? 'checked' : ''} class="text-indigo-600" />
                  <span class="text-sm font-semibold">Nén nhẹ</span>
                </div>
                <p class="text-xs text-slate-500 mt-1 pl-5">Chất lượng cao nhất, giảm dung lượng vừa phải</p>
              </label>

              <label class="relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${compressionLevel === 'medium' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <input type="radio" name="compressionLevel" value="medium" ${compressionLevel === 'medium' ? 'checked' : ''} class="text-indigo-600" />
                  <span class="text-sm font-semibold">Cân bằng</span>
                  <span class="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-medium ml-auto">Khuyên dùng</span>
                </div>
                <p class="text-xs text-slate-500 mt-1 pl-5">Cân đối tốt giữa độ nét và dung lượng nhỏ</p>
              </label>

              <label class="relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${compressionLevel === 'high' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <input type="radio" name="compressionLevel" value="high" ${compressionLevel === 'high' ? 'checked' : ''} class="text-indigo-600" />
                  <span class="text-sm font-semibold">Nén tối đa</span>
                </div>
                <p class="text-xs text-slate-500 mt-1 pl-5">Dung lượng nhỏ nhất có thể, chất lượng vừa phải</p>
              </label>
            </div>
          </div>

          <!-- Custom Sliders (if custom mode is selected) -->
          <div id="custom-sliders-box" class="${compressionLevel === 'custom' ? '' : 'hidden'} space-y-4 pt-2 border-t border-slate-100">
            <div>
              <div class="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Chất lượng ảnh (JPEG Quality)</span>
                <span id="quality-val">${Math.round(customQuality * 100)}%</span>
              </div>
              <input type="range" id="quality-range" min="0.2" max="0.95" step="0.05" value="${customQuality}" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>

            <div>
              <div class="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Độ phân giải (Scale)</span>
                <span id="scale-val">${customScale}x</span>
              </div>
              <input type="range" id="scale-range" min="0.5" max="1.5" step="0.1" value="${customScale}" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>
          </div>

          <div class="text-xs text-slate-500 flex items-center justify-between">
            <span class="inline-flex items-center gap-1">${icons.shield} Không tải lên máy chủ - an toàn bảo mật tuyệt đối</span>
            <button id="toggle-custom-btn" class="text-indigo-600 hover:underline">
              ${compressionLevel === 'custom' ? 'Ẩn tùy chỉnh thủ công' : 'Tùy chỉnh thủ công...'}
            </button>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button id="compress-btn" ${isProcessing ? 'disabled' : ''} class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.compress} Bắt đầu nén PDF
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-5 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Nén PDF thành công!</h3>
            <p class="text-xs text-slate-400 mt-0.5">Tệp đã sẵn sàng tải về</p>
          </div>

          <!-- Comparison Badges -->
          <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl max-w-md mx-auto text-center border border-slate-200">
            <div>
              <span class="block text-xs text-slate-400">Trước khi nén</span>
              <span id="res-orig-size" class="text-sm font-bold text-slate-700">0 MB</span>
            </div>
            <div>
              <span class="block text-xs text-slate-400">Sau khi nén</span>
              <span id="res-comp-size" class="text-sm font-bold text-emerald-600">0 MB</span>
            </div>
            <div>
              <span class="block text-xs text-slate-400">Đã tiết kiệm</span>
              <span id="res-saved-percent" class="text-sm font-bold text-indigo-600">0%</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Nén tệp khác
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const dropZone = container.querySelector('#drop-zone');
    const fileInput = container.querySelector('#file-input');
    const changeFileBtn = container.querySelector('#change-file-btn');
    const compressBtn = container.querySelector('#compress-btn');
    const resetBtn = container.querySelector('#reset-btn');
    const toggleCustomBtn = container.querySelector('#toggle-custom-btn');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
      });
    }

    if (changeFileBtn) {
      changeFileBtn.addEventListener('click', () => {
        currentFile = null;
        pdfjsDoc = null;
        totalPages = 0;
        render();
      });
    }

    // Radio change
    container.querySelectorAll('input[name="compressionLevel"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        compressionLevel = e.target.value;
        const customBox = container.querySelector('#custom-sliders-box');
        if (compressionLevel === 'custom') {
          customBox.classList.remove('hidden');
        } else {
          customBox.classList.add('hidden');
        }
      });
    });

    if (toggleCustomBtn) {
      toggleCustomBtn.addEventListener('click', () => {
        if (compressionLevel === 'custom') {
          compressionLevel = 'medium';
        } else {
          compressionLevel = 'custom';
        }
        render();
      });
    }

    const qualityRange = container.querySelector('#quality-range');
    const scaleRange = container.querySelector('#scale-range');
    if (qualityRange) {
      qualityRange.addEventListener('input', (e) => {
        customQuality = parseFloat(e.target.value);
        container.querySelector('#quality-val').textContent = `${Math.round(customQuality * 100)}%`;
      });
    }
    if (scaleRange) {
      scaleRange.addEventListener('input', (e) => {
        customScale = parseFloat(e.target.value);
        container.querySelector('#scale-val').textContent = `${customScale}x`;
      });
    }

    if (compressBtn) {
      compressBtn.addEventListener('click', handleCompress);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFile = null;
        pdfjsDoc = null;
        render();
      });
    }
  }

  async function handleFileSelect(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Vui lòng chọn tệp định dạng PDF.');
      return;
    }

    try {
      updateProgress(20, 'Đang phân tích tệp PDF...');
      const ab = await readFileAsArrayBuffer(file);
      fileBuffer = ab;
      pdfjsDoc = await loadPdfDocument(ab);
      totalPages = pdfjsDoc.numPages;
      currentFile = file;
      resetProgress();
      render();
    } catch (err) {
      console.error(err);
      alert('Không thể mở tệp PDF: ' + err.message);
      resetProgress();
    }
  }

  async function handleCompress() {
    if (!pdfjsDoc || !currentFile) return;

    isProcessing = true;

    // Determine scale and quality
    let scale = 1.0;
    let quality = 0.65;

    if (compressionLevel === 'low') {
      scale = 1.2;
      quality = 0.80;
    } else if (compressionLevel === 'medium') {
      scale = 1.0;
      quality = 0.60;
    } else if (compressionLevel === 'high') {
      scale = 0.8;
      quality = 0.45;
    } else if (compressionLevel === 'custom') {
      scale = customScale;
      quality = customQuality;
    }

    updateProgress(5, 'Đang chuẩn bị quá trình nén...');

    try {
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const percent = 5 + Math.round(((i - 1) / totalPages) * 85);
        updateProgress(percent, `Đang xử lý và nén trang ${i}/${totalPages}...`);

        // Render page to canvas
        const rendered = await renderPageToCanvas(pdfjsDoc, i, scale);

        // Convert canvas to JPEG blob
        const blob = await canvasToBlob(rendered.canvas, 'image/jpeg', quality);
        const arrayBuffer = await blob.arrayBuffer();

        // Embed JPEG into new PDF document
        const embeddedImg = await newPdf.embedJpg(arrayBuffer);

        // Keep original dimensions so document size remains standard
        const page = newPdf.addPage([rendered.originalWidth, rendered.originalHeight]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: rendered.originalWidth,
          height: rendered.originalHeight,
        });
      }

      updateProgress(92, 'Đang tối ưu và tạo tệp hoàn chỉnh...');
      const newBytes = await newPdf.save();
      const compressedBlob = new Blob([newBytes], { type: 'application/pdf' });
      const filename = getOutputFilename(currentFile.name, 'nen', 'pdf');

      updateProgress(100, 'Nén thành công!');
      setTimeout(() => {
        resetProgress();
        showResult(compressedBlob, filename);
      }, 300);

    } catch (err) {
      console.error('Lỗi khi nén PDF:', err);
      alert('Đã xảy ra lỗi khi nén PDF: ' + err.message);
      resetProgress();
    } finally {
      isProcessing = false;
    }
  }

  function showResult(blob, filename) {
    const resultContainer = container.querySelector('#result-container');
    const origSizeEl = container.querySelector('#res-orig-size');
    const compSizeEl = container.querySelector('#res-comp-size');
    const savedPercentEl = container.querySelector('#res-saved-percent');
    const downloadBtn = container.querySelector('#download-result-btn');

    const origSize = currentFile.size;
    const compSize = blob.size;
    let savedPercent = Math.round(((origSize - compSize) / origSize) * 100);
    if (savedPercent < 0) savedPercent = 0;

    origSizeEl.textContent = formatBytes(origSize);
    compSizeEl.textContent = formatBytes(compSize);
    savedPercentEl.textContent = `${savedPercent}%`;

    resultContainer.classList.remove('hidden');

    downloadBtn.onclick = () => {
      downloadBlob(blob, filename);
    };

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  render();
}
