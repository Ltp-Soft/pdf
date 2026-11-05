// Common utility functions

/**
 * Format bytes into human readable format (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Triggers a file download in the browser
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Read File as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read File as Data URL (for images)
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Parse page range string (e.g. "1-3, 5, 7-10") into a sorted array of 0-based page indices
 * @param {string} rangeStr User input
 * @param {number} totalPages Total pages of the PDF
 * @returns {{ valid: boolean, pages: number[], error?: string }}
 */
export function parsePageRanges(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    return { valid: false, pages: [], error: 'Vui lòng nhập khoảng trang cần tách.' };
  }

  const parts = rangeStr.split(',').map(p => p.trim()).filter(Boolean);
  const pageSet = new Set();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        return { valid: false, pages: [], error: `Khoảng trang không hợp lệ: "${part}"` };
      }
      if (start < 1 || end > totalPages) {
        return { valid: false, pages: [], error: `Trang nằm ngoài phạm vi 1 đến ${totalPages}: "${part}"` };
      }
      if (start > end) {
        return { valid: false, pages: [], error: `Trang bắt đầu lớn hơn trang kết thúc: "${part}"` };
      }

      for (let p = start; p <= end; p++) {
        pageSet.add(p - 1); // 0-based index
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        return { valid: false, pages: [], error: `Số trang không hợp lệ: "${part}"` };
      }
      if (page < 1 || page > totalPages) {
        return { valid: false, pages: [], error: `Trang ${page} nằm ngoài phạm vi (1 - ${totalPages})` };
      }
      pageSet.add(page - 1); // 0-based index
    }
  }

  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
  if (sortedPages.length === 0) {
    return { valid: false, pages: [], error: 'Không tìm thấy trang hợp lệ.' };
  }

  return { valid: true, pages: sortedPages };
}

/**
 * Generate a nice clean filename with suffix
 */
export function getOutputFilename(originalName, suffix, extension) {
  const lastDot = originalName.lastIndexOf('.');
  const base = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  const ext = extension || (lastDot > 0 ? originalName.substring(lastDot + 1) : 'pdf');
  return `${base}_${suffix}.${ext}`;
}
