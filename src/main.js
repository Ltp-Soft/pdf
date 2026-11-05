import { icons } from './utils/icons.js';
import { createMergeTool } from './tools/merge.js';
import { createOrganizeTool } from './tools/organize.js';
import { createSplitTool } from './tools/split.js';
import { createCompressTool } from './tools/compress.js';
import { createPdfToImgTool } from './tools/pdfToImg.js';
import { createImgToPdfTool } from './tools/imgToPdf.js';
import { createRotateTool } from './tools/rotate.js';

// Application State
const state = {
  currentTool: null, // null = home, or 'merge' | 'split' | 'compress' | 'pdfToImg' | 'imgToPdf' | 'rotate'
};

// Tools metadata
const tools = [
  {
    id: 'merge',
    name: 'Nối PDF',
    subtitle: 'Merge PDF',
    desc: 'Ghép nhiều tệp PDF lại với nhau theo thứ tự mong muốn trong chớp mắt.',
    icon: icons.merge,
    color: 'indigo',
    badge: 'Phổ biến',
    create: createMergeTool
  },
  {
    id: 'organize',
    name: 'Ghép trang 2 cửa sổ',
    subtitle: 'Two-Panel Page Merge',
    desc: 'Mở 2 file PDF hai bên, bốc kéo thả từng trang từ file này chèn vào giữa trang file kia.',
    icon: icons.organize,
    color: 'sky',
    badge: 'Mới & Trực quan',
    create: createOrganizeTool
  },
  {
    id: 'split',
    name: 'Tách PDF',
    subtitle: 'Split PDF',
    desc: 'Trích xuất khoảng trang cụ thể hoặc tách riêng lẻ từng trang vào file ZIP.',
    icon: icons.split,
    color: 'emerald',
    badge: 'Nhanh chóng',
    create: createSplitTool
  },
  {
    id: 'compress',
    name: 'Nén PDF',
    subtitle: 'Compress PDF',
    desc: 'Giảm tối đa dung lượng tệp PDF bằng thuật toán nén canvas thông minh.',
    icon: icons.compress,
    color: 'rose',
    badge: 'Tiết kiệm 80%',
    create: createCompressTool
  },
  {
    id: 'pdfToImg',
    name: 'PDF sang Ảnh',
    subtitle: 'PDF to Image',
    desc: 'Chuyển đổi từng trang PDF thành ảnh JPG hoặc PNG sắc nét, nén gói ZIP.',
    icon: icons.pdfToImg,
    color: 'amber',
    badge: 'Chất lượng HD',
    create: createPdfToImgTool
  },
  {
    id: 'imgToPdf',
    name: 'Ảnh sang PDF',
    subtitle: 'Images to PDF',
    desc: 'Gộp nhiều hình ảnh JPG, PNG, WebP thành một file PDF chuẩn khổ A4.',
    icon: icons.imgToPdf,
    color: 'violet',
    badge: 'Khổ A4/Tự do',
    create: createImgToPdfTool
  },
  {
    id: 'rotate',
    name: 'Xoay trang PDF',
    subtitle: 'Rotate PDF',
    desc: 'Xoay toàn bộ hoặc các trang lẻ/chẵn theo góc 90°, 180° không giảm chất lượng.',
    icon: icons.rotate,
    color: 'cyan',
    badge: 'Lossless',
    create: createRotateTool
  }
];

// DOM Root
const app = document.getElementById('app');

function initApp() {
  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <!-- Navbar -->
      <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-shadow">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" id="brand-link" class="flex items-center gap-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              ${icons.filePdf}
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">PDF Free</span>
              <span class="text-[10px] text-slate-400 font-medium -mt-1">Xử lý PDF trực tiếp tại trình duyệt</span>
            </div>
          </a>

          <div class="flex items-center gap-3">
            <div class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              ${icons.shield}
              100% Client-side • Bảo mật tuyệt đối
            </div>
          </div>
        </div>
      </header>

      <!-- Global Progress Modal -->
      <div id="progress-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300">
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 transform scale-95 transition-all duration-300" id="progress-box">
          <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            ${icons.refresh}
          </div>
          <div>
            <h4 class="text-base font-bold text-slate-800" id="progress-title">Đang xử lý tệp của bạn...</h4>
            <p class="text-xs text-slate-500 mt-1" id="progress-message">Vui lòng chờ trong giây lát</p>
          </div>

          <!-- Bar -->
          <div class="space-y-1.5">
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div id="progress-fill" class="bg-indigo-600 h-full rounded-full transition-all duration-200 w-0"></div>
            </div>
            <div class="flex justify-between text-[11px] font-medium text-slate-400">
              <span>Tiến trình</span>
              <span id="progress-percent">0%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <!-- Breadcrumb / Back button -->
        <div id="nav-back-container" class="hidden mb-6">
          <button id="nav-back-btn" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-xs transition-all">
            ${icons.arrowLeft} Quay lại danh sách công cụ
          </button>
        </div>

        <!-- Tool Container -->
        <div id="tool-container" class="hidden"></div>

        <!-- Home View -->
        <div id="home-view" class="space-y-10">
          <!-- Hero Section -->
          <div class="text-center max-w-2xl mx-auto space-y-3 pt-4 sm:pt-8">
            <div class="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              ⚡ Nhanh • Miễn phí • Không giới hạn dung lượng
            </div>
            <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Công cụ xử lý PDF <span class="text-indigo-600">toàn diện & an toàn</span>
            </h1>
            <p class="text-base text-slate-600">
              Mọi tác vụ được xử lý 100% trực tiếp trên trình duyệt của bạn với thư viện chuẩn mã nguồn mở. File của bạn không bao giờ được gửi lên bất kỳ máy chủ nào.
            </p>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            ${tools.map(tool => `
              <div data-tool-id="${tool.id}" class="tool-card group bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 rounded-2xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                      ${tool.icon}
                    </div>
                    <span class="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-full transition-colors">
                      ${tool.badge}
                    </span>
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    ${tool.name}
                  </h3>
                  <p class="text-xs font-medium text-slate-400 mb-2">${tool.subtitle}</p>
                  <p class="text-sm text-slate-500 leading-relaxed">${tool.desc}</p>
                </div>

                <div class="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-indigo-600">
                  <span>Sử dụng ngay</span>
                  <span class="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Security & Privacy Banner -->
          <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="space-y-2 text-center md:text-left">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
                ${icons.shield} Bảo vệ dữ liệu cá nhân
              </div>
              <h3 class="text-xl font-bold">Cam kết quyền riêng tư 100%</h3>
              <p class="text-sm text-slate-300 max-w-xl">
                Khác với các dịch vụ trực tuyến thông thường, PDF Free chạy hoàn toàn trên WebAssembly và JavaScript nội bộ trình duyệt. Tài liệu, hóa đơn, thông tin nhạy cảm của bạn luôn nằm an toàn trên thiết bị của bạn.
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-3 text-xs text-slate-300 bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-xs border border-white/10">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              <span>Máy chủ: Không kết nối • Client-side</span>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 PDF Free • Mã nguồn mở xử lý PDF trên trình duyệt (pdf-lib, pdfjs-dist, JSZip).</p>
          <div class="flex items-center gap-4">
            <span class="text-emerald-600 font-medium flex items-center gap-1">${icons.shield} Client-side Only</span>
            <a href="https://pages.cloudflare.com/" target="_blank" rel="noopener" class="hover:text-indigo-600 transition-colors">Cloudflare Pages Ready</a>
          </div>
        </div>
      </footer>
    </div>
  `;

  bindGlobalEvents();
}

// Progress helpers
const progressModal = () => document.getElementById('progress-modal');
const progressBox = () => document.getElementById('progress-box');
const progressFill = () => document.getElementById('progress-fill');
const progressPercent = () => document.getElementById('progress-percent');
const progressMessage = () => document.getElementById('progress-message');

function updateProgress(percent, message) {
  const modal = progressModal();
  const box = progressBox();
  if (modal && box) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-95');
  }

  const fill = progressFill();
  const pct = progressPercent();
  const msg = progressMessage();

  if (fill) fill.style.width = `${percent}%`;
  if (pct) pct.textContent = `${percent}%`;
  if (msg && message) msg.textContent = message;
}

function resetProgress() {
  const modal = progressModal();
  const box = progressBox();
  if (modal && box) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    box.classList.add('scale-95');
  }
  const fill = progressFill();
  const pct = progressPercent();
  if (fill) fill.style.width = '0%';
  if (pct) pct.textContent = '0%';
}

function switchView(toolId) {
  state.currentTool = toolId;
  const homeView = document.getElementById('home-view');
  const toolContainer = document.getElementById('tool-container');
  const navBackContainer = document.getElementById('nav-back-container');

  if (!toolId) {
    // Show Home
    homeView.classList.remove('hidden');
    toolContainer.classList.add('hidden');
    navBackContainer.classList.add('hidden');
    toolContainer.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Show Tool
  homeView.classList.add('hidden');
  toolContainer.classList.remove('hidden');
  navBackContainer.classList.remove('hidden');
  toolContainer.innerHTML = '';

  const toolMeta = tools.find(t => t.id === toolId);
  if (toolMeta && typeof toolMeta.create === 'function') {
    toolMeta.create(toolContainer, {
      updateProgress,
      resetProgress
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindGlobalEvents() {
  // Brand link -> return to home
  const brandLink = document.getElementById('brand-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(null);
    });
  }

  // Back button
  const backBtn = document.getElementById('nav-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchView(null);
    });
  }

  // Tool cards click
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.getAttribute('data-tool-id');
      switchView(toolId);
    });
  });
}

// Start app
initApp();
