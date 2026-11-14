// Toast, modal xác nhận, trạng thái loading/rỗng/lỗi
function toastRoot() {
  let r = document.getElementById('toast-root');
  if (!r) { r = document.createElement('div'); r.id = 'toast-root'; document.body.appendChild(r); }
  return r;
}

export function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  toastRoot().appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Hộp xác nhận (trả Promise<boolean>); bodyNode là Node để tránh chèn HTML chưa escape
export function confirmModal({ title, bodyNode, text, confirmLabel = 'Xóa', danger = true }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal';
    const h = document.createElement('h2'); h.textContent = title;
    const p = document.createElement('p');
    if (bodyNode) p.appendChild(bodyNode); else p.textContent = text || '';
    const actions = document.createElement('div'); actions.className = 'modal-actions';
    const cancel = document.createElement('button'); cancel.className = 'btn btn-outline'; cancel.textContent = 'Hủy';
    const ok = document.createElement('button'); ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary'); ok.textContent = confirmLabel;
    actions.append(cancel, ok);
    box.append(h, p, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const close = v => { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = e => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    cancel.onclick = () => close(false);
    ok.onclick = () => close(true);
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(false); });
    ok.focus();
  });
}

// Đặt trạng thái cho nút đang gửi
export function setLoading(btn, on) {
  btn.disabled = on;
  btn.classList.toggle('is-loading', on);
}

export function showSkeleton(container, rows = 4, height = 48) {
  container.replaceChildren();
  for (let i = 0; i < rows; i++) {
    const d = document.createElement('div');
    d.className = 'skeleton';
    d.style.cssText = `height:${height}px;margin-bottom:10px`;
    container.appendChild(d);
  }
}

export function showState(container, { icon = '📭', message, retry, action }) {
  container.replaceChildren();
  const box = document.createElement('div'); box.className = 'state-box';
  const i = document.createElement('div'); i.className = 'icon'; i.textContent = icon;
  const m = document.createElement('div'); m.textContent = message;
  box.append(i, m);
  if (retry) {
    const b = document.createElement('button'); b.className = 'btn btn-outline btn-sm'; b.style.marginTop = '12px';
    b.textContent = 'Thử lại'; b.onclick = retry; box.appendChild(b);
  }
  if (action) box.appendChild(action);
  container.appendChild(box);
}

// Tạo phần tử nhanh, nội dung luôn qua textContent
export function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  children.flat().forEach(c => { if (c !== null && c !== undefined) e.append(c); });
  return e;
}
