Hãy tạo cho tôi một web app mới cho subdomain `img.ltp-soft.com` (LTP Image) bằng cách kế thừa 100% thiết kế UI/UX, Header, Footer và cột Sidebar quảng cáo bên phải (giới thiệu LTP Attendance Dùng thử 60 ngày và LTP TaxSync) từ trang `pdf.ltp-soft.com`.

Yêu cầu cốt lõi:
1. Xử lý 100% trên trình duyệt (Client-Side, không upload ảnh lên server, không cần đăng ký, không watermark, miễn phí 100%).
2. Thiết kế Grid gồm 6 công cụ chính (mỗi công cụ có 1 route/URL riêng để tối ưu SEO):
   - `/tach-nen-anh-ai`: Tách nền ảnh tự động bằng AI (tích hợp thư viện `@imgly/background-removal` chạy WebAssembly/WebGPU trực tiếp trên trình duyệt), có thanh trượt Before/After trực quan và cho phép tách nền cả ảnh sản phẩm, ảnh thẻ lẫn chữ ký/con dấu.
   - `/doi-duoi-anh`: Chuyển đổi định dạng hàng loạt (đặc biệt hỗ trợ đổi HEIC của iPhone, WebP, AVIF, PNG sang JPG/PNG chuẩn) dùng `heic2any` và Canvas API, hỗ trợ tải về file ZIP.
   - `/nen-anh`: Nén giảm 80% dung lượng ảnh hàng loạt (Batch Compress) dùng `browser-image-compression`, hiển thị rõ dung lượng trước và sau khi nén.
   - `/cat-xoay-anh`: Cắt (Crop theo tỷ lệ tự do, 1:1, 4:3, 16:9, ảnh thẻ 3x4, 4x6), xoay và đổi kích thước (Resize) hàng loạt.
   - `/tach-nen-chu-ky-con-dau`: Công cụ chuyên biệt lọc nền giấy trắng của ảnh chụp chữ ký và con dấu đỏ thành PNG trong suốt sắc nét cho dân kế toán/hồ sơ.
   - `/ghep-anh-sang-pdf`: Liên kết hoặc tích hợp chuyển nhanh sang `pdf.ltp-soft.com`.
3. Tự động tạo sẵn file `sitemap.xml` và `robots.txt` cho phép toàn bộ bot Google, Bing và AI thu thập dữ liệu.