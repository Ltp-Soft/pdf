/**
 * Khối quảng cáo cho các sản phẩm của LTP Soft (ltp-soft.com, tax.ltp-soft.com).
 * Mọi link đều gắn UTM để đo lượng khách từ pdf.ltp-soft.com trong Google Analytics / Cloudflare.
 */
import { adUrl, taxUrl } from './seo/routes.js';

const check = `<svg class="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>`;

const ext = 'target="_blank" rel="noopener" data-ad-click';

/** Thanh thông báo mỏng ngay dưới header (hiện trên mọi màn hình). */
export function renderTopPromo() {
  return `
    <a href="${adUrl('/', 'top_bar')}" ${ext} data-ad="top_bar"
       class="block bg-gradient-to-r from-rose-700 via-rose-600 to-blue-700 text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-center">
        <span class="hidden md:inline whitespace-nowrap px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider">Tài trợ bởi LTP Soft</span>
        <span class="hidden sm:inline">Phần mềm chấm công QR &amp; GPS – Không giới hạn nhân sự. <u>Dùng thử miễn phí 60 ngày →</u></span>
        <span class="sm:hidden">Chấm công QR &amp; GPS – <u>Dùng thử miễn phí →</u></span>
      </div>
    </a>`;
}

/** Thẻ quảng cáo chính LTP Attendance. */
function attendanceCard(placement) {
  return `
    <div class="relative overflow-hidden rounded-2xl bg-slate-950 text-white p-5 shadow-lg border border-slate-800">
      <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-rose-600/30 blur-3xl" aria-hidden="true"></div>
      <div class="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-blue-600/30 blur-3xl" aria-hidden="true"></div>
      <div class="relative space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-300">LTP Attendance</span>
          <span class="text-[10px] text-slate-400">Quảng cáo</span>
        </div>
        <p class="text-lg font-black leading-snug">Phần mềm chấm công QR &amp; GPS<br/><span class="text-amber-300">Không giới hạn nhân sự</span></p>
        <ul class="space-y-1.5 text-[13px] text-slate-200">
          <li class="flex gap-2">${check}<span>Chấm công Offline 100%, quét QR qua Zalo/Camera – không cần cài app</span></li>
          <li class="flex gap-2">${check}<span>Tính phí theo Điểm QR, không tính theo đầu người</span></li>
          <li class="flex gap-2">${check}<span>Ghim vị trí công trình GPS trong 5 giây</span></li>
          <li class="flex gap-2">${check}<span>AI tự tạo công thức lương từ file Excel</span></li>
        </ul>
        <a href="${adUrl('/', placement + '_cta')}" ${ext} data-ad="${placement}_cta"
           class="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold shadow-md shadow-rose-900/40 transition-colors">
          Dùng thử miễn phí 60 ngày →
        </a>
        <p class="text-center text-[11px] text-slate-400">Tiết kiệm 100% chi phí máy vân tay</p>
      </div>
    </div>`;
}

function solutionsCard(placement) {
  const items = [
    ['/giai-phap/cham-cong-cong-trinh-xay-dung/', '<svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/></svg>', 'Chấm công công trình xây dựng', 'Chống gian lận, chấm công đội thợ'],
    ['/giai-phap/cham-cong-chuoi-cua-hang-fnb/', '<svg class="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', 'Chấm công chuỗi cửa hàng F&amp;B', 'Ca gãy, nhiều chi nhánh'],
    ['/giai-phap/ai-tu-dong-tinh-luong-excel/', '<svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>', 'AI tự động tính lương Excel', 'Mô tả bằng tiếng Việt là xong'],
  ];
  return `
    <div class="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Giải pháp từ LTP Soft</p>
      <ul class="divide-y divide-slate-100">
        ${items
          .map(
            ([p, emo, title, sub], i) => `
          <li>
            <a href="${adUrl(p, `${placement}_solution_${i + 1}`)}" ${ext} data-ad="${placement}_solution_${i + 1}"
               class="flex items-start gap-3 py-2.5 group">
              <span class="shrink-0 mt-0.5">${emo}</span>
              <span>
                <span class="block text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">${title}</span>
                <span class="block text-xs text-slate-500">${sub}</span>
              </span>
            </a>
          </li>`
          )
          .join('')}
      </ul>
    </div>`;
}

function taxCard(placement) {
  return `
    <a href="${taxUrl(placement)}" ${ext} data-ad="${placement}_tax"
       class="block rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-4 shadow-sm hover:border-blue-300 transition-colors group">
      <p class="text-[10px] font-bold uppercase tracking-wider text-blue-700">Cho kế toán • LTP TaxSync</p>
      <p class="mt-1 text-sm font-bold text-slate-800 group-hover:text-blue-700">Tải &amp; tổng hợp hoá đơn thuế tự động ra Excel 2 sheet</p>
      <p class="mt-1 text-xs text-slate-500">Giải captcha tự động bằng AI • tax.ltp-soft.com →</p>
    </a>`;
}

/** Sidebar quảng cáo (màn hình lớn). */
export function renderSidebarAds() {
  return `
    <div class="space-y-4">
      ${attendanceCard('sidebar')}
      ${solutionsCard('sidebar')}
      ${taxCard('sidebar')}
    </div>`;
}

/** Banner ngang (mobile/tablet hoặc trang cần bề ngang rộng). */
export function renderInlineAds() {
  return `
    <div class="grid gap-4 md:grid-cols-2">
      ${attendanceCard('inline')}
      <div class="space-y-4">
        ${solutionsCard('inline')}
        ${taxCard('inline')}
      </div>
    </div>`;
}

/** Ghi nhận click quảng cáo (nếu đã cấu hình GA4). */
export function bindAdTracking(root = document) {
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ad-click]');
    if (!a) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'ad_click', {
        ad_placement: a.getAttribute('data-ad') || 'unknown',
        link_url: a.href,
      });
    }
  });
}
