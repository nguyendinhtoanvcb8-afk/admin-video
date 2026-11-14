import { api } from '../api.js';
import { setLoading } from '../ui.js';
import { fieldError, clearErrors, setNotice, bindPasswordToggles } from './auth-common.js';

const $ = id => document.getElementById(id);
const form1 = $('form1'), form2 = $('form2');
let cooldownTimer = null;

bindPasswordToggles();

function startCooldown() {
  const btn = $('resend');
  let left = 60;
  btn.disabled = true;
  clearInterval(cooldownTimer);
  const tick = () => {
    btn.textContent = left > 0 ? `Gửi lại mã (${left}s)` : 'Gửi lại mã';
    if (left-- <= 0) { clearInterval(cooldownTimer); btn.disabled = false; }
  };
  tick();
  cooldownTimer = setInterval(tick, 1000);
}

// Bước 1: gửi email lấy mã
async function requestCode(email, btn) {
  setLoading(btn, true);
  try {
    const res = await api.requestReset(email);
    const msg = 'Nếu email tồn tại, mã khôi phục đã được tạo.';
    form1.classList.add('hidden'); form2.classList.remove('hidden');
    $('email2').value = email;
    setNotice('info', msg);
    if (res?.demo_code) { // chế độ học tập: hiện mã trên màn hình
      const box = document.getElementById('notice');
      const d = document.createElement('div');
      d.className = 'alert alert-warning';
      d.textContent = `Mã khôi phục (demo): ${res.demo_code} – hiệu lực 15 phút`;
      box.appendChild(d);
    }
    startCooldown();
  } catch (err) {
    setNotice('error', err.message);
  } finally { setLoading(btn, false); }
}

form1.addEventListener('submit', e => {
  e.preventDefault();
  clearErrors(form1); setNotice('', '');
  const email = $('email').value.trim();
  if (!fieldError($('email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email không đúng định dạng')) return;
  requestCode(email, $('submit1'));
});

$('resend').addEventListener('click', () => requestCode($('email2').value, $('resend')).then(() => {}));

$('changeEmail').addEventListener('click', e => {
  e.preventDefault();
  form2.classList.add('hidden'); form1.classList.remove('hidden');
  setNotice('', '');
});

// Bước 2: đặt mật khẩu mới
form2.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors(form2); setNotice('', '');
  const code = $('code').value.trim(), pw = $('password').value, pw2 = $('password2').value;
  let ok = fieldError($('code'), /^\d{6}$/.test(code) ? '' : 'Mã gồm 6 chữ số');
  ok = fieldError($('password'), pw.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự') && ok;
  ok = fieldError($('password2'), pw === pw2 ? '' : 'Mật khẩu nhập lại không khớp') && ok;
  if (!ok) return;

  const btn = $('submit2');
  setLoading(btn, true);
  try {
    await api.resetPassword($('email2').value, code, pw);
    setNotice('success', 'Đặt lại mật khẩu thành công. Đang chuyển tới trang đăng nhập…');
    setTimeout(() => location.replace('login.html'), 2000);
  } catch (err) {
    setNotice('error', err.message);
    setLoading(btn, false);
  }
});
