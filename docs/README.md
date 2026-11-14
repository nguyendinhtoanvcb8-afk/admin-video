# VIDEO ADMIN – Bộ tài liệu Vibe Coding

Website quản trị video (admin) dùng **HTML + CSS + JavaScript thuần**, database **Supabase**, giao diện **sáng, nền trắng**.

## Bộ tài liệu gồm

| File | Nội dung | Khi nào dùng |
|---|---|---|
| `README.md` | Tổng quan, thứ tự đọc | Đọc đầu tiên |
| `01-PRD.md` | Yêu cầu sản phẩm: chức năng, phân quyền, phạm vi | Đưa cho AI để hiểu dự án |
| `02-DATABASE.md` | Thiết kế bảng + **toàn bộ SQL** (bảng, hàm, dữ liệu mẫu, storage) | Chạy trong Supabase SQL Editor |
| `03-AUTH.md` | Luồng đăng nhập, đăng ký, quên mật khẩu, phiên đăng nhập | Khi code 3 trang auth |
| `04-UI-DESIGN.md` | Màu sắc, font, bố cục, component (light mode) | Khi code CSS |
| `05-PAGES.md` | Đặc tả chi tiết từng trang | Khi code từng trang |
| `06-PROJECT-STRUCTURE.md` | Cấu trúc thư mục, file `supabase.txt`, cách chạy | Khi tạo khung dự án |
| `07-API.md` | Danh sách hàm RPC gọi từ JavaScript | Khi code phần gọi dữ liệu |
| `08-AI-RULES.md` | Quy tắc bắt buộc cho AI khi viết code | Dán vào đầu mỗi phiên chat với AI |
| `09-PROMPTS.md` | Prompt mẫu theo từng bước | Copy – paste để vibe coding |
| `10-TEST-CHECKLIST.md` | Danh sách kiểm thử | Sau khi code xong |

## Thứ tự làm

1. Tạo project trên [supabase.com](https://supabase.com).
2. Mở **SQL Editor** → chạy toàn bộ SQL trong `02-DATABASE.md` (theo thứ tự các phần 1 → 8).
3. Vào **Project Settings → API**, copy `Project URL` và `anon public key` vào file `supabase.txt` (xem `06-PROJECT-STRUCTURE.md`).
4. Mở công cụ AI (Claude Code, Cursor…), cho AI đọc thư mục `docs/`, dán nội dung `08-AI-RULES.md`.
5. Làm lần lượt các prompt trong `09-PROMPTS.md`.
6. Chạy thử bằng **Live Server** (VS Code) – không mở file trực tiếp bằng `file://`.
7. Kiểm tra theo `10-TEST-CHECKLIST.md`.

## Tài khoản mẫu (đã có sẵn trong SQL)

| username | email | password | role |
|---|---|---|---|
| admin1 | admin1@gmail.com | 123456 | ADMIN |
| user1 | user1@gmail.com | 123456 | USER |

## Các quyết định thiết kế chính

- **Video và thumbnail upload lên Supabase Storage** (bucket `videos`, `thumbnails`). Dung lượng storage = tổng kích thước file lưu trong bảng `videos`.
- **Đăng nhập tự làm bằng bảng `users`** (không dùng Supabase Auth). Mật khẩu được **băm bcrypt trong database** (pgcrypto), không lưu mật khẩu thô. Mọi thao tác đi qua **hàm RPC** có kiểm tra token phiên.
- **USER chỉ được xem** Dashboard và danh sách video. **ADMIN** được thêm / sửa / xóa.
- Bảng: `users`, `sessions`, `password_resets`, `video_categories`, `videos`, `video_views_daily`, `comments`.
  - `video_views_daily` được thêm vì **biểu đồ line lượt xem theo ngày/tháng bắt buộc phải có dữ liệu theo ngày**.
- Biểu đồ dùng **Chart.js** (thư viện JavaScript qua CDN).

> ⚠️ Đây là dự án học tập. Đăng nhập tự làm + upload bằng anon key **không an toàn bằng Supabase Auth**. Xem phần "Giới hạn bảo mật" trong `03-AUTH.md` trước khi đưa lên môi trường thật.
