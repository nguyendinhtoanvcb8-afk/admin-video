const nf = new Intl.NumberFormat('vi-VN');

export const formatNumber = n => nf.format(Number(n) || 0);

export function formatBytes(bytes) {
  let b = Number(bytes) || 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
  return (i === 0 ? nf.format(b) : b.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + ' ' + units[i];
}

// 125 -> "02:05", 3700 -> "1:01:40"
export function formatDuration(sec) {
  sec = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = x => String(x).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN');
}

export function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function truncate(s, n = 15) {
  s = String(s ?? '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}
