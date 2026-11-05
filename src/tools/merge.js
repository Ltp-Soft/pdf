import { PDFDocument } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../utils/helpers.js';

export function createMergeTool(container, { updateProgress, resetProgress }) {
  let files = []; // [{ id, file, name, size, pageCount, arrayBuffer }]
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.merge}</span>
              Nối file PDF (Merge PDF)
            </h2>
            <p class="text-sm text-slate-500 mt-1">Gộp nhiều tệp PDF lại thành một tệp duy nhất theo thứ tự bạn chọn.</p>
          </div>
        </div>

        <!-- Drag & Drop Zone -->
        <div id="drop-zone" class="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all rounded-2xl p-8 text-center cursor-pointer group shadow-sm">
          <input type="file" id="file-input" multiple accept="application/pdf" class="hidden" />
          <div class="flex flex-col items-center justify-center space-y-3">
            <div class="p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
              ${icons.upload}
            </div>
            <div>
              <p class="text-base font-semibold text-slate-700">Kéo & thả các tệp PDF vào đây, hoặc <span class="text-indigo-600 underline">chọn tệp</span></p>
              <p class="text-xs text-slate-400 mt-1">Hỗ trợ chọn nhiều tệp cùng lúc (chỉ xử lý cục bộ trên trình duyệt)</p>
            </div>
          </div>
        </div>

        <!-- File List Section -->
        <div id="file-list-container" class="${files.length > 0 ? '' : 'hidden'} space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-700 text-sm">Danh sách tệp (${files.length} tệp)</h3>
            <div class="flex gap-2">
              <label for="file-input-more" class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                ${icons.plus} Thêm tệp
                <input type="file" id="file-input-more" multiple accept="application/pdf" class="hidden" />
              </label>
              <button id="clear-all-btn" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                Xóa tất cả
              </button>
            </div>
          </div>

          <div id="file-items" class="space-y-2.5">
            ${files.map((item, index) => `
              <div class="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-200 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    ${index + 1}
                  </span>
                  <div class="shrink-0">${icons.filePdf}</div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate max-w-xs sm:max-w-md">${item.name}</p>
                    <p class="text-xs text-slate-400">${formatBytes(item.size)} • ${item.pageCount !== undefined ? item.pageCount + ' trang' : 'Đang đọc...'}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0 ml-3">
                  <button data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors" title="Di chuyển lên">
                    ${icons.arrowUp}
                  </button>
                  <button data-action="down" data-index="${index}" ${index === files.length - 1 ? 'disabled' : ''} class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors" title="Di chuyển xuống">
                    ${icons.arrowDown}
                  </button>
                  <button data-action="delete" data-index="${index}" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1" title="Xóa tệp">
                    ${icons.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Action bar -->
          <div class="p-4 bg-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div class="text-xs text-slate-600 text-center sm:text-left">
              Tổng số trang dự kiến: <span class="font-bold text-slate-800">${files.reduce((acc, f) => acc + (f.pageCount || 0), 0)}</span> trang
            </div>
            <button id="merge-btn" ${files.length < 2 || isProcessing ? 'disabled' : ''} class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.merge} Gộp PDF ngay
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Gộp file PDF thành công!</h3>
            <p id="result-details" class="text-sm text-slate-500 mt-1"></p>
          </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Làm tệp khác
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
    const fileInputMore = container.querySelector('#file-input-more');
    const clearAllBtn = container.querySelector('#clear-all-btn');
    const mergeBtn = container.querySelector('#merge-btn');
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
        if (e.dataTransfer.files) handleAddFiles(Array.from(e.dataTransfer.files));
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files) handleAddFiles(Array.from(e.target.files));
      });
    }

    if (fileInputMore) {
      fileInputMore.addEventListener('change', (e) => {
        if (e.target.files) handleAddFiles(Array.from(e.target.files));
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        files = [];
        render();
      });
    }

    // List actions: up, down, delete
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (action === 'up' && index > 0) {
          const temp = files[index];
          files[index] = files[index - 1];
          files[index - 1] = temp;
          render();
        } else if (action === 'down' && index < files.length - 1) {
          const temp = files[index];
          files[index] = files[index + 1];
          files[index + 1] = temp;
          render();
        } else if (action === 'delete') {
          files.splice(index, 1);
          render();
        }
      });
    });

    if (mergeBtn) {
      mergeBtn.addEventListener('click', handleMerge);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        files = [];
        render();
      });
    }
  }

  async function handleAddFiles(newFiles) {
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      alert('Vui lòng chọn đúng tệp định dạng PDF.');
      return;
    }

    for (const file of pdfFiles) {
      const item = {
        id: Math.random().toString(36).substring(2),
        file,
        name: file.name,
        size: file.size,
        pageCount: undefined,
        arrayBuffer: null
      };
      files.push(item);
    }
    render();

    // Read page counts in background
    for (const item of files) {
      if (item.pageCount === undefined) {
        try {
          const ab = await readFileAsArrayBuffer(item.file);
          item.arrayBuffer = ab;
          const pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
          item.pageCount = pdfDoc.getPageCount();
        } catch (err) {
          console.error('Lỗi khi đọc file PDF:', err);
          item.pageCount = 1;
        }
      }
    }
    render();
  }

  async function handleMerge() {
    if (files.length < 2) {
      alert('Cần ít nhất 2 tệp PDF để gộp.');
      return;
    }

    isProcessing = true;
    updateProgress(5, 'Khởi tạo tài liệu mới...');

    try {
      const mergedPdf = await PDFDocument.create();
      let totalCopied = 0;
      const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 1), 0);

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const percent = Math.round(((i) / files.length) * 80) + 10;
        updateProgress(percent, `Đang xử lý tệp ${i + 1}/${files.length}: ${item.name}...`);

        let ab = item.arrayBuffer;
        if (!ab) {
          ab = await readFileAsArrayBuffer(item.file);
          item.arrayBuffer = ab;
        }

        const sourcePdf = await PDFDocument.load(ab, { ignoreEncryption: true });
        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          totalCopied++;
        }
      }

      updateProgress(90, 'Đang lưu tệp PDF đã gộp...');
      const mergedBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
      updateProgress(100, 'Hoàn thành!');

      // Show result
      setTimeout(() => {
        resetProgress();
        showResult(mergedBlob, totalCopied);
      }, 400);

    } catch (err) {
      console.error('Lỗi gộp PDF:', err);
      alert('Đã xảy ra lỗi khi gộp file PDF: ' + err.message);
      resetProgress();
    } finally {
      isProcessing = false;
    }
  }

  function showResult(blob, pageCount) {
    const resultContainer = container.querySelector('#result-container');
    const resultDetails = container.querySelector('#result-details');
    const downloadBtn = container.querySelector('#download-result-btn');

    resultDetails.textContent = `Tệp đã gộp: ${pageCount} trang • Dung lượng: ${formatBytes(blob.size)}`;
    resultContainer.classList.remove('hidden');

    downloadBtn.onclick = () => {
      downloadBlob(blob, 'TaiLieu_DaGop.pdf');
    };

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  render();
}
