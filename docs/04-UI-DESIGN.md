# 04 – UI DESIGN (Light mode, nền trắng)

## 1. Bảng màu (CSS variables – đặt trong `css/base.css`)

```css
:root {
  /* Nền */
  --bg-page:      #F6F7FB;  /* nền ngoài khu nội dung */
  --bg-surface:   #FFFFFF;  /* card, bảng, sidebar, header */
  --bg-hover:     #F1F4F9;
  --border:       #E5E7EB;

  /* Chữ */
  --text-primary:   #111827;
  --text-secondary: #6B7280;
  --text-muted:     #9CA3AF;

  /* Màu chính */
  --primary:        #2563EB;
  --primary-hover:  #1D4ED8;
  --primary-soft:   #EFF6FF;

  /* Trạng thái */
  --success: #16A34A;  --success-soft: #F0FDF4;
  --warning: #D97706;  --warning-soft: #FFFBEB;
  --danger:  #DC2626;  --danger-soft:  #FEF2F2;

  /* Kích thước */
  --radius-sm: 6px;
  --radius:    10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, .06);
  --shadow:    0 4px 12px rgba(16, 24, 40, .08);
  --sidebar-w: 240px;
  --header-h:  64px;

  --font: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
}
```

Font: Google Fonts **Inter** (400, 500, 600, 700) – hỗ trợ tiếng Việt.

## 2. Typography

| Loại | Cỡ | Độ đậm |
|---|---|---|
| Tiêu đề trang (h1) | 24px | 700 |
| Tiêu đề card (h2) | 16px | 600 |
| Số liệu lớn trong thẻ | 28px | 700 |
| Chữ thường | 14px | 400 |
| Chữ phụ / label | 13px | 500, màu `--text-secondary` |

## 3. Bố cục trang admin

```
┌────────────┬──────────────────────────────────────────────┐
│  LOGO      │  HEADER: ☰  Tiêu đề trang      🔍   👤 admin1 ▾│
│            ├──────────────────────────────────────────────┤
│ 📊 Dashboard│                                              │
│ 🎬 Videos  │   NỘI DUNG (nền --bg-page, padding 24px)      │
│ 🗂 Danh mục│                                              │
│            │   ┌────────┐ ┌────────┐ ┌────────┐            │
│            │   │ Card   │ │ Card   │ │ Card   │            │
│            │   └────────┘ └────────┘ └────────┘            │
│ ────────── │                                              │
│ Đăng xuất  │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** trắng, viền phải `--border`, rộng 240px, cố định. Mục đang mở: nền `--primary-soft`, chữ `--primary`, vạch trái 3px.
- **Header** trắng, cao 64px, viền dưới. Bên phải: tên user + **badge role** (ADMIN xanh dương, USER xám).
- Mục "Danh mục" chỉ hiện với ADMIN.
- < 1024px: sidebar ẩn, nút ☰ mở sidebar dạng trượt + lớp phủ mờ.

## 4. Bố cục trang Auth (login / register / forgot)

- Nền `--bg-page`, card trắng ở giữa, rộng tối đa 420px, bo góc `--radius-lg`, đổ bóng `--shadow`.
- Trên card: logo + tên app "Video Admin".
- Input full width, cao 42px, nút chính full width.

## 5. Component

| Component | Mô tả |
|---|---|
| **Button** | `.btn` cao 38px, bo 8px. Biến thể: `.btn-primary` (nền xanh), `.btn-outline` (viền xám, nền trắng), `.btn-danger` (đỏ), `.btn-sm`. Trạng thái `disabled` + `.is-loading` (spinner) |
| **Input / Select / Textarea** | Viền `--border`, focus: viền `--primary` + bóng `0 0 0 3px var(--primary-soft)`. Lỗi: viền `--danger` + dòng chữ đỏ 12px bên dưới |
| **Card** | Nền trắng, viền `--border`, bo `--radius`, padding 20px |
| **Stat card** | Icon tròn màu nhạt bên trái, label phụ, số lớn, (tùy chọn) dòng mô tả |
| **Table** | Header nền `#F9FAFB`, chữ 12px in hoa `--text-secondary`; dòng cao 64px, hover `--bg-hover`; thumbnail 96×54 bo 6px, `object-fit: cover` |
| **Badge** | Bo tròn, chữ 12px: PUBLISHED (xanh lá), DRAFT (vàng), HIDDEN (xám) |
| **Toast** | Góc trên phải, tự ẩn sau 3 giây, 4 loại: success / error / warning / info |
| **Modal xác nhận** | Lớp phủ `rgba(17,24,39,.4)`, hộp trắng 400px, nút Hủy + Xóa (đỏ) |
| **Pagination** | Nút số trang, Trước / Sau, hiển thị "1–10 / 15 video" |
| **Empty state** | Icon + "Chưa có video nào" + nút thêm (ADMIN) |
| **Skeleton** | Khối xám nhấp nháy khi đang tải |
| **Progress bar** | Thanh upload, cao 6px, màu `--primary` |

## 6. Biểu đồ (Chart.js)

- Nền trắng, lưới ngang màu `#F1F5F9`, ẩn lưới dọc.
- **Cột (Top 10)**: màu `#2563EB`, bo góc cột 6px; nhãn trục X rút gọn tối đa 15 ký tự + "…"; tooltip hiện tên đầy đủ + lượt xem có dấu phân cách hàng nghìn.
- **Line (Lượt xem)**: đường `#2563EB` dày 2px, vùng dưới tô `rgba(37,99,235,.08)`, `tension: 0.3`, điểm tròn bán kính 2 (hover 5).
- Font biểu đồ: Inter 12px, màu `#6B7280`.
- Định dạng số: `new Intl.NumberFormat('vi-VN')` → `12.345`.

## 7. Icon

Dùng SVG inline hoặc emoji đơn giản (không cần thư viện icon). Gợi ý: Dashboard 📊, Video 🎬, Danh mục 🗂, Lượt xem 👁, Storage 💾, Sửa ✏️, Xóa 🗑.
