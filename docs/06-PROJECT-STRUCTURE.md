# 06 – CẤU TRÚC DỰ ÁN & CẤU HÌNH

## 1. Cây thư mục

```
video-admin/
├── supabase.txt                ← thông tin kết nối (KHÔNG commit lên Git)
├── .gitignore                  ← chứa dòng: supabase.txt
├── index.html
├── login.html
├── register.html
├── forgot-password.html
├── dashboard.html
├── videos.html
├── video-form.html
├── categories.html             (mở rộng)
├── video-detail.html           (mở rộng)
├── assets/
│   ├── logo.svg
│   └── placeholder-thumb.svg
├── css/
│   ├── base.css                ← biến màu, reset, button, input, badge, toast, modal
│   ├── auth.css                ← giao diện trang login/register/forgot
│   └── admin.css               ← sidebar, header, card, table, chart, pagination
├── js/
│   ├── config.js               ← đọc supabase.txt
│   ├── supabase-client.js      ← tạo client dùng chung
│   ├── session.js              ← lưu/đọc/xóa phiên (localStorage/sessionStorage)
│   ├── api.js                  ← bọc toàn bộ lời gọi RPC + xử lý lỗi chung
│   ├── storage.js              ← upload / xóa / lấy URL file
│   ├── guard.js                ← kiểm tra đăng nhập + role khi mở trang
│   ├── layout.js               ← render sidebar + header
│   ├── ui.js                   ← toast, modal xác nhận, loading, skeleton
│   ├── utils.js                ← formatNumber, formatBytes, formatDuration, slugify, debounce, escapeHtml
│   └── pages/
│       ├── login.js
│       ├── register.js
│       ├── forgot-password.js
│       ├── dashboard.js
│       ├── videos.js
│       ├── video-form.js
│       ├── categories.js
│       └── video-detail.js
└── docs/                       ← bộ file .md này
```

## 2. File `supabase.txt`

Đặt ở **thư mục gốc** dự án, định dạng `KEY=VALUE`, mỗi dòng một giá trị:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

Lấy tại: **Supabase Dashboard → Project Settings → API** (hoặc **Data API**):
- `Project URL` → `SUPABASE_URL`
- `anon` `public` key (hoặc *Publishable key*) → `SUPABASE_ANON_KEY`

> ⛔ **Tuyệt đối không** dán `service_role` / *secret key* vào file này – file được trình duyệt tải về nên ai cũng xem được.

## 3. `js/config.js` – đọc `supabase.txt`

```js
// Đọc supabase.txt (dạng KEY=VALUE), bỏ dòng trống và dòng bắt đầu bằng #
let cachedConfig = null;

export async function loadConfig() {
  if (cachedConfig) return cachedConfig;

  const res = await fetch('supabase.txt', { cache: 'no-store' });
  if (!res.ok) throw new Error('Không đọc được file supabase.txt. Hãy chạy bằng Live Server.');

  const text = await res.text();
  const config = {};
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    config[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  });

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('supabase.txt thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  }
  cachedConfig = config;
  return config;
}
```

## 4. `js/supabase-client.js`

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadConfig } from './config.js';

let client = null;

export async function getSupabase() {
  if (client) return client;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false } // không dùng Supabase Auth
  });
  return client;
}
```

## 5. Nhúng thư viện trong HTML

```html
<!-- Font -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/admin.css">

<!-- Chart.js (chỉ trang dashboard) – tạo biến toàn cục Chart -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>

<!-- Script của trang, dạng ES Module -->
<script type="module" src="js/pages/dashboard.js"></script>
```

## 6. Cách chạy

1. Cài **VS Code** + extension **Live Server** (Ritwick Dey).
2. Mở thư mục `video-admin` → chuột phải `index.html` → **Open with Live Server**.
3. Trình duyệt mở `http://127.0.0.1:5500/index.html`.

> Mở bằng cách nhấp đúp file (`file://...`) sẽ **lỗi** vì trình duyệt chặn `fetch('supabase.txt')` và ES Module.

## 7. `.gitignore`

```
supabase.txt
.DS_Store
.vscode/
```

## 8. Deploy (tùy chọn)

Có thể deploy tĩnh lên Netlify / Vercel / GitHub Pages. Khi đó phải upload kèm `supabase.txt` (vì code đọc file này) – nhớ chỉ chứa **anon key**.
