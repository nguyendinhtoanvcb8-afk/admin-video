// Tiện ích dùng chung cho 3 trang auth
export function fieldError(input, message) {
  const err = input.closest('.field').querySelector('.error-text');
  input.classList.toggle('is-invalid', !!message);
  if (err) { err.textContent = message || ''; err.classList.toggle('hidden', !message); }
  return !message;
}

export function clearErrors(form) {
  form.querySelectorAll('.input').forEach(i => fieldError(i, ''));
}

export function setNotice(type, message) {
  const box = document.getElementById('notice');
  box.replaceChildren();
  if (!message) return;
  const d = document.createElement('div');
  d.className = 'alert alert-' + type;
  d.textContent = message;
  box.appendChild(d);
}

export function bindPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}
