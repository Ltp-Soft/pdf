import { icons } from './utils/icons.js';
import { createMergeTool } from './tools/merge.js';
import { createOrganizeTool } from './tools/organize.js';
import { createSplitTool } from './tools/split.js';
import { createCompressTool } from './tools/compress.js';
import { createPdfToImgTool } from './tools/pdfToImg.js';
import { createImgToPdfTool } from './tools/imgToPdf.js';
import { createRotateTool } from './tools/rotate.js';
import { SITE, HOME, TOOL_ROUTES, findToolIdByPath, adUrl, taxUrl } from './seo/routes.js';
import { renderTopPromo, renderSidebarAds, renderInlineAds, bindAdTracking } from './ads.js';

// Application State
const state = {
  currentTool: null, // null = home, or 'merge' | 'split' | 'compress' | 'pdfToImg' | 'imgToPdf' | 'rotate'
};

// Tools metadata
const tools = [
  {
    id: 'merge',
    name: 'Ghép file PDF',
    subtitle: 'Merge PDF',
    desc: 'Ghép nhiều tệp PDF lại với nhau theo thứ tự mong muốn trong chớp mắt.',
    icon: icons.merge,
    color: 'indigo',
    badge: 'Phổ biến',
    create: createMergeTool
  },
  {
    id: 'organize',
    name: 'Chèn trang PDF (2 cửa sổ)',
    subtitle: 'Two-Panel Page Merge',
    desc: 'Mở 2 file PDF hai bên, bốc kéo thả từng trang từ file này chèn vào giữa trang file kia.',
    icon: icons.organize,
    color: 'sky',
    badge: 'Mới & Trực quan',
    wide: true, // cần bề ngang rộng -> ẩn sidebar quảng cáo, chuyển xuống dưới
    create: createOrganizeTool
  },
  {
    id: 'split',
    name: 'Tách file PDF',
    subtitle: 'Split PDF',
    desc: 'Trích xuất khoảng trang cụ thể hoặc tách riêng lẻ từng trang vào file ZIP.',
    icon: icons.split,
    color: 'emerald',
    badge: 'Nhanh chóng',
    create: createSplitTool
  },
  {
    id: 'compress',
    name: 'Nén file PDF',
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
    subtitle: 'PDF to JPG / PNG',
    desc: 'Chuyển đổi từng trang PDF thành ảnh JPG hoặc PNG sắc nét, nén gói ZIP.',
    icon: icons.pdfToImg,
    color: 'amber',
    badge: 'Chất lượng HD',
    create: createPdfToImgTool
  },
  {
    id: 'imgToPdf',
    name: 'Ảnh sang PDF',
    subtitle: 'JPG / PNG to PDF',
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

const year = new Date().getFullYear();

// DOM Root
const app = document.getElementById('app');

function faqHtml(faqs) {
  return faqs
    .map(
      (f) => `
      <details class="group bg-white border border-slate-200 rounded-xl p-4 open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-800 text-sm">
          <h3 class="text-sm font-semibold">${f.q}</h3>
          <span class="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
        </summary>
        <p class="mt-2 text-sm text-slate-600 leading-relaxed">${f.a}</p>
      </details>`
    )
    .join('');
}

function initApp() {
  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-rose-600 selection:text-white font-sans antialiased">
      <!-- Navbar -->
      <header class="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-lg shadow-slate-950/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" id="brand-link" class="flex items-center gap-3 group min-w-0" aria-label="LTP PDF - Trang chủ">
            <picture>
              <source srcset="/brand/ltp-soft-logo.webp 1x, /brand/ltp-soft-logo@2x.webp 2x" type="image/webp" />
              <img src="/brand/ltp-soft-logo.png" srcset="/brand/ltp-soft-logo.png 1x, /brand/ltp-soft-logo@2x.png 2x"
                   alt="LTP Soft" width="77" height="40" class="h-10 w-auto shrink-0 group-hover:scale-105 transition-transform" />
            </picture>
            <span class="hidden min-[400px]:block h-8 w-px bg-slate-700"></span>
            <span class="flex flex-col min-w-0">
              <span class="flex items-center gap-2">
                <span class="text-lg sm:text-xl font-black tracking-tight text-white">LTP <span class="text-rose-500">PDF</span></span>
                <span class="hidden sm:inline text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-full border border-emerald-500/30">MIỄN PHÍ</span>
              </span>
              <span class="text-[11px] text-slate-400 font-medium -mt-0.5 truncate">pdf.ltp-soft.com • Ghép file PDF không cần đăng ký</span>
            </span>
          </a>

          <nav class="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Điều hướng chính">
            <span class="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800">
              ${icons.shield}
              100% xử lý trên trình duyệt
            </span>
            <a href="${adUrl('/', 'header_btn')}" target="_blank" rel="noopener" data-ad-click data-ad="header_btn"
               class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/40 transition-colors">
              <span class="hidden sm:inline">Phần mềm</span> Chấm công QR
            </a>
          </nav>
        </div>
      </header>

      ${renderTopPromo()}

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

      <!-- Main + Sidebar quảng cáo -->
      <div id="layout" class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8">
        <main class="min-w-0">
          <!-- Breadcrumb / Back button -->
          <div id="nav-back-container" class="hidden mb-6">
            <a href="/" id="nav-back-btn" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-xs transition-all">
              ${icons.arrowLeft} Quay lại danh sách công cụ
            </a>
          </div>

          <!-- Tool Container -->
          <div id="tool-container" class="hidden"></div>

          <!-- Hướng dẫn + FAQ riêng cho từng công cụ (SEO) -->
          <section id="tool-seo" class="hidden mt-12 grid gap-6 md:grid-cols-2"></section>

          <!-- Home View -->
          <div id="home-view" class="space-y-10">
            <!-- Hero Section -->
            <div class="text-center max-w-3xl mx-auto space-y-3 pt-2 sm:pt-6">
              <div class="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-100">
                ⚡ Miễn phí • Không cần đăng ký • Không giới hạn • Không watermark
              </div>
              <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Ghép file PDF <span class="bg-gradient-to-r from-rose-600 to-blue-700 bg-clip-text text-transparent">miễn phí, không cần đăng ký</span>
              </h1>
              <p class="text-base text-slate-600">${HOME.intro}</p>
              <div class="pt-2">
                <a href="${TOOL_ROUTES.merge.path}" data-tool-id="merge" class="tool-link inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 transition-colors">
                  ${icons.merge} Ghép file PDF ngay
                </a>
              </div>
            </div>

            <!-- Cards Grid -->
            <section aria-labelledby="tools-heading">
              <h2 id="tools-heading" class="sr-only">Các công cụ PDF miễn phí</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${tools.map(tool => `
                  <a href="${TOOL_ROUTES[tool.id].path}" data-tool-id="${tool.id}" class="tool-link tool-card group bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 rounded-2xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between">
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
                  </a>
                `).join('')}
              </div>
            </section>

            <!-- Security & Privacy Banner -->
            <div class="bg-gradient-to-r from-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div class="space-y-2 text-center md:text-left">
                <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
                  ${icons.shield} Bảo vệ dữ liệu cá nhân
                </div>
                <h2 class="text-xl font-bold">Cam kết quyền riêng tư 100%</h2>
                <p class="text-sm text-slate-300 max-w-xl">
                  Khác với các dịch vụ trực tuyến thông thường, LTP PDF chạy hoàn toàn bằng JavaScript ngay trong trình duyệt. Tài liệu, hóa đơn, hợp đồng của bạn luôn nằm an toàn trên thiết bị – không tải lên bất kỳ máy chủ nào.
                </p>
              </div>
              <div class="shrink-0 flex items-center gap-3 text-xs text-slate-300 bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-xs border border-white/10">
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                <span>Máy chủ: Không kết nối • Client-side</span>
              </div>
            </div>

            <!-- FAQ trang chủ (khớp với JSON-LD FAQPage) -->
            <section aria-labelledby="faq-heading" class="space-y-4">
              <h2 id="faq-heading" class="text-2xl font-bold text-slate-900">Câu hỏi thường gặp về ghép file PDF</h2>
              <div class="grid gap-3">${faqHtml(HOME.faqs)}</div>
            </section>
          </div>

          <!-- Quảng cáo dạng banner (hiện khi không có sidebar) -->
          <section id="inline-ads" class="mt-12 xl:hidden" aria-label="Sản phẩm từ LTP Soft">
            ${renderInlineAds()}
          </section>
        </main>

        <!-- Sidebar quảng cáo -->
        <aside id="sidebar-ads" class="hidden xl:block" aria-label="Sản phẩm từ LTP Soft">
          <div class="sticky top-24">
            ${renderSidebarAds()}
          </div>
        </aside>
      </div>

      <!-- Footer -->
      <footer class="bg-slate-950 text-slate-400 border-t border-slate-800 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div class="space-y-3 lg:col-span-1">
            <img src="/brand/ltp-soft-logo.png" alt="LTP Soft" width="92" height="48" class="h-12 w-auto" loading="lazy" />
            <p class="text-xs leading-relaxed">LTP PDF – bộ công cụ ghép, tách, nén, chuyển đổi PDF miễn phí, không cần đăng ký. Một sản phẩm của LTP Soft.</p>
          </div>
          <div>
            <p class="text-white font-semibold mb-3">Công cụ PDF</p>
            <ul class="space-y-1.5">
              ${tools.map(t => `<li><a href="${TOOL_ROUTES[t.id].path}" data-tool-id="${t.id}" class="tool-link hover:text-white transition-colors">${t.name}</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <p class="text-white font-semibold mb-3">Sản phẩm LTP Soft</p>
            <ul class="space-y-1.5">
              <li><a href="${adUrl('/', 'footer')}" target="_blank" rel="noopener" data-ad-click data-ad="footer_home" class="hover:text-white transition-colors">Phần mềm chấm công QR &amp; GPS</a></li>
              <li><a href="${adUrl('/giai-phap/cham-cong-cong-trinh-xay-dung/', 'footer')}" target="_blank" rel="noopener" data-ad-click data-ad="footer_xd" class="hover:text-white transition-colors">Chấm công công trình xây dựng</a></li>
              <li><a href="${adUrl('/giai-phap/cham-cong-chuoi-cua-hang-fnb/', 'footer')}" target="_blank" rel="noopener" data-ad-click data-ad="footer_fnb" class="hover:text-white transition-colors">Chấm công chuỗi F&amp;B</a></li>
              <li><a href="${adUrl('/giai-phap/ai-tu-dong-tinh-luong-excel/', 'footer')}" target="_blank" rel="noopener" data-ad-click data-ad="footer_ai" class="hover:text-white transition-colors">AI tính lương Excel</a></li>
              <li><a href="${taxUrl('footer')}" target="_blank" rel="noopener" data-ad-click data-ad="footer_tax" class="hover:text-white transition-colors">LTP TaxSync – Tải hoá đơn thuế</a></li>
            </ul>
          </div>
          <div class="space-y-2">
            <p class="text-white font-semibold mb-3">Bảo mật</p>
            <p class="text-emerald-400 font-semibold flex items-center gap-1 text-xs">${icons.shield} 100% Client-side Processing</p>
            <p class="text-xs">File của bạn không được tải lên máy chủ.</p>
            <p class="text-xs">Liên hệ: <a href="mailto:${SITE.email}" class="hover:text-white underline">${SITE.email}</a></p>
          </div>
        </div>
        <div class="border-t border-slate-800">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>© ${year} <a href="https://ltp-soft.com/" class="text-slate-300 hover:text-white font-semibold">LTP Soft</a>. Tất cả quyền được bảo lưu.</p>
            <a href="/" class="text-slate-300 hover:text-white font-semibold">${SITE.domainLabel}</a>
          </div>
        </div>
      </footer>
    </div>
  `;

  bindGlobalEvents();
  bindAdTracking(document);
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

// ---------- SEO: cập nhật <head> khi chuyển trang phía client ----------
function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function updateHead(page) {
  const url = SITE.url + page.path;
  document.title = page.title;
  setMeta('meta[name="description"]', 'content', page.description);
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[property="og:title"]', 'content', page.title);
  setMeta('meta[property="og:description"]', 'content', page.description);
  setMeta('meta[name="twitter:title"]', 'content', page.title);
  setMeta('meta[name="twitter:description"]', 'content', page.description);
}

function renderToolSeo(toolId) {
  const box = document.getElementById('tool-seo');
  const r = toolId && TOOL_ROUTES[toolId];
  if (!box) return;
  if (!r) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 class="text-lg font-bold text-slate-900 mb-3">Cách ${r.h1.charAt(0).toLowerCase() + r.h1.slice(1)}</h2>
      <ol class="list-decimal list-inside space-y-2 text-sm text-slate-600">
        ${r.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <p class="mt-4 text-xs text-slate-500">${r.description}</p>
    </div>
    <div class="space-y-3">
      <h2 class="text-lg font-bold text-slate-900">Câu hỏi thường gặp</h2>
      ${faqHtml(r.faqs)}
    </div>`;
  box.classList.remove('hidden');
}

function setLayoutWide(isWide) {
  const layout = document.getElementById('layout');
  const sidebar = document.getElementById('sidebar-ads');
  const inline = document.getElementById('inline-ads');
  if (!layout || !sidebar || !inline) return;
  layout.classList.toggle('xl:grid-cols-[minmax(0,1fr)_300px]', !isWide);
  sidebar.classList.toggle('xl:block', !isWide);
  inline.classList.toggle('xl:hidden', !isWide);
}

function switchView(toolId) {
  state.currentTool = toolId;
  const homeView = document.getElementById('home-view');
  const toolContainer = document.getElementById('tool-container');
  const navBackContainer = document.getElementById('nav-back-container');
  const toolMeta = toolId ? tools.find(t => t.id === toolId) : null;

  updateHead(toolMeta ? TOOL_ROUTES[toolId] : HOME);
  renderToolSeo(toolMeta ? toolId : null);
  setLayoutWide(Boolean(toolMeta && toolMeta.wide));

  if (!toolMeta) {
    // Show Home
    state.currentTool = null;
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

  if (typeof toolMeta.create === 'function') {
    toolMeta.create(toolContainer, {
      updateProgress,
      resetProgress
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Router (History API, URL thân thiện SEO) ----------
function navigate(path) {
  if (location.pathname !== path) {
    history.pushState({}, '', path);
  }
  switchView(findToolIdByPath(path));
}

function isPlainLeftClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

function bindGlobalEvents() {
  // Logo, nút quay lại, thẻ công cụ, link footer -> điều hướng nội bộ không tải lại trang
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a#brand-link, a#nav-back-btn, a.tool-link, footer a[href="/"]');
    if (!a || !isPlainLeftClick(e)) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });

  window.addEventListener('popstate', () => {
    switchView(findToolIdByPath(location.pathname));
  });
}

// Start app
initApp();
switchView(findToolIdByPath(location.pathname));
