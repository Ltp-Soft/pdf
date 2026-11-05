/**
 * Sinh thẻ <head> SEO + nội dung HTML tĩnh cho từng URL (chạy trong Node lúc build
 * và trong dev server). Nội dung tĩnh này giúp các bot KHÔNG chạy JavaScript
 * (Bing, Cốc Cốc, Zalo, Facebook...) vẫn đọc được tiêu đề, mô tả và liên kết.
 * Khi JavaScript chạy, main.js sẽ thay thế bằng giao diện đầy đủ.
 */
import { SITE, HOME, TOOL_ROUTES, allPages } from './routes.js';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

export function renderHead(page) {
  const url = SITE.url + page.path;
  const isHome = page.path === '/';
  const faqs = page.faqs || [];

  const graph = [
    {
      '@type': 'Organization',
      '@id': 'https://ltp-soft.com/#organization',
      name: 'LTP Soft',
      url: 'https://ltp-soft.com/',
      logo: SITE.logo,
      email: SITE.email,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: 'LTP PDF - Ghép file PDF miễn phí',
      inLanguage: 'vi-VN',
      publisher: { '@id': 'https://ltp-soft.com/#organization' },
    },
    {
      '@type': 'WebApplication',
      name: isHome ? 'LTP PDF' : page.h1,
      url,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Windows, macOS, Linux, Android, iOS',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      inLanguage: 'vi-VN',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
      publisher: { '@id': 'https://ltp-soft.com/#organization' },
      description: page.description,
    },
  ];

  if (!isHome) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LTP PDF', item: `${SITE.url}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: url },
      ],
    });
  }

  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return `
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${url}" />
    <meta name="author" content="LTP Soft" />
    <meta name="application-name" content="${SITE.name}" />
    <meta name="apple-mobile-web-app-title" content="${SITE.name}" />
    <meta name="theme-color" content="${SITE.themeColor}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LTP PDF - LTP Soft" />
    <meta property="og:locale" content="${SITE.locale}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="LTP PDF - Ghép file PDF miễn phí, không cần đăng ký" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(page.description)}" />
    <meta name="twitter:image" content="${SITE.ogImage}" />

    ${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}`;
}

/** HTML tĩnh hiển thị trước khi JS tải xong (cũng là nội dung cho bot không chạy JS). */
export function renderStaticBody(page) {
  const isHome = page.path === '/';
  const links = Object.values(TOOL_ROUTES)
    .map((r) => `<li><a href="${r.path}">${esc(r.h1)}</a></li>`)
    .join('');
  const steps = (page.steps || []).map((s) => `<li>${esc(s)}</li>`).join('');
  const faqs = (page.faqs || [])
    .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
    .join('');

  return `
      <div id="seo-static" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif;color:#1e293b">
        <p><a href="/"><img src="/brand/ltp-soft-logo.png" alt="LTP Soft" width="92" height="48" /></a></p>
        <h1>${esc(page.h1)}</h1>
        <p>${esc(isHome ? HOME.intro : page.description)}</p>
        ${steps ? `<h2>Hướng dẫn sử dụng</h2><ol>${steps}</ol>` : ''}
        <h2>Công cụ PDF miễn phí</h2>
        <ul>${links}</ul>
        ${faqs ? `<h2>Câu hỏi thường gặp</h2>${faqs}` : ''}
        <p>Sản phẩm miễn phí của <a href="https://ltp-soft.com/">LTP Soft</a> – Phần mềm chấm công QR &amp; GPS không giới hạn nhân sự.</p>
        <noscript><p><strong>Vui lòng bật JavaScript để sử dụng công cụ.</strong></p></noscript>
      </div>`;
}

export function renderSitemap(lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = allPages()
    .map(
      (p) => `  <url>
    <loc>${SITE.url}${p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.path === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p.path === '/' ? '1.0' : p.path === '/ghep-file-pdf/' ? '0.9' : '0.8'}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
