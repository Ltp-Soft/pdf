import { PDFDocument, degrees } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, getOutputFilename, parsePageRanges } from '../utils/helpers.js';

export function createRotateTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let pdfDoc = null;
  let totalPages = 0;
  let rotationAngle = 90; // 90 | 180 | 270
  let rotationScope = 'all'; // 'all' | 'odd' | 'even' | 'custom'
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.rotate}</span>
              Xoay trang PDF (Rotate PDF)
            </h2>
            <p class="text-sm text-slate-500 mt-1">Xoay các trang PDF theo góc 90°, 180° hoặc 270° nhanh chóng và giữ nguyên chất lượng gốc.</p>
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
              <p class="text-base font-semibold text-slate-700">Kéo & thả tệp PDF vào đây, hoặc <span class="text-indigo-600 underline">chọn tệp</span></p>
              <p class="text-xs text-slate-400 mt-1">Xoay chuẩn lossless không làm vỡ hình hay giảm dung lượng</p>
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
                <p class="text-xs text-slate-500">${currentFile ? formatBytes(currentFile.size) : ''} • <span class="font-bold text-indigo-600">${totalPages}</span> trang</p>
              </div>
            </div>
            <button id="change-file-btn" class="text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
              Đổi tệp khác
            </button>
          </div>

          <!-- Rotation Angle Selector -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700">Chọn góc xoay:</label>
            <div class="grid grid-cols-3 gap-3">
              <label class="flex flex-col items-center justify-center p-3.5 border rounded-xl cursor-pointer text-center transition-all ${rotationAngle === 90 ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationAngle" value="90" ${rotationAngle === 90 ? 'checked' : ''} class="hidden" />
                <span class="text-xl mb-1">↷</span>
                <span class="text-xs sm:text-sm">Xoay phải 90°</span>
              </label>

              <label class="flex flex-col items-center justify-center p-3.5 border rounded-xl cursor-pointer text-center transition-all ${rotationAngle === 180 ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationAngle" value="180" ${rotationAngle === 180 ? 'checked' : ''} class="hidden" />
                <span class="text-xl mb-1">↻</span>
                <span class="text-xs sm:text-sm">Xoay 180°</span>
              </label>

              <label class="flex flex-col items-center justify-center p-3.5 border rounded-xl cursor-pointer text-center transition-all ${rotationAngle === 270 ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationAngle" value="270" ${rotationAngle === 270 ? 'checked' : ''} class="hidden" />
                <span class="text-xl mb-1">↶</span>
                <span class="text-xs sm:text-sm">Xoay trái 90°</span>
              </label>
            </div>
          </div>

          <!-- Rotation Scope -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700">Áp dụng cho trang:</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label class="flex items-center justify-center p-2.5 border rounded-xl cursor-pointer text-xs font-medium transition-all ${rotationScope === 'all' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationScope" value="all" ${rotationScope === 'all' ? 'checked' : ''} class="mr-1.5 text-indigo-600" />
                Tất cả trang
              </label>
              <label class="flex items-center justify-center p-2.5 border rounded-xl cursor-pointer text-xs font-medium transition-all ${rotationScope === 'odd' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationScope" value="odd" ${rotationScope === 'odd' ? 'checked' : ''} class="mr-1.5 text-indigo-600" />
                Trang lẻ (1, 3, 5...)
              </label>
              <label class="flex items-center justify-center p-2.5 border rounded-xl cursor-pointer text-xs font-medium transition-all ${rotationScope === 'even' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationScope" value="even" ${rotationScope === 'even' ? 'checked' : ''} class="mr-1.5 text-indigo-600" />
                Trang chẵn (2, 4...)
              </label>
              <label class="flex items-center justify-center p-2.5 border rounded-xl cursor-pointer text-xs font-medium transition-all ${rotationScope === 'custom' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                <input type="radio" name="rotationScope" value="custom" ${rotationScope === 'custom' ? 'checked' : ''} class="mr-1.5 text-indigo-600" />
                Tùy chọn
              </label>
            </div>
          </div>

          <!-- Custom Scope Input -->
          <div id="custom-scope-box" class="${rotationScope === 'custom' ? '' : 'hidden'} space-y-1.5">
            <input type="text" id="custom-pages-input" placeholder="Ví dụ: 1, 3-5, 8" class="w-full px-4 py-2.5 text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none" />
            <p class="text-xs text-slate-400">Nhập các trang bạn muốn xoay (từ 1 đến ${totalPages})</p>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button id="rotate-btn" ${isProcessing ? 'disabled' : ''} class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.rotate} Thực hiện xoay trang
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Xoay trang PDF thành công!</h3>
            <p id="result-details" class="text-sm text-slate-500 mt-1"></p>
          </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Xoay tệp khác
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
    const rotateBtn = container.querySelector('#rotate-btn');
    const resetBtn = container.querySelector('#reset-btn');

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
        pdfDoc = null;
        totalPages = 0;
        render();
      });
    }

    container.querySelectorAll('input[name="rotationAngle"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        rotationAngle = parseInt(e.target.value, 10);
        render();
      });
    });

    container.querySelectorAll('input[name="rotationScope"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        rotationScope = e.target.value;
        const customBox = container.querySelector('#custom-scope-box');
        if (customBox) {
          if (rotationScope === 'custom') customBox.classList.remove('hidden');
          else customBox.classList.add('hidden');
        }
      });
    });

    if (rotateBtn) {
      rotateBtn.addEventListener('click', handleRotate);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFile = null;
        pdfDoc = null;
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
      const loadedDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
      pdfDoc = loadedDoc;
      totalPages = loadedDoc.getPageCount();
      currentFile = file;
      resetProgress();
      render();
    } catch (err) {
      console.error(err);
      alert('Không thể mở tệp PDF: ' + err.message);
      resetProgress();
    }
  }

  async function handleRotate() {
    if (!pdfDoc || !currentFile) return;

    isProcessing = true;
    updateProgress(20, 'Đang xoay các trang...');

    try {
      // Determine which page indices (0-based) to rotate
      let targetIndices = [];

      if (rotationScope === 'all') {
        targetIndices = pdfDoc.getPageIndices();
      } else if (rotationScope === 'odd') {
        targetIndices = pdfDoc.getPageIndices().filter(i => (i + 1) % 2 !== 0);
      } else if (rotationScope === 'even') {
        targetIndices = pdfDoc.getPageIndices().filter(i => (i + 1) % 2 === 0);
      } else if (rotationScope === 'custom') {
        const customInput = container.querySelector('#custom-pages-input').value;
        const parsed = parsePageRanges(customInput, totalPages);
        if (!parsed.valid) {
          alert(parsed.error);
          isProcessing = false;
          resetProgress();
          return;
        }
        targetIndices = parsed.pages;
      }

      const pages = pdfDoc.getPages();
      for (let i = 0; i < targetIndices.length; i++) {
        const pageIdx = targetIndices[i];
        const page = pages[pageIdx];
        const currentAngle = page.getRotation().angle || 0;
        const newAngle = (currentAngle + rotationAngle) % 360;
        page.setRotation(degrees(newAngle));

        const percent = 20 + Math.round(((i + 1) / targetIndices.length) * 60);
        updateProgress(percent, `Đang xử lý trang ${i + 1}/${targetIndices.length}...`);
      }

      updateProgress(85, 'Đang lưu tệp PDF...');
      const rotatedBytes = await pdfDoc.save();
      const rotatedBlob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const filename = getOutputFilename(currentFile.name, 'da_xoay', 'pdf');

      updateProgress(100, 'Xoay trang hoàn tất!');
      setTimeout(() => {
        resetProgress();
        showResult(rotatedBlob, filename, `Đã xoay ${targetIndices.length} trang theo góc ${rotationAngle}° • Dung lượng: ${formatBytes(rotatedBlob.size)}`);
      }, 300);

    } catch (err) {
      console.error('Lỗi khi xoay PDF:', err);
      alert('Đã xảy ra lỗi khi xoay trang: ' + err.message);
      resetProgress();
    } finally {
      isProcessing = false;
    }
  }

  function showResult(blob, filename, details) {
    const resultContainer = container.querySelector('#result-container');
    const resultDetails = container.querySelector('#result-details');
    const downloadBtn = container.querySelector('#download-result-btn');

    resultDetails.textContent = details;
    resultContainer.classList.remove('hidden');

    downloadBtn.onclick = () => {
      downloadBlob(blob, filename);
    };

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  render();
}
