import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, parsePageRanges, getOutputFilename } from '../utils/helpers.js';
import { loadPdfDocument, renderPageToCanvas } from '../utils/pdfHelper.js';

export function createSplitTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let arrayBuffer = null;
  let pdfLibDoc = null;
  let pdfjsDoc = null;
  let totalPages = 0;
  let pages = []; // [{ pageNum: number, selected: boolean, thumbUrl: string }]
  let splitMode = 'range'; // 'range' | 'all'
  let isProcessing = false;

  function render() {
    const selectedCount = pages.filter(p => p.selected).length;

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.split}</span>
              Tách file PDF (Split PDF)
            </h2>
            <p class="text-sm text-slate-500 mt-1">Xem trước trực quan các trang và chọn trang cần tách hoặc chia nhỏ tệp.</p>
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
              <p class="text-xs text-slate-400 mt-1">Tải và hiển thị cửa sổ xem trước toàn bộ các trang</p>
            </div>
          </div>
        </div>

        <!-- Options & Visual Workspace -->
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

          <!-- Mode selector -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <label class="block text-sm font-semibold text-slate-700">Chọn phương thức tách:</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="relative flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${splitMode === 'range' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}">
                <input type="radio" name="splitMode" value="range" ${splitMode === 'range' ? 'checked' : ''} class="mr-3 text-indigo-600" />
                <div>
                  <p class="text-sm font-medium">Tách theo trang được chọn</p>
                  <p class="text-xs text-slate-500 mt-0.5">Bấm trực tiếp vào ảnh trang hoặc nhập khoảng trang bên dưới</p>
                </div>
              </label>

              <label class="relative flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${splitMode === 'all' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}">
                <input type="radio" name="splitMode" value="all" ${splitMode === 'all' ? 'checked' : ''} class="mr-3 text-indigo-600" />
                <div>
                  <p class="text-sm font-medium">Tách tất cả các trang</p>
                  <p class="text-xs text-slate-500 mt-0.5">Mỗi trang thành 1 file PDF (đóng gói trong file ZIP)</p>
                </div>
              </label>
            </div>

            <!-- Range input & Selection quick-buttons (Only if in range mode) -->
            ${splitMode === 'range' ? `
              <div class="pt-2 border-t border-slate-100 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-slate-700">Chọn nhanh theo nhóm:</span>
                  <div class="flex flex-wrap items-center gap-1.5 text-xs">
                    <button id="select-all-btn" class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                      Chọn tất cả
                    </button>
                    <button id="deselect-all-btn" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      Bỏ chọn
                    </button>
                    <button id="select-odd-btn" class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                      Trang lẻ (1, 3, 5...)
                    </button>
                    <button id="select-even-btn" class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                      Trang chẵn (2, 4...)
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label for="page-range" class="text-xs font-medium text-slate-600">
                      Khoảng trang (hoặc bấm trực tiếp vào ảnh trang bên dưới):
                    </label>
                    <span class="text-xs text-indigo-600 font-bold">Đã chọn ${selectedCount}/${totalPages} trang</span>
                  </div>
                  <input type="text" id="page-range" value="${getSelectedRangeString()}" placeholder="Ví dụ: 1-3, 5, 8" class="w-full px-3.5 py-2 text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none" />
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Visual Pages Preview Grid -->
          <div class="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-500 px-1">
              <span class="font-semibold text-slate-700">Cửa sổ xem trước trang tài liệu:</span>
              <span>Bấm vào trang để chọn / bỏ chọn</span>
            </div>

            <div id="pages-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              ${pages.map((p, idx) => `
                <div 
                  data-toggle-page="${idx}" 
                  class="group relative bg-white border-2 rounded-2xl p-2 cursor-pointer transition-all hover:shadow-md select-none ${p.selected && splitMode === 'range' ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}"
                >
                  <div class="flex items-center justify-between text-[11px] mb-1.5 px-0.5">
                    <span class="font-bold ${p.selected && splitMode === 'range' ? 'text-indigo-700 bg-indigo-100' : 'text-slate-600 bg-slate-100'} px-2 py-0.5 rounded-md">
                      Trang ${p.pageNum}
                    </span>
                    ${splitMode === 'range' ? `
                      <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${p.selected ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-transparent'}">
                        ✓
                      </span>
                    ` : ''}
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
            <span class="text-xs text-slate-500">
              ${splitMode === 'range' ? `Xuất tài liệu mới gồm <b>${selectedCount}</b> trang đã chọn` : `Tách toàn bộ <b>${totalPages}</b> trang thành các tệp riêng trong file ZIP`}
            </span>
            <button id="split-btn" ${isProcessing || (splitMode === 'range' && selectedCount === 0) ? 'disabled' : ''} class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.split} Bắt đầu tách PDF
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Tách PDF thành công!</h3>
            <p id="result-details" class="text-sm text-slate-500 mt-1"></p>
          </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Tách tệp khác
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function getSelectedRangeString() {
    const selectedIndices = pages.map((p, i) => p.selected ? i + 1 : null).filter(Boolean);
    if (selectedIndices.length === 0) return '';

    const ranges = [];
    let start = selectedIndices[0];
    let end = start;

    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] === end + 1) {
        end = selectedIndices[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = selectedIndices[i];
        end = start;
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
  }

  function applyRangeStringToSelection(str) {
    const parsed = parsePageRanges(str, totalPages);
    if (parsed.valid) {
      pages.forEach((p, idx) => {
        p.selected = parsed.pages.includes(idx);
      });
      render();
    }
  }

  function bindEvents() {
    const dropZone = container.querySelector('#drop-zone');
    const fileInput = container.querySelector('#file-input');
    const changeFileBtn = container.querySelector('#change-file-btn');
    const splitBtn = container.querySelector('#split-btn');
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
        pdfLibDoc = null;
        pdfjsDoc = null;
        pages = [];
        totalPages = 0;
        render();
      });
    }

    // Radio change
    container.querySelectorAll('input[name="splitMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        splitMode = e.target.value;
        render();
      });
    });

    // Quick selection buttons
    const selectAllBtn = container.querySelector('#select-all-btn');
    const deselectAllBtn = container.querySelector('#deselect-all-btn');
    const selectOddBtn = container.querySelector('#select-odd-btn');
    const selectEvenBtn = container.querySelector('#select-even-btn');
    const rangeInput = container.querySelector('#page-range');

    if (selectAllBtn) selectAllBtn.addEventListener('click', () => { pages.forEach(p => p.selected = true); render(); });
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => { pages.forEach(p => p.selected = false); render(); });
    if (selectOddBtn) selectOddBtn.addEventListener('click', () => { pages.forEach((p, i) => p.selected = ((i + 1) % 2 !== 0)); render(); });
    if (selectEvenBtn) selectEvenBtn.addEventListener('click', () => { pages.forEach((p, i) => p.selected = ((i + 1) % 2 === 0)); render(); });

    if (rangeInput) {
      rangeInput.addEventListener('change', (e) => {
        applyRangeStringToSelection(e.target.value);
      });
    }

    // Toggle page by clicking thumbnail
    container.querySelectorAll('[data-toggle-page]').forEach(tile => {
      tile.addEventListener('click', () => {
        if (splitMode !== 'range') return;
        const index = parseInt(tile.getAttribute('data-toggle-page'), 10);
        pages[index].selected = !pages[index].selected;
        render();
      });
    });

    if (splitBtn) {
      splitBtn.addEventListener('click', handleSplit);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFile = null;
        pdfLibDoc = null;
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
      updateProgress(20, 'Đang phân tích tệp PDF...');
      const ab = await readFileAsArrayBuffer(file);
      arrayBuffer = ab;
      currentFile = file;

      // Always pass independent cloned slices
      pdfLibDoc = await PDFDocument.load(ab.slice(0), { ignoreEncryption: true });
      pdfjsDoc = await loadPdfDocument(ab.slice(0));
      totalPages = pdfjsDoc.numPages;

      pages = [];
      for (let i = 0; i < totalPages; i++) {
        pages.push({
          pageNum: i + 1,
          selected: true, // Default all selected
          thumbUrl: null
        });
      }

      resetProgress();
      render();

      // Render thumbnails in background
      for (let i = 0; i < totalPages; i++) {
        try {
          const rendered = await renderPageToCanvas(pdfjsDoc, i + 1, 0.4);
          const thumbUrl = rendered.canvas.toDataURL('image/jpeg', 0.75);
          if (pages[i]) {
            pages[i].thumbUrl = thumbUrl;
            const imgEl = container.querySelector(`[data-toggle-page="${i}"] img`);
            if (imgEl) imgEl.src = thumbUrl;
          }
        } catch (err) {
          console.warn('Lỗi render thumbnail trang', i + 1, err);
        }
      }

      render();

    } catch (err) {
      console.error(err);
      alert('Không thể mở tệp PDF: ' + err.message);
      resetProgress();
    }
  }

  async function handleSplit() {
    if (!pdfLibDoc || !currentFile) return;

    isProcessing = true;
    updateProgress(10, 'Đang chuẩn bị tách trang...');

    try {
      if (splitMode === 'range') {
        const selectedIndices = pages.map((p, i) => p.selected ? i : null).filter(i => i !== null);
        if (selectedIndices.length === 0) {
          alert('Vui lòng chọn ít nhất 1 trang để tách.');
          isProcessing = false;
          resetProgress();
          return;
        }

        updateProgress(30, `Đang trích xuất ${selectedIndices.length} trang...`);
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfLibDoc, selectedIndices);

        copiedPages.forEach((page, idx) => {
          newPdf.addPage(page);
          const percent = 30 + Math.round(((idx + 1) / copiedPages.length) * 50);
          updateProgress(percent, `Đang xử lý trang ${idx + 1}/${copiedPages.length}...`);
        });

        updateProgress(85, 'Đang đóng gói tệp PDF mới...');
        const newBytes = await newPdf.save();
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        const filename = getOutputFilename(currentFile.name, 'tach_trang', 'pdf');

        updateProgress(100, 'Tách hoàn tất!');
        setTimeout(() => {
          resetProgress();
          showResult(blob, filename, `Đã trích xuất ${selectedIndices.length} trang • Dung lượng: ${formatBytes(blob.size)}`);
        }, 300);

      } else {
        // Split all pages into individual files in a ZIP
        updateProgress(20, 'Đang chuẩn bị tách tất cả các trang...');
        const zip = new JSZip();

        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(pdfLibDoc, [i]);
          singleDoc.addPage(copiedPage);
          const singleBytes = await singleDoc.save();
          const pageNumStr = String(i + 1).padStart(2, '0');
          zip.file(`Trang_${pageNumStr}.pdf`, singleBytes);

          const percent = 20 + Math.round(((i + 1) / totalPages) * 60);
          updateProgress(percent, `Đang tạo trang ${i + 1}/${totalPages}...`);
        }

        updateProgress(85, 'Đang nén tệp ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          updateProgress(85 + Math.round(metadata.percent * 0.15), `Nén file ZIP: ${Math.round(metadata.percent)}%`);
        });

        const filename = getOutputFilename(currentFile.name, 'tung_trang', 'zip');
        updateProgress(100, 'Tách và đóng gói hoàn tất!');
        setTimeout(() => {
          resetProgress();
          showResult(zipBlob, filename, `Đã tách thành ${totalPages} tệp PDF đơn lẻ trong file ZIP • Dung lượng: ${formatBytes(zipBlob.size)}`);
        }, 300);
      }
    } catch (err) {
      console.error('Lỗi khi tách PDF:', err);
      alert('Đã xảy ra lỗi khi tách: ' + err.message);
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
