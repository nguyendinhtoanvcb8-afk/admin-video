import { api } from '../api.js';
import { saveSession } from '../session.js';
import { redirectIfLoggedIn } from '../guard.js';
import { setLoading } from '../ui.js';
import { fieldError, clearErrors, setNotice, bindPasswordToggles } from './auth-common.js';

const form = document.getElementById('form');
const loginEl = document.getElementById('login');
const pwEl = document.getElementById('password');
const submit = document.getElementById('submit');
const params = new URLSearchParams(location.search);

bindPasswordToggles();
if (params.get('expired')) setNotice('warning', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
redirectIfLoggedIn();

// Chỉ cho chuyển tới trang nội bộ (tránh open redirect)
function safeRedirect() {
  const r = params.get('redirect') || '';
  return /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(r) ? r : 'dashboard.html';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors(form); setNotice('', '');
  const login = loginEl.value.trim();
  let ok = fieldError(loginEl, login ? '' : 'Vui lòng nhập username hoặc email');
  ok = fieldError(pwEl, pwEl.value ? '' : 'Vui lòng nhập mật khẩu') && ok;
  if (!ok) return;

  setLoading(submit, true);
  try {
    const res = await api.login(login, pwEl.value);
    saveSession({ token: res.token, user: res.user }, document.getElementById('remember').checked);
    location.replace(safeRedirect());
  } catch (err) {
    setNotice('error', err.message);
    pwEl.value = '';
    setLoading(submit, false);
  }
});
