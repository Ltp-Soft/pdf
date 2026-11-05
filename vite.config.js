import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
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
});
