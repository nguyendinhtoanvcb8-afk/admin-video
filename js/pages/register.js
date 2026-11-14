import { api } from '../api.js';
import { saveSession } from '../session.js';
import { redirectIfLoggedIn } from '../guard.js';
import { setLoading } from '../ui.js';
import { fieldError, clearErrors, setNotice, bindPasswordToggles } from './auth-common.js';

const form = document.getElementById('form');
const $ = id => document.getElementById(id);
const submit = $('submit');

bindPasswordToggles();
redirectIfLoggedIn();

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors(form); setNotice('', '');
  const username = $('username').value.trim(), email = $('email').value.trim();
  const pw = $('password').value, pw2 = $('password2').value;

  let ok = true;
  ok = fieldError($('username'), /^[A-Za-z0-9_]{3,30}$/.test(username) ? '' : 'Username 3–30 ký tự, chỉ gồm chữ, số và dấu _') && ok;
  ok = fieldError($('email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email không đúng định dạng') && ok;
  ok = fieldError($('password'), pw.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự') && ok;
  ok = fieldError($('password2'), pw === pw2 ? '' : 'Mật khẩu nhập lại không khớp') && ok;
  if (!ok) return;

  setLoading(submit, true);
  try {
    const res = await api.register({ username, email, password: pw, fullName: $('fullName').value.trim() });
    saveSession({ token: res.token, user: res.user }, true);
    location.replace('dashboard.html');
  } catch (err) {
    setNotice('error', err.message);
    setLoading(submit, false);
  }
});
