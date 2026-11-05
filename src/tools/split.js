import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, parsePageRanges, getOutputFilename } from '../utils/helpers.js';

export function createSplitTool(container, { updateProgress, resetProgress }) {
  let currentFile = null;
  let pdfDoc = null;
  let totalPages = 0;
  let splitMode = 'range'; // 'range' | 'all'
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.split}</span>
              Tách file PDF (Split PDF)
            </h2>
            <p class="text-sm text-slate-500 mt-1">Trích xuất khoảng trang mong muốn hoặc tách từng trang thành file riêng biệt.</p>
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
              <p class="text-xs text-slate-400 mt-1">Xử lý an toàn 100% trên trình duyệt của bạn</p>
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

          <!-- Mode selector -->
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-slate-700">Chọn phương thức tách:</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="relative flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${splitMode === 'range' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-200 hover:bg-slate-50'}">
                <input type="radio" name="splitMode" value="range" ${splitMode === 'range' ? 'checked' : ''} class="mr-3 text-indigo-600" />
                <div>
                  <p class="text-sm font-medium">Tách theo khoảng trang</p>
                  <p class="text-xs text-slate-500 mt-0.5">Trích xuất một hoặc nhiều trang thành 1 file PDF mới</p>
                </div>
              </label>

              <label class="relative flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${splitMode === 'all' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-200 hover:bg-slate-50'}">
                <input type="radio" name="splitMode" value="all" ${splitMode === 'all' ? 'checked' : ''} class="mr-3 text-indigo-600" />
                <div>
                  <p class="text-sm font-medium">Tách tất cả các trang</p>
                  <p class="text-xs text-slate-500 mt-0.5">Mỗi trang thành 1 file PDF (nén trong file ZIP)</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Range Input -->
          <div id="range-input-box" class="${splitMode === 'range' ? '' : 'hidden'} space-y-2">
            <label for="page-range" class="block text-sm font-medium text-slate-700">
              Nhập khoảng trang (ví dụ: <span class="font-mono text-indigo-600">1-3, 5, 7-${Math.min(totalPages, 10)}</span>)
            </label>
            <input type="text" id="page-range" value="${totalPages > 1 ? `1-${Math.min(totalPages, 3)}` : '1'}" placeholder="Ví dụ: 1-3, 5, 7" class="w-full px-4 py-2.5 text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none" />
            <p class="text-xs text-slate-400">Tổng số trang có sẵn: 1 đến ${totalPages}. Dùng dấu gạch nối (-) cho khoảng và dấu phẩy (,) để ngăn cách.</p>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button id="split-btn" ${isProcessing ? 'disabled' : ''} class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
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
        pdfDoc = null;
        totalPages = 0;
        render();
      });
    }

    // Radio change
    container.querySelectorAll('input[name="splitMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        splitMode = e.target.value;
        const rangeBox = container.querySelector('#range-input-box');
        if (rangeBox) {
          if (splitMode === 'range') rangeBox.classList.remove('hidden');
          else rangeBox.classList.add('hidden');
        }
      });
    });

    if (splitBtn) {
      splitBtn.addEventListener('click', handleSplit);
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
      alert('Không thể mở tệp PDF này: ' + err.message);
      resetProgress();
    }
  }

  async function handleSplit() {
    if (!pdfDoc || !currentFile) return;

    isProcessing = true;
    updateProgress(10, 'Đang chuẩn bị tách trang...');

    try {
      if (splitMode === 'range') {
        const rangeInput = container.querySelector('#page-range').value;
        const parsed = parsePageRanges(rangeInput, totalPages);
        if (!parsed.valid) {
          alert(parsed.error);
          isProcessing = false;
          resetProgress();
          return;
        }

        updateProgress(30, `Đang trích xuất ${parsed.pages.length} trang...`);
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, parsed.pages);

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
          showResult(blob, filename, `Đã tách ${parsed.pages.length} trang • Dung lượng: ${formatBytes(blob.size)}`);
        }, 300);

      } else {
        // Split all pages into individual files in a ZIP
        updateProgress(20, 'Đang chuẩn bị tách tất cả các trang...');
        const zip = new JSZip();

        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
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
