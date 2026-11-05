import { PDFDocument, degrees } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, getOutputFilename } from '../utils/helpers.js';
import { loadPdfDocument, renderPageToCanvas } from '../utils/pdfHelper.js';

export function createRotateTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let arrayBuffer = null;
  let pdfjsDoc = null;
  let pdfLibDoc = null;
  let totalPages = 0;
  let pages = []; // [{ pageNum: number, originalRotation: number, addedRotation: number, thumbUrl: string }]
  let isProcessing = false;
  let previewModalPage = null; // number or null

  function render() {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.rotate}</span>
              Xoay trang PDF (Rotate PDF)
            </h1>
            <p class="text-sm text-slate-500 mt-1">Xem trước trực quan từng trang tài liệu và xoay đúng góc mong muốn trước khi lưu.</p>
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
              <p class="text-xs text-slate-400 mt-1">Hệ thống sẽ tải toàn bộ trang lên cửa sổ xem trước để bạn dễ dàng căn chỉnh</p>
            </div>
          </div>
        </div>

        <!-- Main Workspace (Visible after file loaded) -->
        <div id="workspace-container" class="${currentFile ? '' : 'hidden'} space-y-5">
          <!-- Control bar & File info -->
          <div class="bg-white p-4 sm:p-5 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="shrink-0">${icons.filePdf}</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate" id="file-name-label">${currentFile?.name || ''}</p>
                <p class="text-xs text-slate-500">${currentFile ? formatBytes(currentFile.size) : ''} • <span class="font-bold text-indigo-600">${totalPages}</span> trang</p>
              </div>
              <button id="change-file-btn" class="text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0 ml-2">
                Đổi tệp khác
              </button>
            </div>

            <!-- Global Action Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="rotate-all-right-btn" class="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors">
                <span>↷</span> Xoay tất cả +90°
              </button>
              <button id="rotate-all-left-btn" class="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors">
                <span>↶</span> Xoay tất cả -90°
              </button>
              <button id="rotate-all-180-btn" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
                <span>↻</span> Xoay 180°
              </button>
              <button id="reset-rotations-btn" class="inline-flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors" title="Đặt lại về góc ban đầu">
                ${icons.refresh} Đặt lại
              </button>
            </div>
          </div>

          <!-- Quick Scope Selector -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-500">Xoay nhanh theo nhóm:</span>
              <button id="rotate-odd-btn" class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
                Trang lẻ (1, 3, 5...) +90°
              </button>
              <button id="rotate-even-btn" class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
                Trang chẵn (2, 4...) +90°
              </button>
            </div>
            <div class="text-slate-400 text-[11px]">
              Mẹo: Bấm nút xoay trực tiếp trên từng trang hoặc bấm vào ảnh để phóng to
            </div>
          </div>

          <!-- Visual Pages Preview Grid -->
          <div class="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div id="pages-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              ${pages.map((p, idx) => renderPageTile(p, idx)).join('')}
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-slate-600">
              Tổng số trang: <b class="text-slate-800">${totalPages}</b> • 
              Các trang đã điều chỉnh góc: <b class="text-indigo-600">${pages.filter(p => p.addedRotation > 0).length}</b> trang
            </div>
            <button id="save-pdf-btn" ${isProcessing ? 'disabled' : ''} class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Lưu & Tải xuống PDF đã xoay
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
            <button id="reset-tool-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Xoay tệp khác
            </button>
          </div>
        </div>

        <!-- Enlarged Preview Modal -->
        <div id="large-preview-modal" class="${previewModalPage ? '' : 'hidden'} fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 class="font-bold text-slate-800 text-base">Xem trước chi tiết Trang ${previewModalPage || ''}</h4>
              <button id="close-modal-btn" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                ✕
              </button>
            </div>
            <div class="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-100 rounded-2xl min-h-[350px]">
              ${previewModalPage && pages[previewModalPage - 1]?.thumbUrl ? `
                <img src="${pages[previewModalPage - 1].thumbUrl}" alt="Preview" style="transform: rotate(${pages[previewModalPage - 1].addedRotation}deg); transition: transform 0.2s;" class="max-h-[500px] w-auto object-contain shadow-md rounded-lg" />
              ` : ''}
            </div>
            <div class="flex items-center justify-between pt-2">
              <span class="text-xs text-slate-500">Góc xoay hiện tại: <b class="text-indigo-600">${previewModalPage ? pages[previewModalPage - 1]?.addedRotation : 0}°</b></span>
              <div class="flex gap-2">
                <button id="modal-rotate-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
                  ↷ Xoay +90°
                </button>
                <button id="modal-done-btn" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderPageTile(page, index) {
    const rot = page.addedRotation || 0;

    return `
      <div class="page-tile group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-2.5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
        <!-- Top bar with page index & rotation badge -->
        <div class="flex items-center justify-between text-[11px] mb-2 px-1">
          <span class="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            Trang ${page.pageNum}
          </span>
          ${rot > 0 ? `
            <span class="font-bold text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
              ↻ ${rot}°
            </span>
          ` : `
            <span class="text-[10px] text-slate-400">0°</span>
          `}
        </div>

        <!-- Thumbnail Image with rotation transform -->
        <div data-open-preview="${index}" class="aspect-[1/1.4] bg-slate-100 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center cursor-pointer relative p-1.5 hover:opacity-90 transition-opacity" title="Bấm để xem phóng to">
          ${page.thumbUrl ? `
            <img src="${page.thumbUrl}" alt="Trang ${page.pageNum}" style="transform: rotate(${rot}deg); transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);" class="w-full h-full object-contain pointer-events-none" />
          ` : `
            <div class="flex flex-col items-center justify-center text-slate-300">
              <span class="animate-spin text-indigo-500 text-sm">●</span>
            </div>
          `}
          <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-[10px] bg-white/90 font-medium text-slate-700 px-2 py-1 rounded-full shadow-xs">Xem to</span>
          </div>
        </div>

        <!-- Action Buttons Bar -->
        <div class="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-100">
          <button data-rotate-single="${index}" data-dir="left" class="flex-1 py-1 px-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1" title="Xoay trái 90°">
            <span>↶</span>
          </button>
          <button data-rotate-single="${index}" data-dir="right" class="flex-1 py-1 px-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1" title="Xoay phải 90°">
            <span>↷</span> Xoay
          </button>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    const dropZone = container.querySelector('#drop-zone');
    const fileInput = container.querySelector('#file-input');
    const changeFileBtn = container.querySelector('#change-file-btn');
    const rotateAllRightBtn = container.querySelector('#rotate-all-right-btn');
    const rotateAllLeftBtn = container.querySelector('#rotate-all-left-btn');
    const rotateAll180Btn = container.querySelector('#rotate-all-180-btn');
    const resetRotationsBtn = container.querySelector('#reset-rotations-btn');
    const rotateOddBtn = container.querySelector('#rotate-odd-btn');
    const rotateEvenBtn = container.querySelector('#rotate-even-btn');
    const savePdfBtn = container.querySelector('#save-pdf-btn');
    const resetToolBtn = container.querySelector('#reset-tool-btn');

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
        pdfLibDoc = null;
        pages = [];
        render();
      });
    }

    // Global rotate all right (+90°)
    if (rotateAllRightBtn) {
      rotateAllRightBtn.addEventListener('click', () => {
        pages.forEach(p => p.addedRotation = (p.addedRotation + 90) % 360);
        render();
      });
    }

    // Global rotate all left (-90° = +270°)
    if (rotateAllLeftBtn) {
      rotateAllLeftBtn.addEventListener('click', () => {
        pages.forEach(p => p.addedRotation = (p.addedRotation + 270) % 360);
        render();
      });
    }

    // Global rotate 180°
    if (rotateAll180Btn) {
      rotateAll180Btn.addEventListener('click', () => {
        pages.forEach(p => p.addedRotation = (p.addedRotation + 180) % 360);
        render();
      });
    }

    // Reset rotations
    if (resetRotationsBtn) {
      resetRotationsBtn.addEventListener('click', () => {
        pages.forEach(p => p.addedRotation = 0);
        render();
      });
    }

    // Rotate Odd pages
    if (rotateOddBtn) {
      rotateOddBtn.addEventListener('click', () => {
        pages.forEach((p, idx) => {
          if ((idx + 1) % 2 !== 0) {
            p.addedRotation = (p.addedRotation + 90) % 360;
          }
        });
        render();
      });
    }

    // Rotate Even pages
    if (rotateEvenBtn) {
      rotateEvenBtn.addEventListener('click', () => {
        pages.forEach((p, idx) => {
          if ((idx + 1) % 2 === 0) {
            p.addedRotation = (p.addedRotation + 90) % 360;
          }
        });
        render();
      });
    }

    // Individual rotate button
    container.querySelectorAll('[data-rotate-single]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-rotate-single'), 10);
        const dir = btn.getAttribute('data-dir');
        if (dir === 'left') {
          pages[index].addedRotation = (pages[index].addedRotation + 270) % 360;
        } else {
          pages[index].addedRotation = (pages[index].addedRotation + 90) % 360;
        }
        render();
      });
    });

    // Open large preview
    container.querySelectorAll('[data-open-preview]').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.getAttribute('data-open-preview'), 10);
        previewModalPage = index + 1;
        render();
      });
    });

    // Close preview modal
    const closeModalBtn = container.querySelector('#close-modal-btn');
    const modalDoneBtn = container.querySelector('#modal-done-btn');
    const modalRotateBtn = container.querySelector('#modal-rotate-btn');

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { previewModalPage = null; render(); });
    if (modalDoneBtn) modalDoneBtn.addEventListener('click', () => { previewModalPage = null; render(); });
    if (modalRotateBtn && previewModalPage) {
      modalRotateBtn.addEventListener('click', () => {
        const p = pages[previewModalPage - 1];
        if (p) {
          p.addedRotation = (p.addedRotation + 90) % 360;
          render();
        }
      });
    }

    if (savePdfBtn) {
      savePdfBtn.addEventListener('click', handleSavePdf);
    }

    if (resetToolBtn) {
      resetToolBtn.addEventListener('click', () => {
        currentFile = null;
        pdfjsDoc = null;
        pdfLibDoc = null;
        pages = [];
        render();
      });
    }
  }

  async function handleFileSelect(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Vui lòng chọn đúng tệp định dạng PDF.');
      return;
    }

    updateProgress(20, 'Đang phân tích và nạp tài liệu...');

    try {
      const ab = await readFileAsArrayBuffer(file);
      arrayBuffer = ab;
      currentFile = file;

      pdfLibDoc = await PDFDocument.load(ab.slice(0), { ignoreEncryption: true });
      pdfjsDoc = await loadPdfDocument(ab.slice(0));
      totalPages = pdfjsDoc.numPages;

      pages = [];
      for (let i = 0; i < totalPages; i++) {
        pages.push({
          pageNum: i + 1,
          originalRotation: 0,
          addedRotation: 0,
          thumbUrl: null
        });
      }

      resetProgress();
      render();

      // Render thumbnails progressively in background
      for (let i = 0; i < totalPages; i++) {
        try {
          const rendered = await renderPageToCanvas(pdfjsDoc, i + 1, 0.4);
          const thumbUrl = rendered.canvas.toDataURL('image/jpeg', 0.75);
          if (pages[i]) {
            pages[i].thumbUrl = thumbUrl;
            // Update individual thumbnail without re-rendering everything
            const imgEl = container.querySelector(`.page-tile:nth-child(${i + 1}) img`);
            if (imgEl) imgEl.src = thumbUrl;
          }
        } catch (err) {
          console.warn('Lỗi render trang', i + 1, err);
        }
      }

      render();

    } catch (err) {
      console.error(err);
      alert('Không thể mở tệp PDF: ' + err.message);
      resetProgress();
    }
  }

  async function handleSavePdf() {
    if (!pdfLibDoc || !currentFile) return;

    isProcessing = true;
    updateProgress(10, 'Đang áp dụng các góc xoay trang...');

    try {
      const newPdf = await PDFDocument.create();
      const allPages = await newPdf.copyPages(pdfLibDoc, pdfLibDoc.getPageIndices());

      for (let i = 0; i < allPages.length; i++) {
        const copiedPage = allPages[i];
        const pageMeta = pages[i];
        const currentRot = copiedPage.getRotation().angle || 0;
        const additionalRot = pageMeta?.addedRotation || 0;
        const finalRot = (currentRot + additionalRot) % 360;

        copiedPage.setRotation(degrees(finalRot));
        newPdf.addPage(copiedPage);

        const percent = 10 + Math.round(((i + 1) / allPages.length) * 75);
        updateProgress(percent, `Đang xử lý trang ${i + 1}/${allPages.length}...`);
      }

      updateProgress(88, 'Đang lưu tệp PDF hoàn chỉnh...');
      const outputBytes = await newPdf.save();
      const outputBlob = new Blob([outputBytes], { type: 'application/pdf' });
      const filename = getOutputFilename(currentFile.name, 'da_xoay', 'pdf');

      updateProgress(100, 'Xoay hoàn tất!');
      setTimeout(() => {
        resetProgress();
        showResult(outputBlob, filename, `Đã áp dụng xoay thành công cho ${totalPages} trang • Dung lượng: ${formatBytes(outputBlob.size)}`);
      }, 300);

    } catch (err) {
      console.error('Lỗi khi lưu PDF xoay:', err);
      alert('Đã xảy ra lỗi khi tạo tệp: ' + err.message);
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
