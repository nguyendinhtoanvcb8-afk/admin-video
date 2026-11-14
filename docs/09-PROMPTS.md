# 09 – PROMPT MẪU THEO TỪNG BƯỚC

> Mỗi bước là 1 lần chat. Làm xong, **chạy thử bằng Live Server**, đạt yêu cầu rồi mới sang bước tiếp.
> Nếu lỗi: copy nguyên văn lỗi trong Console (F12) gửi lại cho AI.

---

### Bước 0 – Chuẩn bị (tự làm, không cần AI)
- [ ] Tạo project Supabase.
- [ ] Chạy SQL phần 1 → 8 trong `docs/02-DATABASE.md`.
- [ ] Chạy thử `select public.app_login('admin1','123456');` thấy có token.
- [ ] Tạo thư mục `video-admin/`, chép bộ tài liệu vào `video-admin/docs/`.
- [ ] Tạo `video-admin/supabase.txt` với URL + anon key.

---

### Bước 1 – Khung dự án và CSS nền
```
Đọc toàn bộ thư mục docs/ và tuân thủ docs/08-AI-RULES.md.
Hãy tạo khung dự án theo docs/06-PROJECT-STRUCTURE.md:
- css/base.css (biến màu, reset, button, input, badge, toast, modal, skeleton) theo docs/04-UI-DESIGN.md
- js/config.js, js/supabase-client.js, js/session.js, js/utils.js, js/ui.js
- .gitignore
- index.html chuyển hướng theo phiên đăng nhập
Chưa làm các trang khác.
```
✅ Kiểm tra: mở `index.html` → tự chuyển sang `login.html` (sẽ báo 404 vì chưa có, là bình thường).

---

### Bước 2 – API và Storage
```
Tạo js/api.js và js/storage.js đúng như docs/07-API.md.
Tạo trang tạm test.html gọi api.login('admin1','123456') rồi api.stats(), in kết quả ra console.
```
✅ Kiểm tra: Console in ra token và `{ total_videos: 15, ... }`. Sau đó xóa `test.html`.

---

### Bước 3 – 3 trang Auth
```
Làm 3 trang login.html, register.html, forgot-password.html cùng css/auth.css
và js/pages/login.js, register.js, forgot-password.js theo docs/03-AUTH.md và docs/04-UI-DESIGN.md.
Kiểm tra dữ liệu form ở frontend, hiện lỗi dưới từng ô, nút có trạng thái loading.
Trang quên mật khẩu gồm 2 bước, hiển thị demo_code trong hộp màu vàng.
```
✅ Kiểm tra: đăng nhập admin1 / user1, đăng ký tài khoản mới, đổi mật khẩu bằng mã demo.

---

### Bước 4 – Layout admin và guard
```
Tạo css/admin.css, js/layout.js (sidebar + header + menu user + đăng xuất + nút ☰ trên mobile)
và js/guard.js (kiểm tra phiên bằng api.currentUser, hỗ trợ tham số requireAdmin)
theo docs/04-UI-DESIGN.md và docs/03-AUTH.md.
Tạo dashboard.html rỗng chỉ có layout để thử.
```
✅ Kiểm tra: chưa đăng nhập vào `dashboard.html` → bị đẩy về login. Đăng nhập user1 → không thấy mục "Danh mục".

---

### Bước 5 – Dashboard
```
Hoàn thiện dashboard.html + js/pages/dashboard.js theo mục 1 của docs/05-PAGES.md:
3 thẻ số liệu, biểu đồ cột top 10, biểu đồ line có nút Theo ngày / Theo tháng.
Dùng Chart.js theo style mục 6 của docs/04-UI-DESIGN.md. Gọi dữ liệu song song bằng Promise.all.
```
✅ Kiểm tra: số liệu khớp với SQL `select public.app_dashboard_stats('<token>')`; đổi ngày/tháng không lỗi "Canvas is already in use".

---

### Bước 6 – Danh sách video
```
Làm videos.html + js/pages/videos.js theo mục 2 của docs/05-PAGES.md:
bảng ID, Thumbnail, Title, Views, Trạng thái, Action (Edit, Delete); tìm kiếm debounce,
lọc danh mục, sắp xếp, phân trang, lưu trạng thái lên URL, modal xác nhận xóa, xóa file Storage.
USER chỉ xem, không thấy nút thêm/sửa/xóa.
```
✅ Kiểm tra: tìm "số 1" ra đúng video; F5 vẫn giữ trang/bộ lọc; xóa thành công.

---

### Bước 7 – Thêm / Sửa video
```
Làm video-form.html + js/pages/video-form.js theo mục 3 của docs/05-PAGES.md:
upload video và thumbnail lên Supabase Storage, xem trước, lấy thời lượng, file_size,
nút "Lấy ảnh từ video", xử lý xóa file rác khi lưu lỗi, xóa file cũ khi thay file.
Chỉ ADMIN được vào.
```
✅ Kiểm tra: thêm video mp4 nhỏ (< 50MB) → xuất hiện trong danh sách, Dashboard tăng dung lượng storage.

---

### Bước 8 (mở rộng) – Danh mục
```
Làm categories.html + js/pages/categories.js theo mục 4 của docs/05-PAGES.md.
```

### Bước 9 (mở rộng) – Chi tiết video + bình luận
```
Làm video-detail.html + js/pages/video-detail.js theo mục 5 của docs/05-PAGES.md.
Thêm liên kết từ tiêu đề video trong videos.html sang trang chi tiết.
```

---

### Bước 10 – Rà soát
```
Rà soát toàn bộ dự án theo docs/10-TEST-CHECKLIST.md và docs/08-AI-RULES.md.
Liệt kê các điểm chưa đạt, sau đó sửa từng điểm.
```

---

## Prompt sửa lỗi mẫu
```
Trang <tên trang> bị lỗi khi <thao tác>.
Lỗi trong Console:
<dán nguyên văn lỗi>
Hãy giải thích nguyên nhân ngắn gọn rồi sửa, chỉ sửa file liên quan.
```

## Lỗi thường gặp
| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Failed to fetch supabase.txt` / CORS | Mở bằng `file://` | Chạy Live Server |
| `Could not find the function public.app_xxx` | Chưa chạy SQL hoặc sai tên tham số | Chạy lại SQL; kiểm tra tên tham số `p_...` |
| `UNAUTHORIZED` | Token hết hạn / chưa đăng nhập | Đăng nhập lại |
| `new row violates row-level security policy` khi upload | Chưa chạy SQL phần 7 | Chạy phần 7 |
| `The object exceeded the maximum allowed size` | File > 50MB | Chọn file nhỏ hơn |
| `Canvas is already in use` | Chưa `destroy()` chart cũ | Hủy chart trước khi vẽ lại |
