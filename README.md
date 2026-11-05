# LTP PDF – Ghép file PDF miễn phí, không cần đăng ký

🌐 **https://pdf.ltp-soft.com** – sản phẩm miễn phí của [LTP Soft](https://ltp-soft.com) (Phần mềm chấm công QR & GPS).

Ứng dụng web xử lý PDF hiện đại, tối giản, chạy 100% trên trình duyệt người dùng (Client-side) sử dụng HTML, Tailwind CSS, JavaScript, `pdf-lib`, `pdfjs-dist` và `JSZip`.

Tài liệu và hình ảnh của bạn **không bao giờ được tải lên bất kỳ máy chủ nào**, đảm bảo an toàn và bảo mật thông tin tuyệt đối.

---

## 🚀 Các tính năng chính

1. **Nối PDF (Merge PDF)**
   - Kéo thả hoặc chọn nhiều tệp PDF cùng lúc.
   - Hiển thị danh sách tệp với số trang và dung lượng chi tiết.
   - Sắp xếp thứ tự tệp lên/xuống hoặc xóa tệp linh hoạt.
   - Gộp nhanh các trang và tải về ngay.

2. **Ghép trang 2 cửa sổ (Two-Panel Visual Page Merge)** ⭐
   - Mở 2 tệp PDF ở hai cửa sổ trái / phải độc lập.
   - Hiển thị thumbnail trực quan cho từng trang của cả 2 tài liệu.
   - Kéo bốc trực tiếp từng trang từ tệp này thả chèn vào bất kỳ vị trí nào giữa các trang của tệp kia.
   - Hỗ trợ đổi thứ tự trang lên/xuống, xóa trang, hoặc bấm nút chuyển nhanh `→` / `←`.
   - Tùy chọn di chuyển (Move) hoặc sao chép (Copy giữ bản gốc).
   - Xuất và tải về tệp PDF hoàn chỉnh của Cửa sổ 1 hoặc Cửa sổ 2 ngay tức thì.

3. **Tách PDF (Split PDF)**
   - Phân tích số trang tức thì.
   - Tùy chọn 1: Trích xuất khoảng trang cụ thể (ví dụ: `1-3, 5, 8-10`) thành 1 file PDF mới.
   - Tùy chọn 2: Tách từng trang thành các file PDF đơn lẻ và đóng gói tự động vào file `.zip`.

3. **Nén PDF (Compress PDF)**
   - Nén tài liệu thông minh bằng cách render trang ra canvas và tối ưu hóa JPEG quality.
   - Các mức nén cài sẵn: Nén nhẹ, Cân bằng (khuyên dùng), Nén tối đa.
   - Chế độ tùy chỉnh nâng cao: Tự điều chỉnh thanh trượt Chất lượng ảnh (%) và Độ phân giải (Scale/DPI).
   - Thống kê trực quan: Dung lượng gốc vs Dung lượng sau nén và % dung lượng đã tiết kiệm.

4. **PDF sang Ảnh (PDF to Images)**
   - Chuyển đổi toàn bộ các trang PDF thành ảnh chất lượng cao (JPG hoặc PNG).
   - Tùy chọn độ phân giải: Tiêu chuẩn (1.0x), Sắc nét (1.5x), HD (2.0x).
   - Đóng gói toàn bộ ảnh vào tệp `.zip` tải về nhanh chóng.

5. **Ảnh sang PDF (Images to PDF)**
   - Hỗ trợ chọn nhiều định dạng ảnh: JPG, JPEG, PNG, WebP.
   - Sắp xếp lại thứ tự ảnh, hiển thị thumbnail xem trước.
   - Tùy chọn khổ giấy: Khổ A4 Dọc, Khổ A4 Ngang, hoặc Vừa khít theo kích thước ảnh gốc.
   - Tùy chọn khoảng lề: Tràn viền (0pt), Lề nhỏ (20pt), Lề vừa (40pt).

6. **Xoay trang PDF (Rotate PDF)**
   - Xoay 90° sang phải, 180° hoặc 90° sang trái (270°).
   - Phạm vi linh hoạt: Tất cả trang, Chỉ trang lẻ, Chỉ trang chẵn, hoặc Nhập khoảng trang tùy chỉnh.
   - Xử lý lossless chuẩn xác, không làm vỡ hình ảnh hay suy hao chất lượng.

---

## 🎨 Điểm nổi bật về giao diện & Trải nghiệm

- **Kéo thả mượt mà (Drag & Drop)**: Vùng kéo thả trực quan với hiệu ứng tương tác tức thì.
- **Biểu tượng SVG thuần túy (Pure SVG Icons)**: 100% icon bằng vector SVG siêu nhẹ, không phụ thuộc font icon bên thứ ba.
- **Thanh tiến trình (Progress Bar)**: Hiển thị % tiến độ và thông báo trạng thái động khi xử lý tệp nặng.
- **Tải xuống ngay**: Nút tải về nổi bật kèm thông số kết quả chi tiết.

---

## 🛠️ Hướng dẫn cài đặt & Chạy cục bộ

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:3000`.

### 3. Đóng gói sản phẩm (Build Production)
```bash
npm run build
```
Thư mục `dist/` sẽ được tạo ra với toàn bộ mã nguồn tĩnh đã được tối ưu hóa và phân tách chunk (Code-splitting).

---

## ☁️ Hướng dẫn triển khai lên Cloudflare Pages

### Cách 1: Kết nối kho Git (Khuyên dùng)
1. Đẩy mã nguồn lên GitHub hoặc GitLab.
2. Vào **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Cấu hình Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Bấm **Save and Deploy**. Ứng dụng sẽ được triển khai toàn cầu qua Cloudflare CDN!

### Cách 2: Triển khai trực tiếp (Direct Upload)
1. Chạy `npm run build` trên máy của bạn.
2. Trong Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Upload assets**.
3. Kéo toàn bộ thư mục `dist` vào và hoàn tất.

### Gắn tên miền `pdf.ltp-soft.com`
Pages project → **Custom domains** → **Set up a custom domain** → nhập `pdf.ltp-soft.com` (Cloudflare tự tạo bản ghi CNAME vì `ltp-soft.com` đã nằm trên Cloudflare).

---

## 🔎 SEO & Marketing

| Thành phần | Vị trí |
|---|---|
| Cấu hình URL, title, description, FAQ từng công cụ | `src/seo/routes.js` |
| Sinh thẻ meta, Open Graph, JSON-LD (Organization, WebSite, WebApplication, FAQPage, Breadcrumb) | `src/seo/render.js` |
| Sinh `dist/<slug>/index.html` + `sitemap.xml` lúc build | `vite.config.js` (plugin `ltp-seo-pages`) |
| robots.txt, manifest, headers Cloudflare, trang 404 | `public/` |
| Khối quảng cáo ltp-soft.com (có UTM) | `src/ads.js` |
| Logo / favicon / OG image | `public/brand/`, `public/*.png`, sinh lại bằng `python scripts/gen-brand-assets.py` |

URL được lập chỉ mục:
`/`, `/ghep-file-pdf/`, `/chen-trang-pdf/`, `/tach-file-pdf/`, `/nen-file-pdf/`, `/pdf-sang-anh/`, `/anh-sang-pdf/`, `/xoay-file-pdf/`

**Google Analytics 4 (tuỳ chọn):** đặt biến môi trường `VITE_GA4_ID=G-XXXXXXX` (file `.env` hoặc Cloudflare Pages → Settings → Environment variables) rồi build lại. Click quảng cáo được ghi nhận thành event `ad_click`.
