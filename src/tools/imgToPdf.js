import { PDFDocument, PageSizes } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL } from '../utils/helpers.js';

export function createImgToPdfTool(container, { updateProgress, resetProgress }) {
  let imageFiles = []; // [{ id, file, name, size, dataUrl, width, height }]
  let pageSize = 'a4-portrait'; // 'a4-portrait' | 'a4-landscape' | 'fit'
  let marginSize = 20; // 0 | 20 | 40
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.imgToPdf}</span>
              Chuyển Ảnh sang PDF (Images to PDF)
            </h1>
            <p class="text-sm text-slate-500 mt-1">Chuyển đổi các hình ảnh JPG, PNG, WebP thành một tài liệu PDF hoàn chỉnh.</p>
          </div>
        </div>

        <!-- Drag & Drop Zone -->
        <div id="drop-zone" class="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all rounded-2xl p-8 text-center cursor-pointer group shadow-sm">
          <input type="file" id="file-input" multiple accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden" />
          <div class="flex flex-col items-center justify-center space-y-3">
            <div class="p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
              ${icons.upload}
            </div>
            <div>
              <p class="text-base font-semibold text-slate-700">Kéo & thả các tệp hình ảnh vào đây, hoặc <span class="text-indigo-600 underline">chọn ảnh</span></p>
              <p class="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG, WebP • Có thể chọn nhiều ảnh cùng lúc</p>
            </div>
          </div>
        </div>

        <!-- Images List & Settings -->
        <div id="images-container" class="${imageFiles.length > 0 ? '' : 'hidden'} space-y-5">
          <!-- Settings row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Khổ giấy PDF:</label>
              <select id="page-size-select" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none">
                <option value="a4-portrait" ${pageSize === 'a4-portrait' ? 'selected' : ''}>Khổ A4 Dọc (Chuẩn tài liệu in ấn)</option>
                <option value="a4-landscape" ${pageSize === 'a4-landscape' ? 'selected' : ''}>Khổ A4 Ngang</option>
                <option value="fit" ${pageSize === 'fit' ? 'selected' : ''}>Vừa khít kích thước ảnh gốc</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Khoảng cách lề (Margin):</label>
              <select id="margin-select" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none">
                <option value="0" ${marginSize === 0 ? 'selected' : ''}>Tràn viền (Không có lề)</option>
                <option value="20" ${marginSize === 20 ? 'selected' : ''}>Lề nhỏ (Khuyên dùng - 20pt)</option>
                <option value="40" ${marginSize === 40 ? 'selected' : ''}>Lề vừa (40pt)</option>
              </select>
            </div>
          </div>

          <!-- File list header -->
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-slate-700 text-sm">Hình ảnh đã chọn (${imageFiles.length} ảnh)</h3>
            <div class="flex gap-2">
              <label for="file-input-more" class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                ${icons.plus} Thêm ảnh
                <input type="file" id="file-input-more" multiple accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden" />
              </label>
              <button id="clear-all-btn" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                Xóa tất cả
              </button>
            </div>
          </div>

          <!-- Image Items -->
          <div id="image-items" class="space-y-2.5">
            ${imageFiles.map((item, index) => `
              <div class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-200 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    ${index + 1}
                  </span>
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    ${item.dataUrl ? `<img src="${item.dataUrl}" alt="" class="w-full h-full object-cover" />` : icons.fileImage}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate max-w-xs sm:max-w-md">${item.name}</p>
                    <p class="text-xs text-slate-400">${formatBytes(item.size)} ${item.width ? `• ${item.width}×${item.height}px` : ''}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0 ml-3">
                  <button data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors" title="Di chuyển lên">
                    ${icons.arrowUp}
                  </button>
                  <button data-action="down" data-index="${index}" ${index === imageFiles.length - 1 ? 'disabled' : ''} class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors" title="Di chuyển xuống">
                    ${icons.arrowDown}
                  </button>
                  <button data-action="delete" data-index="${index}" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1" title="Xóa ảnh">
                    ${icons.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Action bar -->
          <div class="p-4 bg-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <span class="text-xs text-slate-500">Tạo tệp PDF gồm ${imageFiles.length} trang tương ứng</span>
            <button id="convert-btn" ${imageFiles.length === 0 || isProcessing ? 'disabled' : ''} class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.imgToPdf} Chuyển đổi thành PDF
            </button>
          </div>
        </div>

        <!-- Result View -->
        <div id="result-container" class="hidden p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-center">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            ${icons.checkCircle}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">Tạo tệp PDF thành công!</h3>
            <p id="result-details" class="text-sm text-slate-500 mt-1"></p>
          </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button id="download-result-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
              ${icons.download} Tải xuống ngay
            </button>
            <button id="reset-btn" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">
              ${icons.refresh} Chuyển đổi thêm
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
    const convertBtn = container.querySelector('#convert-btn');
    const resetBtn = container.querySelector('#reset-btn');
    const pageSizeSelect = container.querySelector('#page-size-select');
    const marginSelect = container.querySelector('#margin-select');

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
        if (e.dataTransfer.files) handleAddImages(Array.from(e.dataTransfer.files));
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files) handleAddImages(Array.from(e.target.files));
      });
    }

    if (fileInputMore) {
      fileInputMore.addEventListener('change', (e) => {
        if (e.target.files) handleAddImages(Array.from(e.target.files));
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        imageFiles = [];
        render();
      });
    }

    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        pageSize = e.target.value;
      });
    }

    if (marginSelect) {
      marginSelect.addEventListener('change', (e) => {
        marginSize = parseInt(e.target.value, 10);
      });
    }

    // List actions
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (action === 'up' && index > 0) {
          const temp = imageFiles[index];
          imageFiles[index] = imageFiles[index - 1];
          imageFiles[index - 1] = temp;
          render();
        } else if (action === 'down' && index < imageFiles.length - 1) {
          const temp = imageFiles[index];
          imageFiles[index] = imageFiles[index + 1];
          imageFiles[index + 1] = temp;
          render();
        } else if (action === 'delete') {
          imageFiles.splice(index, 1);
          render();
        }
      });
    });

    if (convertBtn) {
      convertBtn.addEventListener('click', handleConvert);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        imageFiles = [];
        render();
      });
    }
  }

  async function handleAddImages(newFiles) {
    const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Vui lòng chọn đúng tệp hình ảnh (JPG, PNG, WebP).');
      return;
    }

    for (const file of validFiles) {
      const item = {
        id: Math.random().toString(36).substring(2),
        file,
        name: file.name,
        size: file.size,
        dataUrl: null,
        width: 0,
        height: 0
      };
      imageFiles.push(item);
    }
    render();

    // Load thumbnails & dimensions
    for (const item of imageFiles) {
      if (!item.dataUrl) {
        try {
          const dataUrl = await readFileAsDataURL(item.file);
          item.dataUrl = dataUrl;
          const img = new Image();
          await new Promise((res) => {
            img.onload = () => {
              item.width = img.naturalWidth;
              item.height = img.naturalHeight;
              res();
            };
            img.src = dataUrl;
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
    render();
  }

  async function handleConvert() {
    if (imageFiles.length === 0) return;

    isProcessing = true;
    updateProgress(5, 'Đang chuẩn bị tài liệu PDF...');

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < imageFiles.length; i++) {
        const item = imageFiles[i];
        const percent = 5 + Math.round(((i) / imageFiles.length) * 80);
        updateProgress(percent, `Đang xử lý ảnh ${i + 1}/${imageFiles.length}...`);

        let imageBytes;
        let isPng = item.file.type === 'image/png';
        let isJpg = item.file.type === 'image/jpeg' || item.file.type === 'image/jpg';

        if (isJpg) {
          imageBytes = await readFileAsArrayBuffer(item.file);
        } else if (isPng) {
          imageBytes = await readFileAsArrayBuffer(item.file);
        } else {
          // Convert WebP or other formats to PNG via Canvas
          const canvas = document.createElement('canvas');
          canvas.width = item.width || 800;
          canvas.height = item.height || 600;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.src = item.dataUrl;
          await new Promise(r => img.onload = r);
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          imageBytes = await blob.arrayBuffer();
          isPng = true;
        }

        let embeddedImage;
        try {
          if (isPng) {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
        } catch (embedErr) {
          // Fallback via Canvas PNG
          console.warn('Fallback embedding image via Canvas:', embedErr);
          const canvas = document.createElement('canvas');
          canvas.width = item.width || 800;
          canvas.height = item.height || 600;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.src = item.dataUrl;
          await new Promise(r => img.onload = r);
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const fallbackBytes = await blob.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(fallbackBytes);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth, pageHeight;
        if (pageSize === 'a4-portrait') {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (pageSize === 'a4-landscape') {
          pageWidth = PageSizes.A4[1];
          pageHeight = PageSizes.A4[0];
        } else {
          // Fit image size
          pageWidth = imgWidth + marginSize * 2;
          pageHeight = imgHeight + marginSize * 2;
        }

        const availWidth = pageWidth - marginSize * 2;
        const availHeight = pageHeight - marginSize * 2;

        // Scale keeping aspect ratio
        const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;

        // Center on page
        const x = marginSize + (availWidth - drawWidth) / 2;
        const y = marginSize + (availHeight - drawHeight) / 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });
      }

      updateProgress(90, 'Đang lưu tệp PDF hoàn chỉnh...');
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      updateProgress(100, 'Tạo PDF hoàn tất!');

      setTimeout(() => {
        resetProgress();
        showResult(pdfBlob, imageFiles.length);
      }, 300);

    } catch (err) {
      console.error('Lỗi chuyển ảnh sang PDF:', err);
      alert('Đã xảy ra lỗi: ' + err.message);
      resetProgress();
    } finally {
      isProcessing = false;
    }
  }

  function showResult(blob, count) {
    const resultContainer = container.querySelector('#result-container');
    const resultDetails = container.querySelector('#result-details');
    const downloadBtn = container.querySelector('#download-result-btn');

    resultDetails.textContent = `Tài liệu đã tạo: ${count} trang • Dung lượng: ${formatBytes(blob.size)}`;
    resultContainer.classList.remove('hidden');

    downloadBtn.onclick = () => {
      downloadBlob(blob, 'HinhAnh_ChuyenDoi.pdf');
    };

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  render();
}
