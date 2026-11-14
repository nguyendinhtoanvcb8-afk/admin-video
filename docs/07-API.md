# 07 – API (hàm RPC Supabase)

Mọi lời gọi: `const { data, error } = await supabase.rpc('ten_ham', { tham_so })`.
Tên tham số trong JS **phải trùng tên** trong SQL (có tiền tố `p_`).

## 1. Danh sách hàm

### Auth (không cần token)
| Hàm | Tham số | Trả về |
|---|---|---|
| `app_login` | `p_login`, `p_password` | `{ token, user }` |
| `app_register` | `p_username`, `p_email`, `p_password`, `p_full_name?` | `{ token, user }` |
| `app_request_password_reset` | `p_email` | `{ message, demo_code }` |
| `app_reset_password` | `p_email`, `p_code`, `p_new_password` | `{ message }` |

### Phiên
| Hàm | Tham số | Trả về | Quyền |
|---|---|---|---|
| `app_get_current_user` | `p_token` | `user` | đã đăng nhập |
| `app_logout` | `p_token` | – | đã đăng nhập |

### Dashboard
| Hàm | Tham số | Trả về | Quyền |
|---|---|---|---|
| `app_dashboard_stats` | `p_token` | `{ total_videos, total_views, total_storage_bytes }` | USER+ |
| `app_top_videos` | `p_token`, `p_limit` (10) | `[{ id, title, thumbnail_url, views }]` | USER+ |
| `app_views_by_period` | `p_token`, `p_group` (`day`/`month`), `p_from?`, `p_to?` | `[{ period, views }]` | USER+ |

Mặc định `app_views_by_period`: `day` = 30 ngày gần nhất, `month` = 12 tháng gần nhất. `p_from`, `p_to` dạng `'2026-01-31'`.

### Video
| Hàm | Tham số | Trả về | Quyền |
|---|---|---|---|
| `app_list_videos` | `p_token`, `p_search?`, `p_category_id?`, `p_page`, `p_page_size`, `p_sort` (`newest`/`views`) | `{ items, total, page, page_size }` | USER+ |
| `app_get_video` | `p_token`, `p_id` | object video đầy đủ | USER+ |
| `app_create_video` | `p_token`, `p_data` (object) | `{ id }` | ADMIN |
| `app_update_video` | `p_token`, `p_id`, `p_data` (chỉ key cần sửa) | `{ id }` | ADMIN |
| `app_delete_video` | `p_token`, `p_id` | `{ video_path, thumbnail_path }` | ADMIN |

`p_data` gồm các key: `title, description, category_id, status, video_path, video_url, thumbnail_path, thumbnail_url, file_size, thumbnail_size, duration`.

### Danh mục
| Hàm | Tham số | Quyền |
|---|---|---|
| `app_list_categories` | `p_token` | USER+ |
| `app_save_category` | `p_token`, `p_id` (null = thêm), `p_name`, `p_slug`, `p_description?` | ADMIN |
| `app_delete_category` | `p_token`, `p_id` | ADMIN |

### Bình luận
| Hàm | Tham số | Quyền |
|---|---|---|
| `app_list_comments` | `p_token`, `p_video_id` | USER+ |
| `app_add_comment` | `p_token`, `p_video_id`, `p_content` | USER+ |
| `app_delete_comment` | `p_token`, `p_comment_id` | ADMIN hoặc chủ bình luận |
| `app_toggle_comment` | `p_token`, `p_comment_id`, `p_hidden` | ADMIN |

## 2. Mẫu `js/api.js`

```js
import { getSupabase } from './supabase-client.js';
import { getToken, clearSession } from './session.js';

// Gọi RPC chung: tự thêm token, chuẩn hóa lỗi
async function rpc(fn, params = {}, { auth = true } = {}) {
  const supabase = await getSupabase();
  const body = auth ? { p_token: getToken(), ...params } : params;
  const { data, error } = await supabase.rpc(fn, body);

  if (error) {
    const msg = error.message || 'Có lỗi xảy ra';
    if (msg.includes('UNAUTHORIZED')) {
      clearSession();
      window.location.href = 'login.html?expired=1';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    // Bỏ tiền tố kỹ thuật để hiện cho người dùng
    throw new Error(msg.replace(/^(FORBIDDEN|UNAUTHORIZED):\s*/, ''));
  }
  return data;
}

export const api = {
  // Auth
  login:            (login, password) => rpc('app_login', { p_login: login, p_password: password }, { auth: false }),
  register:         (u)               => rpc('app_register', { p_username: u.username, p_email: u.email, p_password: u.password, p_full_name: u.fullName || null }, { auth: false }),
  requestReset:     (email)           => rpc('app_request_password_reset', { p_email: email }, { auth: false }),
  resetPassword:    (email, code, pw) => rpc('app_reset_password', { p_email: email, p_code: code, p_new_password: pw }, { auth: false }),
  currentUser:      ()                => rpc('app_get_current_user'),
  logout:           ()                => rpc('app_logout'),

  // Dashboard
  stats:            ()                => rpc('app_dashboard_stats'),
  topVideos:        (limit = 10)      => rpc('app_top_videos', { p_limit: limit }),
  viewsByPeriod:    (group = 'day')   => rpc('app_views_by_period', { p_group: group }),

  // Video
  listVideos:       (o = {})          => rpc('app_list_videos', {
                                          p_search: o.search || null, p_category_id: o.categoryId || null,
                                          p_page: o.page || 1, p_page_size: o.pageSize || 10, p_sort: o.sort || 'newest' }),
  getVideo:         (id)              => rpc('app_get_video', { p_id: id }),
  createVideo:      (data)            => rpc('app_create_video', { p_data: data }),
  updateVideo:      (id, data)        => rpc('app_update_video', { p_id: id, p_data: data }),
  deleteVideo:      (id)              => rpc('app_delete_video', { p_id: id }),

  // Danh mục
  listCategories:   ()                => rpc('app_list_categories'),
  saveCategory:     (c)               => rpc('app_save_category', { p_id: c.id || null, p_name: c.name, p_slug: c.slug, p_description: c.description || null }),
  deleteCategory:   (id)              => rpc('app_delete_category', { p_id: id }),

  // Bình luận
  listComments:     (videoId)         => rpc('app_list_comments', { p_video_id: videoId }),
  addComment:       (videoId, text)   => rpc('app_add_comment', { p_video_id: videoId, p_content: text }),
  deleteComment:    (id)              => rpc('app_delete_comment', { p_comment_id: id }),
  toggleComment:    (id, hidden)      => rpc('app_toggle_comment', { p_comment_id: id, p_hidden: hidden }),
};
```

## 3. Mẫu `js/storage.js`

```js
import { getSupabase } from './supabase-client.js';
import { slugify } from './utils.js';

export async function uploadFile(bucket, file) {
  const supabase = await getSupabase();
  const now = new Date();
  const ext = file.name.split('.').pop().toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file';
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${base}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Upload thất bại: ' + error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl, size: file.size };
}

export async function removeFile(bucket, path) {
  if (!path) return;
  const supabase = await getSupabase();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn('Không xóa được file', bucket, path, error.message);
}
```

## 4. Mẫu `js/session.js`

```js
const KEY = 'va_session';

export function saveSession(session, remember = true) {
  (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
}
export function getSession() {
  const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export const getToken = () => getSession()?.token || null;
export const getUser  = () => getSession()?.user  || null;
export const isAdmin  = () => getUser()?.role === 'ADMIN';
export function clearSession() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}
```
