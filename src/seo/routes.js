/**
 * Cấu hình SEO + định tuyến dùng chung cho:
 *  - main.js (router phía trình duyệt, cập nhật <title>/meta khi chuyển công cụ)
 *  - vite.config.js (sinh sẵn HTML tĩnh cho từng URL, sitemap.xml lúc build)
 *
 * File này CHỈ chứa dữ liệu thuần (không import DOM/icon) để chạy được cả trong Node.
 */

export const SITE = {
  url: 'https://pdf.ltp-soft.com',
  name: 'LTP PDF',
  brand: 'LTP Soft',
  domainLabel: 'pdf.ltp-soft.com',
  ogImage: 'https://pdf.ltp-soft.com/brand/og-image.jpg',
  logo: 'https://pdf.ltp-soft.com/icon-512.png',
  themeColor: '#020617',
  locale: 'vi_VN',
  email: 'pm@ltp-soft.com',
};

/** Link quảng cáo sang các sản phẩm chính của LTP Soft (có UTM để đo hiệu quả). */
export function adUrl(path = '/', content = 'sidebar') {
  const u = new URL(path, 'https://ltp-soft.com');
  u.searchParams.set('utm_source', 'pdf.ltp-soft.com');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', 'free_pdf_tool');
  u.searchParams.set('utm_content', content);
  return u.toString();
}

export function taxUrl(content = 'sidebar') {
  return `https://tax.ltp-soft.com/?utm_source=pdf.ltp-soft.com&utm_medium=referral&utm_campaign=free_pdf_tool&utm_content=${content}`;
}

/** Trang chủ */
export const HOME = {
  path: '/',
  title: 'LTP PDF - Ghép File PDF Miễn Phí, Không Cần Đăng Ký | LTP Soft',
  description:
    'Ghép file PDF miễn phí, không cần đăng ký, không giới hạn. Nối, tách, nén, xoay PDF, chuyển PDF sang ảnh và ảnh sang PDF ngay trên trình duyệt – file không tải lên máy chủ. Công cụ của LTP Soft.',
  h1: 'Ghép file PDF miễn phí, không cần đăng ký',
  intro:
    'Nối, tách, nén, xoay PDF và chuyển đổi PDF ⇄ ảnh hoàn toàn trên trình duyệt của bạn. Không cài phần mềm, không tạo tài khoản, không giới hạn số lần – tài liệu không bao giờ rời khỏi máy bạn.',
  faqs: [
    {
      q: 'Ghép file PDF trên pdf.ltp-soft.com có mất phí không?',
      a: 'Hoàn toàn miễn phí, không cần đăng ký tài khoản, không giới hạn số file và số lần sử dụng, không chèn watermark.',
    },
    {
      q: 'File PDF của tôi có bị tải lên máy chủ không?',
      a: 'Không. Mọi thao tác ghép, tách, nén, xoay, chuyển đổi đều chạy 100% trên trình duyệt của bạn (client-side). File không được gửi đi đâu nên an toàn cho hóa đơn, hợp đồng, tài liệu nội bộ.',
    },
    {
      q: 'Có dùng được trên điện thoại không?',
      a: 'Có. Công cụ chạy trên mọi trình duyệt hiện đại (Chrome, Edge, Safari, Firefox, Cốc Cốc) trên máy tính, điện thoại Android và iPhone.',
    },
    {
      q: 'Có giới hạn dung lượng file PDF không?',
      a: 'Không đặt giới hạn cố định. Vì xử lý trên máy bạn nên tốc độ và dung lượng tối đa phụ thuộc vào RAM của thiết bị; máy tính thông thường xử lý tốt file vài trăm MB.',
    },
  ],
};

/**
 * Mỗi công cụ có 1 URL riêng để Google lập chỉ mục theo từ khoá.
 * key = id công cụ trong main.js
 */
export const TOOL_ROUTES = {
  merge: {
    path: '/ghep-file-pdf/',
    title: 'Ghép File PDF Online Miễn Phí - Nối Nhiều File PDF Thành 1 | LTP PDF',
    description:
      'Ghép nhiều file PDF thành 1 file duy nhất, sắp xếp thứ tự tuỳ ý, xem trước ảnh thu nhỏ. Miễn phí, không đăng ký, không watermark, xử lý ngay trên trình duyệt.',
    h1: 'Ghép file PDF (Nối PDF) miễn phí',
    steps: [
      'Bấm "chọn tệp" hoặc kéo thả nhiều file PDF vào khung.',
      'Dùng nút mũi tên lên/xuống để sắp xếp thứ tự các file.',
      'Bấm "Nối PDF" và tải về file PDF đã ghép.',
    ],
    faqs: [
      { q: 'Ghép được tối đa bao nhiêu file PDF?', a: 'Không giới hạn số file. Bạn có thể chọn nhiều file cùng lúc rồi sắp xếp lại thứ tự trước khi ghép.' },
      { q: 'Ghép PDF có làm giảm chất lượng không?', a: 'Không. Các trang được sao chép nguyên bản (lossless), giữ nguyên chữ, hình và độ sắc nét.' },
    ],
  },
  organize: {
    path: '/chen-trang-pdf/',
    title: 'Chèn Trang PDF, Ghép Trang Từ 2 File PDF Bằng Kéo Thả | LTP PDF',
    description:
      'Mở 2 file PDF cạnh nhau, kéo thả từng trang từ file này chèn vào vị trí bất kỳ của file kia, nhân bản, xoá, sắp xếp trang. Miễn phí, không đăng ký.',
    h1: 'Chèn & ghép trang PDF từ 2 file bằng kéo thả',
    steps: [
      'Mở file PDF chính ở khung bên trái và file nguồn ở khung bên phải.',
      'Kéo trang từ khung phải thả vào vị trí mong muốn ở khung trái.',
      'Sắp xếp, xoá, nhân bản trang rồi bấm xuất file PDF.',
    ],
    faqs: [
      { q: 'Có thể chèn 1 trang vào giữa file PDF khác không?', a: 'Được. Chỉ cần kéo trang từ file nguồn và thả vào đúng vị trí giữa 2 trang của file đích.' },
    ],
  },
  split: {
    path: '/tach-file-pdf/',
    title: 'Tách File PDF Online Miễn Phí - Cắt Trang PDF, Trích Xuất Trang | LTP PDF',
    description:
      'Tách file PDF theo khoảng trang hoặc tách từng trang thành file riêng (tải về dạng ZIP). Miễn phí, không đăng ký, xử lý trên trình duyệt, không tải file lên máy chủ.',
    h1: 'Tách file PDF (Cắt trang PDF) miễn phí',
    steps: [
      'Chọn file PDF cần tách.',
      'Nhập khoảng trang cần trích xuất hoặc chọn tách từng trang.',
      'Bấm "Tách PDF" và tải về file kết quả hoặc gói ZIP.',
    ],
    faqs: [
      { q: 'Làm sao lấy riêng vài trang trong file PDF?', a: 'Nhập khoảng trang (ví dụ 1-3, 5, 8-10) rồi bấm tách, công cụ sẽ tạo file PDF mới chỉ gồm các trang đó.' },
    ],
  },
  compress: {
    path: '/nen-file-pdf/',
    title: 'Nén File PDF Online Miễn Phí - Giảm Dung Lượng PDF Đến 80% | LTP PDF',
    description:
      'Giảm dung lượng file PDF để gửi email, Zalo, nộp hồ sơ online. Chọn mức nén phù hợp, miễn phí, không đăng ký, file được xử lý ngay trên máy bạn.',
    h1: 'Nén file PDF (Giảm dung lượng PDF) miễn phí',
    steps: [
      'Chọn file PDF cần giảm dung lượng.',
      'Chọn mức nén (chất lượng cao, cân bằng hoặc nén mạnh).',
      'Bấm "Nén PDF" và tải về file đã giảm dung lượng.',
    ],
    faqs: [
      { q: 'Nén PDF để nộp hồ sơ dưới 1MB được không?', a: 'Được. Chọn mức nén mạnh để giảm tối đa dung lượng, phù hợp các cổng nộp hồ sơ giới hạn kích thước file.' },
    ],
  },
  pdfToImg: {
    path: '/pdf-sang-anh/',
    title: 'Chuyển PDF Sang Ảnh JPG, PNG Online Miễn Phí | LTP PDF',
    description:
      'Chuyển từng trang PDF thành ảnh JPG hoặc PNG sắc nét chất lượng HD, tải về gói ZIP. Miễn phí, không đăng ký, không tải file lên máy chủ.',
    h1: 'Chuyển PDF sang ảnh JPG, PNG miễn phí',
    steps: [
      'Chọn file PDF cần chuyển.',
      'Chọn định dạng ảnh (JPG/PNG) và độ phân giải.',
      'Bấm chuyển đổi và tải về ảnh hoặc gói ZIP.',
    ],
    faqs: [
      { q: 'Ảnh xuất ra có nét không?', a: 'Có. Bạn có thể chọn độ phân giải cao để ảnh sắc nét, phù hợp in ấn hoặc đăng lên mạng xã hội.' },
    ],
  },
  imgToPdf: {
    path: '/anh-sang-pdf/',
    title: 'Chuyển Ảnh Sang PDF - Gộp JPG, PNG Thành 1 File PDF Miễn Phí | LTP PDF',
    description:
      'Gộp nhiều ảnh JPG, PNG, WebP thành 1 file PDF chuẩn khổ A4 hoặc theo kích thước ảnh. Miễn phí, không đăng ký, xử lý ngay trên trình duyệt.',
    h1: 'Chuyển ảnh sang PDF (JPG, PNG → PDF) miễn phí',
    steps: [
      'Chọn hoặc kéo thả nhiều ảnh JPG, PNG, WebP.',
      'Sắp xếp thứ tự ảnh, chọn khổ giấy A4 hoặc tự do.',
      'Bấm tạo PDF và tải về.',
    ],
    faqs: [
      { q: 'Chụp ảnh giấy tờ bằng điện thoại rồi chuyển sang PDF được không?', a: 'Được. Chọn các ảnh chụp trên điện thoại, sắp xếp thứ tự và tạo 1 file PDF khổ A4 để gửi đi.' },
    ],
  },
  rotate: {
    path: '/xoay-file-pdf/',
    title: 'Xoay File PDF Online Miễn Phí - Xoay Trang PDF 90°, 180° | LTP PDF',
    description:
      'Xoay toàn bộ hoặc từng trang PDF bị ngược, bị nghiêng 90°, 180°, 270° và lưu lại vĩnh viễn, không giảm chất lượng. Miễn phí, không đăng ký.',
    h1: 'Xoay trang PDF miễn phí',
    steps: [
      'Chọn file PDF cần xoay.',
      'Xoay tất cả, trang chẵn/lẻ hoặc bấm xoay từng trang riêng.',
      'Bấm lưu và tải về file PDF đã xoay.',
    ],
    faqs: [
      { q: 'Xoay trang PDF có được lưu lại vĩnh viễn không?', a: 'Có. File tải về đã được xoay cố định, mở bằng bất kỳ phần mềm đọc PDF nào cũng hiển thị đúng chiều.' },
    ],
  },
};

/** Danh sách mọi URL cần lập chỉ mục (dùng cho sitemap). */
export function allPages() {
  return [
    { id: null, ...HOME },
    ...Object.entries(TOOL_ROUTES).map(([id, r]) => ({ id, ...r })),
  ];
}

export function findToolIdByPath(pathname) {
  let p = pathname || '/';
  if (!p.endsWith('/')) p += '/';
  for (const [id, r] of Object.entries(TOOL_ROUTES)) {
    if (r.path === p) return id;
  }
  return null;
}
