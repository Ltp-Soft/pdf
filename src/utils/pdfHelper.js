import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Load PDF Document via PDF.js
 */
export async function loadPdfDocument(arrayBuffer) {
  // Always use a slice/copy so the caller's ArrayBuffer is never detached by PDF.js web worker transfer
  const copy = arrayBuffer.slice ? arrayBuffer.slice(0) : new Uint8Array(arrayBuffer).slice().buffer;
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(copy),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a specific PDF page to an offscreen or provided HTML Canvas
 */
export async function renderPageToCanvas(pdfDoc, pageNumber, scale = 1.0, targetCanvas = null) {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = targetCanvas || document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true, alpha: false });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill canvas with white background (prevents black backgrounds for transparent PDFs)
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    originalWidth: viewport.width / scale,
    originalHeight: viewport.height / scale,
  };
}

/**
 * Convert HTML Canvas to Blob
 */
export function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.8) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
