import { api } from './api.js';
import { clearSession } from './session.js';
import { el } from './ui.js';

// Render sidebar + header; trả về phần tử <main class="content"> để trang đổ nội dung
export function renderLayout({ user, active, title }) {
  const root = document.getElementById('app');
  const content = root.querySelector('[data-content]');
  content.remove();

  const links = [
    ['dashboard', 'dashboard.html', '📊', 'Dashboard'],
    ['videos', 'videos.html', '🎬', 'Videos'],
  ];
  if (user.role === 'ADMIN') {
    links.push(['categories', 'categories.html', '🗂', 'Danh mục']);
    links.push(['users', 'users.html', '👥', 'Danh Sách User']);
  }

  const overlay = el('div', { class: 'overlay' });
  const nav = el('nav', { class: 'nav' }, links.map(([key, href, icon, label]) =>
    el('a', { href, class: key === active ? 'active' : '', text: `${icon}  ${label}` })));
  const logoutBtn = el('button', { type: 'button', text: '⎋  Đăng xuất' });
  const sidebar = el('aside', { class: 'sidebar' },
    el('div', { class: 'brand' }, el('img', { src: 'assets/logo.svg', alt: '' }), el('span', { text: 'Video Admin' })),
    nav, el('div', { class: 'sidebar-foot' }, logoutBtn));

  const toggle = open => { sidebar.classList.toggle('open', open); overlay.classList.toggle('open', open); };
  overlay.onclick = () => toggle(false);

  const header = el('header', { class: 'header' },
    el('button', { class: 'menu-btn', type: 'button', 'aria-label': 'Mở menu', text: '☰', onclick: () => toggle(true) }),
    el('div', { class: 'title', text: title }),
    el('div', { class: 'user-box' }, el('span', { text: user.username }), el('span', { class: 'badge badge-' + user.role, text: user.role })));

  logoutBtn.onclick = async () => {
    logoutBtn.disabled = true;
    try { await api.logout(); } catch { /* bỏ qua lỗi, vẫn đăng xuất cục bộ */ }
    clearSession();
    location.replace('login.html');
  };

  const main = el('div', { class: 'main' }, header, content);
  root.append(sidebar, overlay, main);
  document.title = title + ' – Video Admin';
  return content;
}
