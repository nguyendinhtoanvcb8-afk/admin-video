const KEY = 'va_session';

export function saveSession(session, remember = true) {
  clearSession();
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
// Cập nhật thông tin user mới nhất mà giữ nguyên token và nơi lưu
export function updateUser(user) {
  const s = getSession();
  if (!s) return;
  const store = localStorage.getItem(KEY) ? localStorage : sessionStorage;
  store.setItem(KEY, JSON.stringify({ ...s, user }));
}
