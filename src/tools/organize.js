import { PDFDocument, degrees } from 'pdf-lib';
import { icons } from '../utils/icons.js';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, getOutputFilename } from '../utils/helpers.js';
import { loadPdfDocument, renderPageToCanvas } from '../utils/pdfHelper.js';

export function createOrganizeTool(container, { updateProgress, resetProgress }) {
  // Documents state
  const docs = {
    A: {
      file: null,
      arrayBuffer: null,
      pdfLibDoc: null,
      pdfjsDoc: null,
      pages: [] // [{ id, sourceDoc: 'A'|'B', originalIndex: number, originalFile: string, thumbUrl: string }]
    },
    B: {
      file: null,
      arrayBuffer: null,
      pdfLibDoc: null,
      pdfjsDoc: null,
      pages: []
    }
  };

  let draggedItem = null; // { sourcePanel: 'A'|'B', pageId: string, index: number }
  let keepOriginal = false; // Whether to keep copy in source or move
  let isProcessing = false;

  function render() {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">${icons.organize}</span>
              Ghép & Chèn trang trực quan hai cửa sổ
            </h2>
            <p class="text-sm text-slate-500 mt-1">Mở 2 tệp PDF ở hai bên, kéo bốc từng trang từ tệp này chèn vào giữa danh sách trang của tệp kia.</p>
          </div>

          <div class="flex items-center gap-4">
            <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50">
              <input type="checkbox" id="keep-copy-check" ${keepOriginal ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500" />
              <span>Giữ bản sao ở tệp gốc (Copy thay vì Move)</span>
            </label>
          </div>
        </div>

        <!-- Two Panels Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- PANEL A -->
          ${renderPanel('A', 'Cửa sổ 1 (Tệp A)', 'indigo')}

          <!-- PANEL B -->
          ${renderPanel('B', 'Cửa sổ 2 (Tệp B)', 'emerald')}
        </div>

        <!-- Master Export Bar -->
        <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-xs text-slate-500 flex items-center gap-2">
            <span class="p-1.5 bg-slate-100 rounded-lg text-slate-600">${icons.info}</span>
            <span>Bạn có thể kéo thả trực tiếp các trang giữa 2 cửa sổ hoặc bấm mũi tên <b class="text-indigo-600">→</b> / <b class="text-emerald-600">←</b> trên từng trang để chuyển nhanh.</span>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button id="export-a-btn" ${docs.A.pages.length === 0 || isProcessing ? 'disabled' : ''} class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-xs shadow-sm transition-all">
              ${icons.download} Lưu & Tải Cửa sổ 1 (${docs.A.pages.length} trang)
            </button>
            <button id="export-b-btn" ${docs.B.pages.length === 0 || isProcessing ? 'disabled' : ''} class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-xs shadow-sm transition-all">
              ${icons.download} Lưu & Tải Cửa sổ 2 (${docs.B.pages.length} trang)
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderPanel(panelId, title, themeColor) {
    const doc = docs[panelId];
    const isLoaded = !!doc.file;

    return `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full min-h-[500px]">
        <!-- Panel Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3 h-3 rounded-full bg-${themeColor}-500 shrink-0"></span>
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-slate-800">${title}</h3>
              <p class="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">
                ${isLoaded ? `${doc.file.name} (${doc.pages.length} trang)` : 'Chưa tải tệp'}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            ${isLoaded ? `
              <label for="input-file-${panelId}" class="cursor-pointer text-xs text-slate-500 hover:text-indigo-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">
                Đổi tệp
                <input type="file" id="input-file-${panelId}" accept="application/pdf" class="hidden" />
              </label>
              <button data-clear-panel="${panelId}" class="text-xs text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors">
                Xóa hết
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Drop Zone or Pages Grid -->
        ${!isLoaded ? `
          <div id="drop-zone-${panelId}" class="flex-1 border-2 border-dashed border-slate-200 hover:border-${themeColor}-400 bg-slate-50/50 hover:bg-${themeColor}-50/30 transition-all rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
            <input type="file" id="input-file-${panelId}" accept="application/pdf" class="hidden" />
            <div class="p-3 bg-white shadow-xs rounded-full group-hover:scale-110 transition-transform mb-3">
              ${icons.upload}
            </div>
            <p class="text-sm font-semibold text-slate-700">Chọn hoặc Kéo thả tệp PDF vào đây</p>
            <p class="text-xs text-slate-400 mt-1">Các trang sẽ được tạo hình xem trước để bốc ghép</p>
          </div>
        ` : `
          <!-- Pages Container -->
          <div id="pages-list-${panelId}" data-panel="${panelId}" class="pages-drop-target flex-1 overflow-y-auto max-h-[580px] p-2 bg-slate-50/70 rounded-xl border border-slate-100">
            ${doc.pages.length === 0 ? `
              <div class="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>Cửa sổ này đang trống. Kéo trang từ bên kia thả vào đây!</span>
              </div>
            ` : `
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                ${doc.pages.map((page, index) => renderPageTile(page, index, panelId)).join('')}
              </div>
            `}
          </div>
        `}
      </div>
    `;
  }

  function renderPageTile(page, index, panelId) {
    const isTargetA = panelId === 'A';
    const moveOppositeIcon = isTargetA ? icons.arrowRight : icons.arrowLeftSmall;
    const moveOppositeTitle = isTargetA ? 'Chèn sang Cửa sổ 2' : 'Chèn sang Cửa sổ 1';
    const rot = page.rotation || 0;

    return `
      <div 
        draggable="true" 
        data-panel="${panelId}" 
        data-page-id="${page.id}" 
        data-index="${index}" 
        class="page-card group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-2 shadow-xs transition-all cursor-grab active:cursor-grabbing hover:shadow-md select-none"
      >
        <!-- Page Number & Source Badge -->
        <div class="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 px-0.5">
          <div class="flex items-center gap-1">
            <span class="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              #${index + 1}
            </span>
            ${rot > 0 ? `<span class="font-bold text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded">↻ ${rot}°</span>` : ''}
          </div>
          <span class="text-[9px] px-1 py-0.5 rounded ${page.sourceDoc === 'A' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}">
            Từ ${page.sourceDoc} (tr.${page.originalIndex + 1})
          </span>
        </div>

        <!-- Thumbnail Image Container -->
        <div class="aspect-[1/1.4] bg-slate-100 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center relative p-1">
          ${page.thumbUrl ? `
            <img src="${page.thumbUrl}" alt="Trang ${index + 1}" style="transform: rotate(${rot}deg); transition: transform 0.2s ease-in-out;" class="w-full h-full object-contain pointer-events-none" />
          ` : `
            <div class="flex flex-col items-center justify-center text-slate-300">
              <span class="animate-spin text-indigo-400 text-xs">●</span>
            </div>
          `}
        </div>

        <!-- Quick actions floating bar -->
        <div class="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-100">
          <div class="flex items-center gap-0.5">
            <button data-action="up" data-panel="${panelId}" data-index="${index}" ${index === 0 ? 'disabled' : ''} class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-20 rounded" title="Lên">
              ${icons.arrowUp}
            </button>
            <button data-action="down" data-panel="${panelId}" data-index="${index}" ${index === docs[panelId].pages.length - 1 ? 'disabled' : ''} class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-20 rounded" title="Xuống">
              ${icons.arrowDown}
            </button>
          </div>

          <div class="flex items-center gap-0.5">
            <button data-action="rotate-page" data-panel="${panelId}" data-index="${index}" class="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Xoay trang 90°">
              ${icons.rotate}
            </button>
            <button data-action="duplicate" data-panel="${panelId}" data-index="${index}" class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Nhân đôi trang này (Copy x2)">
              ${icons.duplicate}
            </button>
            <button data-action="transfer" data-panel="${panelId}" data-index="${index}" class="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="${moveOppositeTitle}">
              ${moveOppositeIcon}
            </button>
            <button data-action="delete" data-panel="${panelId}" data-index="${index}" class="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded" title="Xóa trang">
              ${icons.trash}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Keep copy checkbox
    const keepCopyCheck = container.querySelector('#keep-copy-check');
    if (keepCopyCheck) {
      keepCopyCheck.addEventListener('change', (e) => {
        keepOriginal = e.target.checked;
      });
    }

    // Panel file inputs & drops
    ['A', 'B'].forEach(panelId => {
      const dropZone = container.querySelector(`#drop-zone-${panelId}`);
      const fileInput = container.querySelector(`#input-file-${panelId}`);
      const clearBtn = container.querySelector(`[data-clear-panel="${panelId}"]`);

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
          if (e.dataTransfer.files?.[0]) handleLoadFile(panelId, e.dataTransfer.files[0]);
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files?.[0]) handleLoadFile(panelId, e.target.files[0]);
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          docs[panelId].pages = [];
          render();
        });
      }
    });

    // Page Cards Drag & Drop
    const pageCards = container.querySelectorAll('.page-card');
    pageCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        const panel = card.getAttribute('data-panel');
        const pageId = card.getAttribute('data-page-id');
        const index = parseInt(card.getAttribute('data-index'), 10);
        draggedItem = { sourcePanel: panel, pageId, index };
        card.classList.add('opacity-40');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(draggedItem));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40');
        draggedItem = null;
        removeDropIndicators();
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeDropIndicators();
        // Determine whether dropping before or after this card
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          card.classList.add('border-t-4', 'border-t-indigo-500');
        } else {
          card.classList.add('border-b-4', 'border-b-indigo-500');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('border-t-4', 'border-t-indigo-500', 'border-b-4', 'border-b-indigo-500');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeDropIndicators();

        if (!draggedItem) return;

        const targetPanel = card.getAttribute('data-panel');
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertIndex = e.clientY < midY ? targetIndex : targetIndex + 1;

        executeDrop(draggedItem, targetPanel, insertIndex);
      });
    });

    // Panel container drop (drop at the end of the panel)
    const dropTargets = container.querySelectorAll('.pages-drop-target');
    dropTargets.forEach(target => {
      target.addEventListener('dragover', (e) => {
        e.preventDefault();
        target.classList.add('bg-indigo-50/50');
      });

      target.addEventListener('dragleave', () => {
        target.classList.remove('bg-indigo-50/50');
      });

      target.addEventListener('drop', (e) => {
        e.preventDefault();
        target.classList.remove('bg-indigo-50/50');
        if (!draggedItem) return;
        const targetPanel = target.getAttribute('data-panel');
        // Drop at the end of the list
        executeDrop(draggedItem, targetPanel, docs[targetPanel].pages.length);
      });
    });

    // Button actions: up, down, delete, transfer
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const panel = btn.getAttribute('data-panel');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const oppositePanel = panel === 'A' ? 'B' : 'A';

        if (action === 'up' && index > 0) {
          const temp = docs[panel].pages[index];
          docs[panel].pages[index] = docs[panel].pages[index - 1];
          docs[panel].pages[index - 1] = temp;
          render();
        } else if (action === 'down' && index < docs[panel].pages.length - 1) {
          const temp = docs[panel].pages[index];
          docs[panel].pages[index] = docs[panel].pages[index + 1];
          docs[panel].pages[index + 1] = temp;
          render();
        } else if (action === 'delete') {
          docs[panel].pages.splice(index, 1);
          render();
        } else if (action === 'duplicate') {
          const item = docs[panel].pages[index];
          const cloned = { ...item, id: `${item.id}_dup_${Math.random().toString(36).substring(2, 6)}` };
          docs[panel].pages.splice(index + 1, 0, cloned);
          render();
        } else if (action === 'rotate-page') {
          const item = docs[panel].pages[index];
          item.rotation = ((item.rotation || 0) + 90) % 360;
          render();
        } else if (action === 'transfer') {
          // Transfer to opposite panel
          const item = docs[panel].pages[index];
          const cloned = { ...item, id: Math.random().toString(36).substring(2) };
          docs[oppositePanel].pages.push(cloned);
          if (!keepOriginal) {
            docs[panel].pages.splice(index, 1);
          }
          render();
        }
      });
    });

    // Export buttons
    const exportABtn = container.querySelector('#export-a-btn');
    const exportBBtn = container.querySelector('#export-b-btn');

    if (exportABtn) {
      exportABtn.addEventListener('click', () => handleExport('A'));
    }
    if (exportBBtn) {
      exportBBtn.addEventListener('click', () => handleExport('B'));
    }
  }

  function removeDropIndicators() {
    container.querySelectorAll('.page-card').forEach(c => {
      c.classList.remove('border-t-4', 'border-t-indigo-500', 'border-b-4', 'border-b-indigo-500');
    });
  }

  function executeDrop(source, targetPanel, targetIndex) {
    const { sourcePanel, index } = source;
    const pageItem = docs[sourcePanel].pages[index];
    if (!pageItem) return;

    if (sourcePanel === targetPanel) {
      // Reordering within the same panel
      docs[sourcePanel].pages.splice(index, 1);
      const adjustedIndex = index < targetIndex ? targetIndex - 1 : targetIndex;
      docs[sourcePanel].pages.splice(adjustedIndex, 0, pageItem);
    } else {
      // Inter-panel transfer / insert!
      const cloned = { ...pageItem, id: Math.random().toString(36).substring(2) };
      docs[targetPanel].pages.splice(targetIndex, 0, cloned);
      if (!keepOriginal) {
        docs[sourcePanel].pages.splice(index, 1);
      }
    }

    render();
  }

  async function handleLoadFile(panelId, file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Vui lòng chọn tệp định dạng PDF.');
      return;
    }

    updateProgress(15, `Đang nạp ${file.name} vào Cửa sổ ${panelId}...`);

    try {
      const ab = await readFileAsArrayBuffer(file);
      docs[panelId].file = file;
      docs[panelId].arrayBuffer = ab;

      // Load both pdf-lib and pdfjs using safe cloned ArrayBuffers
      docs[panelId].pdfLibDoc = await PDFDocument.load(ab.slice(0), { ignoreEncryption: true });
      docs[panelId].pdfjsDoc = await loadPdfDocument(ab.slice(0));

      const total = docs[panelId].pdfjsDoc.numPages;
      docs[panelId].pages = [];

      for (let i = 0; i < total; i++) {
        docs[panelId].pages.push({
          id: `${panelId}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          sourceDoc: panelId,
          originalIndex: i,
          originalFile: file.name,
          thumbUrl: null
        });
      }

      resetProgress();
      render();

      // Render thumbnails in background
      for (let i = 0; i < total; i++) {
        try {
          const rendered = await renderPageToCanvas(docs[panelId].pdfjsDoc, i + 1, 0.35);
          const thumbUrl = rendered.canvas.toDataURL('image/jpeg', 0.7);
          if (docs[panelId].pages[i]) {
            docs[panelId].pages[i].thumbUrl = thumbUrl;
            // Update thumbnail in DOM without full rerender if possible
            const imgEl = container.querySelector(`[data-page-id="${docs[panelId].pages[i].id}"] img`);
            if (imgEl) imgEl.src = thumbUrl;
          }
        } catch (thumbErr) {
          console.warn('Lỗi render thumbnail:', thumbErr);
        }
      }
      render();

    } catch (err) {
      console.error(err);
      alert(`Không thể đọc tệp PDF cho Cửa sổ ${panelId}: ${err.message}`);
      resetProgress();
    }
  }

  async function handleExport(panelId) {
    const pagesToExport = docs[panelId].pages;
    if (pagesToExport.length === 0) {
      alert(`Cửa sổ ${panelId} không có trang nào để xuất.`);
      return;
    }

    isProcessing = true;
    updateProgress(5, `Khởi tạo tệp PDF từ Cửa sổ ${panelId}...`);

    try {
      const newPdf = await PDFDocument.create();

      // Ensure pdfLib documents are loaded
      for (const key of ['A', 'B']) {
        if (!docs[key].pdfLibDoc && docs[key].arrayBuffer) {
          docs[key].pdfLibDoc = await PDFDocument.load(docs[key].arrayBuffer.slice(0), { ignoreEncryption: true });
        }
      }

      for (let i = 0; i < pagesToExport.length; i++) {
        const item = pagesToExport[i];
        const srcDoc = docs[item.sourceDoc]?.pdfLibDoc;

        if (!srcDoc) {
          console.error(`Không tìm thấy tài liệu nguồn ${item.sourceDoc}`);
          continue;
        }

        const percent = 5 + Math.round(((i + 1) / pagesToExport.length) * 80);
        updateProgress(percent, `Đang sao chép trang ${i + 1}/${pagesToExport.length} (từ tệp ${item.sourceDoc})...`);

        const [copiedPage] = await newPdf.copyPages(srcDoc, [item.originalIndex]);
        if (item.rotation) {
          const currentRot = copiedPage.getRotation().angle || 0;
          copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
        }
        newPdf.addPage(copiedPage);
      }

      updateProgress(90, 'Đang lưu tệp PDF hoàn chỉnh...');
      const outputBytes = await newPdf.save();
      const outputBlob = new Blob([outputBytes], { type: 'application/pdf' });
      const filename = `PDF_GhepTrang_${panelId}_${Date.now()}.pdf`;

      updateProgress(100, 'Xuất tệp thành công!');
      setTimeout(() => {
        resetProgress();
        downloadBlob(outputBlob, filename);
      }, 300);

    } catch (err) {
      console.error('Lỗi khi xuất tệp ghép trang:', err);
      alert('Đã xảy ra lỗi khi tạo tệp: ' + err.message);
      resetProgress();
    } finally {
      isProcessing = false;
    }
  }

  render();
}
