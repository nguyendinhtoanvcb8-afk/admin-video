# 01 – PRD: Website Admin Quản lý Video

## 1. Mục tiêu

Xây dựng trang quản trị giúp quản lý thư viện video: xem số liệu tổng quan, xem danh sách, thêm / sửa / xóa video, upload file video và ảnh thumbnail lên Supabase Storage.

## 2. Công nghệ (bắt buộc)

| Thành phần | Lựa chọn |
|---|---|
| Ngôn ngữ | HTML5, CSS3, JavaScript (ES6+, ES Modules) – **không framework** (không React, Vue, Tailwind, jQuery, Bootstrap) |
| Database | Supabase (PostgreSQL) |
| Lưu file | Supabase Storage |
| Thư viện JS qua CDN | `@supabase/supabase-js@2`, `chart.js@4` |
| Chạy local | VS Code + Live Server |
| Giao diện | Light mode, nền trắng |

## 3. Người dùng và phân quyền

| Chức năng | ADMIN | USER | Chưa đăng nhập |
|---|:-:|:-:|:-:|
| Đăng nhập / đăng ký / quên mật khẩu | ✅ | ✅ | ✅ |
| Xem Dashboard | ✅ | ✅ | ❌ → chuyển về Login |
| Xem danh sách video | ✅ | ✅ | ❌ |
| Thêm / sửa / xóa video | ✅ | ❌ (ẩn nút) | ❌ |
| Quản lý danh mục | ✅ | ❌ | ❌ |
| Xem bình luận | ✅ | ✅ | ❌ |
| Viết bình luận | ✅ | ✅ | ❌ |
| Xóa bình luận | ✅ (mọi bình luận) | ✅ (của mình) | ❌ |

- Người đăng ký mới **luôn có role USER**. Chỉ đổi thành ADMIN bằng SQL.
- Phân quyền phải được kiểm tra **ở database (hàm RPC)**, không chỉ ẩn nút trên giao diện.

## 4. Danh sách trang

| # | Trang | File | Bắt buộc |
|---|---|---|:-:|
| 1 | Đăng nhập | `login.html` | ✅ |
| 2 | Đăng ký | `register.html` | ✅ |
| 3 | Quên mật khẩu (2 bước: lấy mã → đặt mật khẩu mới) | `forgot-password.html` | ✅ |
| 4 | Dashboard | `dashboard.html` | ✅ |
| 5 | Danh sách video | `videos.html` | ✅ |
| 6 | Thêm / Sửa video | `video-form.html` (`?id=` khi sửa) | ✅ (cần cho nút Edit) |
| 7 | Danh mục video | `categories.html` | Mở rộng |
| 8 | Chi tiết video + bình luận | `video-detail.html?id=` | Mở rộng |

## 5. Chức năng chi tiết

### 5.1 Dashboard
- 3 thẻ số liệu: **Tổng số video**, **Tổng lượt xem**, **Dung lượng storage** (hiển thị dạng MB / GB).
- **Biểu đồ cột**: 10 video nhiều lượt xem nhất (trục X: tên video rút gọn, trục Y: lượt xem).
- **Biểu đồ line**: lượt xem theo thời gian, có nút chuyển **Theo ngày** (30 ngày gần nhất) / **Theo tháng** (12 tháng gần nhất).

### 5.2 Danh sách video
- Bảng cột: **ID, Thumbnail, Title, Views, Action (Edit, Delete)**. Có thể thêm cột Danh mục, Trạng thái.
- Tìm kiếm theo tiêu đề, lọc theo danh mục, sắp xếp (mới nhất / lượt xem), phân trang 10 dòng.
- Nút **+ Thêm video** (chỉ ADMIN).
- Delete: hộp xác nhận → xóa bản ghi + xóa file trong Storage.

### 5.3 Thêm / Sửa video
- Trường: Tiêu đề*, Mô tả, Danh mục, Trạng thái (PUBLISHED / DRAFT / HIDDEN), File video* (khi thêm), Ảnh thumbnail.
- Upload có thanh trạng thái, kiểm tra định dạng và dung lượng.
- Tự lấy **thời lượng video** và **kích thước file** từ file được chọn.

### 5.4 Auth
Xem `03-AUTH.md`.

## 6. Yêu cầu phi chức năng
- Responsive: desktop ≥ 1024px (sidebar cố định), tablet/mobile (sidebar thu gọn thành nút ☰).
- Thông báo lỗi tiếng Việt, dễ hiểu; có trạng thái **loading**, **rỗng**, **lỗi** cho mọi khu vực tải dữ liệu.
- Không để lộ `service_role key`. Chỉ dùng `anon key`.
- Không có lỗi trong Console khi dùng bình thường.

## 7. Ngoài phạm vi
- Trang xem video công khai cho khách.
- Gửi email thật khi quên mật khẩu (cần server/Edge Function – xem `03-AUTH.md`).
- Đa ngôn ngữ, dark mode.
