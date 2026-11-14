# 10 – DANH SÁCH KIỂM THỬ

Đánh dấu ✅ khi đạt. Kiểm tra trên Chrome, mở Console (F12) để chắc chắn **không có lỗi đỏ**.

## A. Database
- [ ] `select public.app_login('admin1','123456');` trả về token.
- [ ] `select public.app_login('admin1','sai');` báo "Sai tên đăng nhập/email hoặc mật khẩu".
- [ ] Bảng `users` cột `password_hash` bắt đầu bằng `$2a$` (bcrypt), không có mật khẩu thô.
- [ ] Gọi `supabase.from('users').select()` từ trình duyệt trả về **mảng rỗng** (RLS chặn).

## B. Đăng nhập / Đăng ký / Quên mật khẩu
- [ ] Đăng nhập bằng **username** `admin1` được.
- [ ] Đăng nhập bằng **email** `admin1@gmail.com` được.
- [ ] Sai mật khẩu → hiện lỗi, không chuyển trang.
- [ ] Bỏ chọn "Ghi nhớ" → đóng trình duyệt mở lại phải đăng nhập lại.
- [ ] Đã đăng nhập mà mở `login.html` → tự chuyển sang Dashboard.
- [ ] Đăng ký username trùng → "Username đã tồn tại".
- [ ] Đăng ký email sai định dạng / mật khẩu < 6 ký tự / nhập lại không khớp → báo lỗi đúng ô.
- [ ] Đăng ký thành công → vào Dashboard với role **USER**.
- [ ] Quên mật khẩu: nhập email → hiện mã demo → đổi mật khẩu → đăng nhập bằng mật khẩu mới được, mật khẩu cũ không được.
- [ ] Mã sai / quá 15 phút → "Mã khôi phục không đúng hoặc đã hết hạn".
- [ ] Đăng xuất → về login; bấm Back không vào lại được trang admin.

## C. Phân quyền
- [ ] Chưa đăng nhập mở `dashboard.html`, `videos.html`, `video-form.html` → về login.
- [ ] **user1**: xem được Dashboard và danh sách; **không thấy** nút Thêm / Edit / Delete, không thấy menu Danh mục.
- [ ] **user1** gõ thẳng `video-form.html` → bị chặn, về danh sách.
- [ ] **user1** gọi `api.deleteVideo(1)` trong Console → lỗi "không có quyền", video không bị xóa.
- [ ] Xóa dòng trong bảng `sessions` của admin1 → thao tác tiếp theo bị đưa về login (hết phiên).

## D. Dashboard
- [ ] 3 thẻ hiển thị đúng số (so với SQL), số có dấu chấm phân cách, storage dạng MB/GB.
- [ ] Biểu đồ cột có đúng 10 cột (hoặc ít hơn nếu < 10 video), sắp giảm dần.
- [ ] Tooltip cột hiện tên đầy đủ và lượt xem.
- [ ] Line chart "Theo ngày" có 30 điểm, "Theo tháng" có 12 điểm; chuyển qua lại nhiều lần không lỗi.
- [ ] Ngắt mạng → hiện thông báo lỗi + nút Thử lại.

## E. Danh sách video
- [ ] Đủ cột ID, Thumbnail, Title, Views, Action.
- [ ] Thumbnail lỗi / không có → hiện ảnh placeholder.
- [ ] Tìm kiếm, lọc danh mục, sắp xếp, phân trang hoạt động; F5 giữ nguyên trạng thái.
- [ ] Xóa: có modal xác nhận; hủy thì không xóa; xác nhận thì xóa bản ghi và file trong Storage.
- [ ] Xóa video cuối cùng của trang 2 → tự lùi về trang 1.

## F. Thêm / Sửa video
- [ ] Bỏ trống tiêu đề / không chọn file video khi thêm → báo lỗi.
- [ ] Chọn file > 50MB hoặc sai định dạng → báo lỗi, không upload.
- [ ] Thêm video thành công: file có trong bucket `videos`, bản ghi có `file_size`, `duration` đúng.
- [ ] "Lấy ảnh từ video" tạo được thumbnail.
- [ ] Sửa tiêu đề không chọn file mới → file cũ giữ nguyên.
- [ ] Sửa và thay file → file cũ bị xóa khỏi Storage.
- [ ] Bấm Lưu 2 lần liên tiếp không tạo 2 bản ghi.
- [ ] Sau khi thêm, Dashboard tăng Tổng số video và Dung lượng storage.

## G. Giao diện
- [ ] Nền trắng, đúng bảng màu, font Inter, chữ tiếng Việt có dấu hiển thị đúng.
- [ ] Mobile (360px): sidebar ẩn, nút ☰ mở được; bảng cuộn ngang được.
- [ ] Có skeleton khi tải, trạng thái rỗng khi không có dữ liệu.
- [ ] Toast tự ẩn sau 3 giây.

## H. Bảo mật
- [ ] Tạo video với tiêu đề `<img src=x onerror=alert(1)>` → hiển thị nguyên văn chữ, **không** bật alert.
- [ ] Không có `service_role` key trong code và `supabase.txt`.
- [ ] `supabase.txt` nằm trong `.gitignore`.
