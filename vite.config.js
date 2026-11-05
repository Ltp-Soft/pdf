import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { HOME, TOOL_ROUTES, findToolIdByPath } from './src/seo/routes.js';
import { renderHead, renderStaticBody, renderSitemap } from './src/seo/render.js';

/**
 * Plugin SEO:
 *  - Dev: chèn <head>/nội dung tĩnh đúng theo URL đang mở.
 *  - Build: sinh dist/<slug>/index.html cho từng công cụ (title/meta/canonical riêng)
 *           + dist/sitemap.xml.
 */
function seoPages(env) {
  let template = '';
  let outDir = 'dist';

  const gaId = env.VITE_GA4_ID;
  const analytics = gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>`
    : '';

  const fill = (html, page) =>
    html
      .replace('<!--SEO_HEAD-->', renderHead(page))
      .replace('<!--SEO_BODY-->', renderStaticBody(page))
      .replace('<!--ANALYTICS-->', analytics);

  return {
    name: 'ltp-seo-pages',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        template = html;
        const toolId = ctx.originalUrl ? findToolIdByPath(ctx.originalUrl.split('?')[0]) : null;
        return fill(html, toolId ? TOOL_ROUTES[toolId] : HOME);
      },
    },
    closeBundle() {
      if (!template || !fs.existsSync(outDir)) return;
      for (const route of Object.values(TOOL_ROUTES)) {
        const dir = path.join(outDir, route.path);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), fill(template, route));
      }
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), renderSitemap());
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [tailwindcss(), seoPages(env)],
    server: {
      port: 3000,
      open: false
    },
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('pdf-lib')) return 'pdf-lib';
            if (id.includes('pdfjs-dist')) return 'pdfjs-dist';
            if (id.includes('jszip')) return 'jszip';
          }
        }
      }
    }
  };
});
