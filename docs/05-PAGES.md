# 05 – ĐẶC TẢ TỪNG TRANG

> Mọi trang admin: dùng chung layout (sidebar + header) do `js/layout.js` render, và chạy `guard.js` để kiểm tra phiên trước khi tải dữ liệu.

---

## 1. `dashboard.html` – Dashboard

**Quyền**: ADMIN, USER.

### Bố cục
```
Dashboard                                   [Làm mới ⟳]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🎬 Tổng video │ │ 👁 Tổng lượt  │ │ 💾 Storage    │
│     15       │ │  1.234.567   │ │   512,4 MB   │
└──────────────┘ └──────────────┘ └──────────────┘
┌───────────────────────────────────────────────┐
│ Top 10 video nhiều lượt xem nhất   (bar chart) │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│ Lượt xem theo thời gian   [Theo ngày|Theo tháng]│
│                                  (line chart)  │
└───────────────────────────────────────────────┘
```
Desktop: 3 thẻ trên 1 hàng; 2 biểu đồ mỗi cái 1 hàng (hoặc 2 cột khi màn hình ≥ 1440px). Mobile: xếp dọc.

### Dữ liệu
| Khu vực | Hàm RPC |
|---|---|
| 3 thẻ | `app_dashboard_stats(p_token)` |
| Bar chart | `app_top_videos(p_token, 10)` |
| Line chart | `app_views_by_period(p_token, 'day' \| 'month')` |

- Gọi 3 hàm **song song** bằng `Promise.all`.
- Đổi dung lượng: `formatBytes(bytes)` → B / KB / MB / GB, 1 chữ số thập phân, dấu phẩy kiểu Việt Nam.
- Nút Theo ngày / Theo tháng: chỉ gọi lại line chart; hủy chart cũ bằng `chart.destroy()` trước khi vẽ mới.
- Click cột trong bar chart → mở `video-form.html?id=...` (ADMIN) hoặc `video-detail.html?id=...` (USER, nếu có trang này).
- Mỗi khu vực có skeleton khi tải, và thông báo lỗi riêng + nút "Thử lại".

---

## 2. `videos.html` – Danh sách video

**Quyền**: ADMIN (đầy đủ), USER (chỉ xem – ẩn nút Thêm, Edit, Delete; cột Action hiện "—").

### Bố cục
```
Danh sách video                              [+ Thêm video]
[🔍 Tìm theo tiêu đề...] [Danh mục ▾] [Sắp xếp: Mới nhất ▾]
┌────┬───────────┬────────────────────────┬─────────┬────────┬─────────────┐
│ ID │ Thumbnail │ Title                  │ Views   │ Trạng  │ Action      │
├────┼───────────┼────────────────────────┼─────────┼────────┼─────────────┤
│ 15 │ [ảnh]     │ Video mẫu số 15        │ 12.345  │PUBLISH │ ✏️ Edit 🗑 Delete│
│    │           │ Công nghệ · 05:12      │         │        │             │
└────┴───────────┴────────────────────────┴─────────┴────────┴─────────────┘
Hiển thị 1–10 / 15 video              « Trước  1  2  Sau »
```

### Cột bắt buộc
| Cột | Nội dung |
|---|---|
| ID | `id` |
| Thumbnail | `<img>` 96×54, `loading="lazy"`; lỗi ảnh / null → ảnh placeholder xám có icon 🎬 |
| Title | Tiêu đề (đậm) + dòng phụ: tên danh mục · thời lượng `mm:ss` |
| Views | Định dạng `12.345` |
| Action | **Edit** → `video-form.html?id={id}`; **Delete** → modal xác nhận |

Cột thêm (nên có): Trạng thái (badge).

### Hành vi
- Ô tìm kiếm: **debounce 400ms**, reset về trang 1.
- Bộ lọc danh mục: lấy từ `app_list_categories`.
- Sắp xếp: `newest` (Mới nhất) / `views` (Nhiều lượt xem).
- Lưu trạng thái tìm kiếm, lọc, trang vào URL (`?q=&cat=&sort=&page=`) để F5 không mất.
- **Delete**:
  1. Modal: "Xóa video **{title}**? Thao tác không thể hoàn tác."
  2. Gọi `app_delete_video(p_token, id)` → nhận `video_path`, `thumbnail_path`.
  3. Xóa file: `supabase.storage.from('videos').remove([video_path])`, tương tự `thumbnails` (bỏ qua nếu null; lỗi xóa file chỉ ghi console.warn, không chặn).
  4. Toast "Đã xóa video", tải lại trang hiện tại (nếu trang trống thì lùi 1 trang).
- Trạng thái rỗng: "Không tìm thấy video phù hợp".

---

## 3. `video-form.html` – Thêm / Sửa video

**Quyền**: chỉ ADMIN. USER vào → toast lỗi + chuyển `videos.html`.
- Không có `?id` → chế độ **Thêm**, tiêu đề "Thêm video".
- Có `?id=12` → chế độ **Sửa**, gọi `app_get_video` để điền sẵn.

### Trường
| Trường | Ràng buộc |
|---|---|
| Tiêu đề * | 1–200 ký tự |
| Mô tả | ≤ 2000 ký tự, có bộ đếm |
| Danh mục | select (có lựa chọn "— Không chọn —") |
| Trạng thái | PUBLISHED / DRAFT / HIDDEN |
| File video * (bắt buộc khi thêm) | mp4 / webm / mov, ≤ 50MB; hiện tên file, dung lượng, thời lượng; xem trước bằng `<video controls>` |
| Thumbnail | jpg / png / webp, ≤ 5MB; xem trước ảnh |

Gợi ý: nút "Lấy ảnh từ video" – vẽ khung hình giây thứ 1 lên `<canvas>` và xuất `image/jpeg` làm thumbnail nếu người dùng không chọn ảnh.

### Luồng lưu
1. Kiểm tra form ở frontend.
2. Nếu có file video mới → upload:
   - Đường dẫn: `videos/{yyyy}/{mm}/{timestamp}-{tên-file-đã-bỏ-dấu}.mp4`
   - `supabase.storage.from('videos').upload(path, file, { contentType: file.type, upsert: false })`
   - Lấy URL: `supabase.storage.from('videos').getPublicUrl(path).data.publicUrl`
3. Tương tự với thumbnail (bucket `thumbnails`).
4. Lấy `duration` bằng thẻ `<video>` ẩn: đọc `video.duration` sau sự kiện `loadedmetadata`.
5. Gọi `app_create_video(p_token, data)` hoặc `app_update_video(p_token, id, data)` với `file_size = file.size`, `thumbnail_size = thumbFile.size`.
6. Khi **sửa và thay file**: sau khi lưu DB thành công mới xóa file cũ khỏi Storage.
7. Nếu lưu DB lỗi sau khi đã upload → xóa file vừa upload (tránh file rác).
8. Thành công → toast → về `videos.html`.

Nút: **Lưu**, **Hủy** (về danh sách). Khi đang upload: khóa form, hiện "Đang tải lên…" (supabase-js không có % tiến trình thật → dùng thanh chạy vô hạn).
Cảnh báo khi rời trang mà form đã thay đổi (`beforeunload`).

---

## 4. `categories.html` – Danh mục (mở rộng)

**Quyền**: chỉ ADMIN.
- Bảng: ID, Tên, Slug, Số video, Action (Sửa, Xóa).
- Nút "+ Thêm danh mục" → modal có Tên, Slug (tự tạo từ tên, bỏ dấu tiếng Việt, cho sửa), Mô tả.
- Hàm: `app_list_categories`, `app_save_category`, `app_delete_category`.
- Xóa danh mục: cảnh báo "Video thuộc danh mục này sẽ chuyển thành không có danh mục".

---

## 5. `video-detail.html?id=` – Chi tiết + Bình luận (mở rộng)

**Quyền**: ADMIN, USER.
- Trình phát `<video controls>` từ `video_url`, tiêu đề, mô tả, danh mục, lượt xem, ngày tạo, người tạo.
- Khu bình luận: danh sách (`app_list_comments`), ô nhập + nút Gửi (`app_add_comment`).
- Nút xóa trên bình luận của mình (USER) hoặc mọi bình luận (ADMIN) → `app_delete_comment`.
- ADMIN có nút Ẩn / Hiện → `app_toggle_comment`; bình luận ẩn hiển thị mờ, có nhãn "Đã ẩn".
- Hiển thị nội dung bình luận bằng `textContent` (chống XSS).

---

## 6. Trang Auth

Xem chi tiết trong `03-AUTH.md`: `login.html`, `register.html`, `forgot-password.html`.

## 7. `index.html`

Chỉ chuyển hướng: có phiên → `dashboard.html`, không có → `login.html`.
