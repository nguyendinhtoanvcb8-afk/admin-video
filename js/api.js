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

  // User (ADMIN)
  listUsers:        (search)          => rpc('app_list_users', { p_search: search || null }),
  setUserRole:      (id, role)        => rpc('app_set_user_role', { p_user_id: id, p_role: role }),

  // Bình luận
  listComments:     (videoId)         => rpc('app_list_comments', { p_video_id: videoId }),
  addComment:       (videoId, text)   => rpc('app_add_comment', { p_video_id: videoId, p_content: text }),
  deleteComment:    (id)              => rpc('app_delete_comment', { p_comment_id: id }),
  toggleComment:    (id, hidden)      => rpc('app_toggle_comment', { p_comment_id: id, p_hidden: hidden }),
};
