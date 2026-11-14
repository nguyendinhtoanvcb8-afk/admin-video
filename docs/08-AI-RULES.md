# 08 – QUY TẮC CHO AI KHI VIẾT CODE

> Dán toàn bộ file này vào đầu mỗi phiên chat với AI (hoặc lưu thành `CLAUDE.md` / `.cursorrules` ở thư mục gốc).

## Bối cảnh
Bạn đang xây dựng website **Video Admin**. Tài liệu đặc tả nằm trong thư mục `docs/`. **Đọc `docs/` trước khi viết code** và làm đúng theo đó. Nếu tài liệu chưa rõ, **hỏi lại**, không tự đoán.

## Công nghệ – BẮT BUỘC
1. Chỉ dùng **HTML, CSS, JavaScript thuần** (ES6+, `<script type="module">`).
2. **KHÔNG** dùng: React, Vue, Angular, jQuery, Bootstrap, Tailwind, TypeScript, bundler (Vite/Webpack), npm.
3. Thư viện được phép (qua CDN): `@supabase/supabase-js@2` (ESM), `chart.js@4`, Google Fonts Inter.
4. Đọc cấu hình Supabase từ file `supabase.txt` qua `js/config.js`. **Không hard-code** URL hay key trong code.

## Database
5. **Không đọc/ghi bảng trực tiếp** (`supabase.from('videos')...`). Chỉ gọi hàm RPC qua `js/api.js` (xem `docs/07-API.md`).
6. Ngoại lệ: Storage dùng `supabase.storage` qua `js/storage.js`.
7. Không tự đổi tên bảng, cột, hàm. Nếu cần thay đổi database, **đề xuất SQL** cho tôi chạy, không tự giả định đã có.

## Giao diện
8. Light mode, nền trắng, dùng **CSS variables** trong `docs/04-UI-DESIGN.md`. Không dùng màu cứng ngoài bảng màu.
9. Toàn bộ chữ trên giao diện bằng **tiếng Việt có dấu**.
10. Responsive: desktop, tablet, mobile.
11. Mọi khu vực tải dữ liệu phải có 3 trạng thái: **đang tải**, **rỗng**, **lỗi (có nút Thử lại)**.

## Bảo mật
12. Hiển thị dữ liệu người dùng bằng `textContent` hoặc qua `escapeHtml()`. **Không** chèn dữ liệu chưa escape vào `innerHTML`.
13. Mọi trang admin phải gọi `guard.js` trước khi tải dữ liệu. Trang chỉ dành cho ADMIN phải kiểm tra role.
14. Ẩn nút Thêm / Sửa / Xóa với USER (database cũng đã chặn).
15. Không bao giờ ghi `service_role key` vào code.

## Chất lượng code
16. Mỗi trang 1 file JS trong `js/pages/`. Hàm dùng chung đặt ở `utils.js`, `ui.js`.
17. Dùng `async/await` + `try/catch`. Lỗi hiện bằng toast, không dùng `alert()`.
18. Khóa nút khi đang gửi để tránh bấm 2 lần.
19. Đặt tên biến/hàm tiếng Anh, comment tiếng Việt ngắn gọn ở chỗ khó hiểu.
20. Không để lỗi trong Console.

## Cách làm việc
21. Làm **từng bước nhỏ** theo `docs/09-PROMPTS.md`. Xong mỗi bước: liệt kê file đã tạo/sửa và cách kiểm tra.
22. Không viết lại file không liên quan đến yêu cầu.
23. Khi sửa lỗi: giải thích nguyên nhân trong 1–2 câu rồi mới sửa.
