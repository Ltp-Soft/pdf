import JSZip from 'jszip';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, getOutputFilename } from '../utils/helpers.js';
import { loadPdfDocument, renderPageToCanvas, canvasToBlob } from '../utils/pdfHelper.js';

export function createPdfToImgTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let pdfjsDoc = null;
  let totalPages = 0;
  let pages = []; // [{ pageNum: number, thumbUrl: string }]
  let imgFormat = 'image/jpeg'; // 'image/jpeg' | 'image/png'
  let imgScale = 1.5; // 1.0 | 1.5 | 2.0
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.pdfToImg}</span>
              Chuyển PDF sang Ảnh (PDF to Images)
            </h1>
            <p class="text-sm text-slate-500 mt-1">Xuất toàn bộ các trang PDF thành hình ảnh JPG/PNG sắc nét và nén thành tệp ZIP để tải về.</p>
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
              <p class="text-xs text-slate-400 mt-1">Tự động xem trước toàn bộ trang và xuất ảnh chất lượng cao</p>
            </div>
          </div>
        </div>

        <!-- Options Section -->
        <div id="options-container" class="${currentFile ? '' : 'hidden'} space-y-5">
          <!-- File info card -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="shrink-0">${icons.filePdf}</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate" id="file-name-label">${currentFile?.name || ''}</p>
                <p class="text-xs text-slate-500">${currentFile ? formatBytes(currentFile.size) : ''} • <span class="font-bold text-indigo-600">${totalPages}</span> trang</p>
              </div>
            </div>
            <button id="change-file-btn" class="self-start sm:self-center text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              Đổi tệp khác
            </button>
          </div>

          <!-- Format & Quality Grid -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Format selector -->
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Định dạng ảnh đầu ra:</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${imgFormat === 'image/jpeg' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                  <input type="radio" name="imgFormat" value="image/jpeg" ${imgFormat === 'image/jpeg' ? 'checked' : ''} class="mr-2 text-indigo-600" />
                  JPG (Nhẹ & Phổ biến)
                </label>
                <label class="flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${imgFormat === 'image/png' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
                  <input type="radio" name="imgFormat" value="image/png" ${imgFormat === 'image/png' ? 'checked' : ''} class="mr-2 text-indigo-600" />
                  PNG (Trong suốt & Nét)
                </label>
              </div>
            </div>

            <!-- Resolution / Scale -->
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Độ phân giải ảnh:</label>
              <select id="scale-select" class="w-full px-3.5 py-3 text-sm border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none">
                <option value="1.0" ${imgScale === 1.0 ? 'selected' : ''}>Tiêu chuẩn (1.0x - Dung lượng nhẹ)</option>
                <option value="1.5" ${imgScale === 1.5 ? 'selected' : ''}>Cao (1.5x - Sắc nét, khuyên dùng)</option>
                <option value="2.0" ${imgScale === 2.0 ? 'selected' : ''}>Rất cao (2.0x HD - In ấn / Chi tiết)</option>
              </select>
            </div>
          </div>

          <!-- Visual Pages Preview Grid -->
          <div class="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-500 px-1">
              <span class="font-semibold text-slate-700">Cửa sổ xem trước trang tài liệu (${totalPages} trang):</span>
              <span>Tất cả các trang bên dưới sẽ được xuất thành ảnh</span>
            </div>

            <div id="pages-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              ${pages.map((p) => `
                <div class="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-col justify-between">
                  <div class="flex items-center justify-between text-[11px] mb-1.5 px-0.5">
                    <span class="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Trang ${p.pageNum}
                    </span>
                  </div>

                  <div class="aspect-[1/1.4] bg-slate-100 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center relative p-1">
                    ${p.thumbUrl ? `
                      <img src="${p.thumbUrl}" alt="Trang ${p.pageNum}" class="w-full h-full object-contain pointer-events-none" />
                    ` : `
                      <div class="flex flex-col items-center justify-center text-slate-300">
                        <span class="animate-spin text-indigo-500 text-sm">●</span>
                      </div>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Button -->
          <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <span class="text-xs text-slate-500">Đóng gói toàn bộ ${totalPages} ảnh thành 1 file ZIP để tải về một lượt</span>
            <button id="convert-btn" ${isProcessing ? 'disabled' : ''} class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.pdfToImg} Bắt đầu chuyển đổi sang Ảnh
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Chuyển đổi hoàn tất!</h3>
            <p id="result-details" class="text-sm text-slate-500 mt-1"></p>
          </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống file ZIP ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Chuyển tệp khác
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
    const convertBtn = container.querySelector('#convert-btn');
    const resetBtn = container.querySelector('#reset-btn');
    const scaleSelect = container.querySelector('#scale-select');

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
        pages = [];
        totalPages = 0;
        render();
      });
    }

    container.querySelectorAll('input[name="imgFormat"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        imgFormat = e.target.value;
      });
    });

    if (scaleSelect) {
      scaleSelect.addEventListener('change', (e) => {
        imgScale = parseFloat(e.target.value);
      });
    }

    if (convertBtn) {
      convertBtn.addEventListener('click', handleConvert);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFile = null;
        pdfjsDoc = null;
        pages = [];
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
      updateProgress(20, 'Đang đọc tệp PDF...');
      const ab = await readFileAsArrayBuffer(file);
      currentFile = file;

      // Safe clone
      pdfjsDoc = await loadPdfDocument(ab.slice(0));
      totalPages = pdfjsDoc.numPages;

      pages = [];
      for (let i = 0; i < totalPages; i++) {
        pages.push({ pageNum: i + 1, thumbUrl: null });
      }

      resetProgress();
      render();

      for (let i = 0; i < totalPages; i++) {
        try {
          const rendered = await renderPageToCanvas(pdfjsDoc, i + 1, 0.35);
          const thumbUrl = rendered.canvas.toDataURL('image/jpeg', 0.7);
          if (pages[i]) {
            pages[i].thumbUrl = thumbUrl;
            const imgEl = container.querySelector(`.aspect-\\[1\\/1\\.4\\] img:nth-child(${i + 1})`);
            if (imgEl) imgEl.src = thumbUrl;
          }
        } catch (e) {
          console.warn(e);
        }
      }
      render();

    } catch (err) {
      console.error(err);
      alert('Không thể mở tệp PDF: ' + err.message);
      resetProgress();
    }
  }

  async function handleConvert() {
    if (!pdfjsDoc || !currentFile) return;

    isProcessing = true;
    updateProgress(5, 'Đang chuẩn bị trích xuất ảnh...');

    try {
      const zip = new JSZip();
      const ext = imgFormat === 'image/jpeg' ? 'jpg' : 'png';
      const quality = imgFormat === 'image/jpeg' ? 0.9 : 1.0;

      for (let i = 1; i <= totalPages; i++) {
        const percent = 5 + Math.round(((i - 1) / totalPages) * 80);
        updateProgress(percent, `Đang render ảnh trang ${i}/${totalPages}...`);

        const rendered = await renderPageToCanvas(pdfjsDoc, i, imgScale);
        const blob = await canvasToBlob(rendered.canvas, imgFormat, quality);
        const arrayBuffer = await blob.arrayBuffer();

        const pageNumStr = String(i).padStart(2, '0');
        zip.file(`Trang_${pageNumStr}.${ext}`, arrayBuffer);
      }

      updateProgress(88, 'Đang đóng gói file ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        updateProgress(88 + Math.round(metadata.percent * 0.12), `Nén file ZIP: ${Math.round(metadata.percent)}%`);
      });

      const zipFilename = getOutputFilename(currentFile.name, 'anh', 'zip');
      updateProgress(100, 'Hoàn thành!');

      setTimeout(() => {
        resetProgress();
        showResult(zipBlob, zipFilename, `Đã xuất ${totalPages} trang thành ảnh • File nén ZIP: ${formatBytes(zipBlob.size)}`);
      }, 300);

    } catch (err) {
      console.error('Lỗi chuyển đổi PDF sang ảnh:', err);
      alert('Đã xảy ra lỗi: ' + err.message);
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
