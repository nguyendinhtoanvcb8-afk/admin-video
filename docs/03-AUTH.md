# 03 – AUTH: Đăng nhập, Đăng ký, Quên mật khẩu

Hệ thống **tự làm bằng bảng `users`**, không dùng Supabase Auth.

## 1. Cơ chế phiên đăng nhập (session token)

```
[login.html] --app_login(login, password)--> [DB kiểm tra bcrypt]
                                              ↓ tạo token ngẫu nhiên, lưu bảng sessions (7 ngày)
[Trình duyệt] <-- { token, user } ------------┘
   lưu vào localStorage key "va_session" = { token, user }

Mỗi trang admin khi mở:
   guard.js → app_get_current_user(token)
     ├─ OK      → hiển thị trang, cập nhật user mới nhất
     └─ lỗi     → xóa localStorage, chuyển về login.html
Mỗi lần gọi dữ liệu: truyền p_token vào hàm RPC.
```

- `localStorage` key: **`va_session`** – dạng `{"token":"...","user":{"id":"...","username":"admin1","role":"ADMIN",...}}`.
- Nếu bất kỳ RPC nào trả lỗi chứa `UNAUTHORIZED` → tự đăng xuất và chuyển về `login.html?expired=1`.
- Lỗi chứa `FORBIDDEN` → hiển thị toast "Bạn không có quyền thực hiện thao tác này".
- Trang auth (login/register/forgot): nếu đã có phiên hợp lệ → chuyển thẳng tới `dashboard.html`.

## 2. Trang Đăng nhập – `login.html`

| Trường | Kiểm tra |
|---|---|
| Username hoặc Email | bắt buộc |
| Mật khẩu | bắt buộc, có nút 👁 hiện/ẩn |
| Ghi nhớ đăng nhập | checkbox (bỏ chọn → lưu vào `sessionStorage` thay vì `localStorage`) |

Luồng:
1. Bấm **Đăng nhập** → nút chuyển trạng thái loading, khóa nút.
2. Gọi `app_login(p_login, p_password)`.
3. Thành công → lưu phiên → chuyển `dashboard.html` (hoặc trang trong `?redirect=`).
4. Thất bại → hiện lỗi dưới form, giữ nguyên dữ liệu đã nhập (trừ mật khẩu).
5. `?expired=1` → hiện thông báo "Phiên đăng nhập đã hết hạn".

Liên kết: "Chưa có tài khoản? Đăng ký", "Quên mật khẩu?".

## 3. Trang Đăng ký – `register.html`

| Trường | Kiểm tra (frontend + database) |
|---|---|
| Họ tên | không bắt buộc |
| Username | 3–30 ký tự `A-Z a-z 0-9 _` |
| Email | đúng định dạng |
| Mật khẩu | ≥ 6 ký tự |
| Nhập lại mật khẩu | trùng mật khẩu (chỉ frontend) |

Luồng: gọi `app_register(p_username, p_email, p_password, p_full_name)` → hàm tự đăng nhập và trả `{token, user}` → lưu phiên → chuyển `dashboard.html`.
Role luôn là **USER**.

## 4. Trang Quên mật khẩu – `forgot-password.html` (2 bước trong cùng 1 trang)

**Bước 1 – Nhập email**
- Gọi `app_request_password_reset(p_email)`.
- Luôn hiện thông báo trung lập: "Nếu email tồn tại, mã khôi phục đã được tạo."
- **Chế độ học tập**: nếu `demo_code` khác null → hiện hộp vàng "Mã khôi phục (demo): **123456** – hiệu lực 15 phút".
- Chuyển sang bước 2, điền sẵn email.

**Bước 2 – Đặt mật khẩu mới**
| Trường | Kiểm tra |
|---|---|
| Email | khóa (readonly), có nút "Đổi email" quay lại bước 1 |
| Mã khôi phục | 6 chữ số |
| Mật khẩu mới | ≥ 6 ký tự |
| Nhập lại | trùng |

- Gọi `app_reset_password(p_email, p_code, p_new_password)`.
- Thành công → thông báo → sau 2 giây chuyển `login.html`. Mọi phiên cũ của user bị xóa.
- Nút "Gửi lại mã" (chờ 60 giây mới bấm lại được).

## 5. Đăng xuất
- Nút ở góc trên phải (menu avatar) → gọi `app_logout(p_token)` → xóa `localStorage`/`sessionStorage` → `login.html`.

## 6. Giới hạn bảo mật (cần hiểu rõ)

| Vấn đề | Mức độ | Cách khắc phục khi làm thật |
|---|---|---|
| Mã khôi phục hiển thị trên màn hình | Cao | Bỏ `demo_code`, gửi email qua Supabase Edge Function + dịch vụ email (Resend, SendGrid…) |
| Upload Storage bằng anon key, ai có key cũng upload/xóa được | Cao | Chuyển sang Supabase Auth và policy theo `auth.uid()`, hoặc upload qua Edge Function |
| Token lưu trong localStorage (có thể bị đánh cắp nếu web dính XSS) | Trung bình | Không dùng `innerHTML` với dữ liệu người dùng; dùng `textContent` |
| Không giới hạn số lần đăng nhập sai | Trung bình | Thêm bảng `login_attempts` hoặc dùng Supabase Auth |
| Mật khẩu mẫu `123456` | Thấp (demo) | Đổi mật khẩu khi đưa lên thật |

> Phương án an toàn nhất cho sản phẩm thật là **Supabase Auth**. Bộ tài liệu này giữ cách tự làm theo yêu cầu, phục vụ học tập.
