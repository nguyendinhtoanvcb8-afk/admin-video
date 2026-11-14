import { getSession, clearSession, updateUser } from './session.js';
import { api } from './api.js';
import { toast } from './ui.js';

// Kiểm tra phiên (và role nếu cần). Trả về user, hoặc null nếu đã chuyển trang.
export async function requireAuth({ admin = false } = {}) {
  const s = getSession();
  if (!s?.token) {
    const back = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace('login.html?redirect=' + back);
    return null;
  }
  try {
    const user = await api.currentUser();
    updateUser(user);
    if (admin && user.role !== 'ADMIN') {
      toast('Bạn không có quyền truy cập trang này', 'error');
      setTimeout(() => location.replace('videos.html'), 800);
      return null;
    }
    return user;
  } catch (e) {
    clearSession();
    location.replace('login.html?expired=1');
    return null;
  }
}

// Trang auth: có phiên hợp lệ thì chuyển thẳng dashboard
export async function redirectIfLoggedIn() {
  if (!getSession()?.token) return;
  try { await api.currentUser(); location.replace('dashboard.html'); }
  catch { clearSession(); }
}
