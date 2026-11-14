import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, confirmModal, showSkeleton, showState, el } from '../ui.js';
import { formatNumber, formatDuration, debounce } from '../utils.js';
import { removeFile } from '../storage.js';

const user = await requireAuth();
if (user) init();

function init() {
  renderLayout({ user, active: 'videos', title: 'Videos' });
  const $ = id => document.getElementById(id);
  const admin = user.role === 'ADMIN';
  const PAGE_SIZE = 10;
  const url = new URLSearchParams(location.search);
  const st = { q: url.get('q') || '', cat: url.get('cat') || '', sort: url.get('sort') === 'views' ? 'views' : 'newest', page: Math.max(1, parseInt(url.get('page')) || 1) };

  if (admin) $('add').classList.remove('hidden');
  $('q').value = st.q; $('sort').value = st.sort;

  function syncUrl() {
    const p = new URLSearchParams();
    if (st.q) p.set('q', st.q);
    if (st.cat) p.set('cat', st.cat);
    if (st.sort !== 'newest') p.set('sort', st.sort);
    if (st.page > 1) p.set('page', st.page);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  async function loadCategories() {
    try {
      const cats = await api.listCategories();
      cats.forEach(c => $('cat').appendChild(el('option', { value: c.id, text: c.name })));
      $('cat').value = st.cat;
    } catch (e) { toast(e.message, 'error'); }
  }

  function thumbCell(v) {
    const img = el('img', { class: 'thumb', loading: 'lazy', alt: '', src: v.thumbnail_url || 'assets/placeholder-thumb.svg' });
    img.onerror = () => { img.onerror = null; img.src = 'assets/placeholder-thumb.svg'; };
    return img;
  }

  function row(v) {
    const actions = admin
      ? el('div', { class: 'actions' },
          el('a', { class: 'btn btn-outline btn-sm', href: 'video-form.html?id=' + v.id, text: '✏️ Edit' }),
          el('button', { class: 'btn btn-danger btn-sm', type: 'button', text: '🗑 Delete', onclick: () => onDelete(v) }))
      : '—';
    const sub = [v.category_name, v.duration ? formatDuration(v.duration) : null].filter(Boolean).join(' · ');
    return el('tr', {},
      el('td', { text: v.id }),
      el('td', {}, thumbCell(v)),
      el('td', {}, el('a', { class: 't-title', href: 'video-detail.html?id=' + v.id, text: v.title }), el('div', { class: 't-sub', text: sub })),
      el('td', { text: formatNumber(v.views) }),
      el('td', {}, el('span', { class: 'badge badge-' + v.status, text: v.status })),
      el('td', {}, actions));
  }

  let lastCount = 0;
  async function load() {
    syncUrl();
    $('table-wrap').classList.add('hidden'); $('pagination').classList.add('hidden');
    showSkeleton($('state'), 5, 56);
    try {
      const res = await api.listVideos({ search: st.q, categoryId: st.cat, page: st.page, pageSize: PAGE_SIZE, sort: st.sort });
      const totalPages = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
      if (st.page > totalPages) { st.page = totalPages; return load(); } // trang trống thì lùi
      lastCount = res.items.length;
      if (!res.items.length) {
        const filtered = st.q || st.cat;
        showState($('state'), {
          message: filtered ? 'Không tìm thấy video phù hợp' : 'Chưa có video nào',
          action: !filtered && admin ? el('a', { class: 'btn btn-primary btn-sm', style: 'margin-top:12px', href: 'video-form.html', text: '+ Thêm video' }) : null });
        return;
      }
      $('state').replaceChildren();
      $('rows').replaceChildren(...res.items.map(row));
      $('table-wrap').classList.remove('hidden');
      renderPagination(res.total, totalPages);
    } catch (e) { showState($('state'), { icon: '⚠️', message: e.message, retry: load }); }
  }

  function renderPagination(total, totalPages) {
    const from = (st.page - 1) * PAGE_SIZE + 1, to = from + lastCount - 1;
    $('range').textContent = `Hiển thị ${from}–${to} / ${total} video`;
    const go = p => () => { st.page = p; load(); };
    const pages = [el('button', { type: 'button', text: '« Trước', disabled: st.page === 1, onclick: go(st.page - 1) })];
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - st.page) > 1) {
        if (Math.abs(p - st.page) === 2) pages.push(el('span', { text: '…' }));
        continue;
      }
      pages.push(el('button', { type: 'button', class: p === st.page ? 'active' : '', text: p, onclick: go(p) }));
    }
    pages.push(el('button', { type: 'button', text: 'Sau »', disabled: st.page === totalPages, onclick: go(st.page + 1) }));
    $('pages').replaceChildren(...pages);
    $('pagination').classList.remove('hidden');
  }

  async function onDelete(v) {
    const body = document.createDocumentFragment();
    body.append('Xóa video ', el('strong', { text: v.title }), '? Thao tác không thể hoàn tác.');
    const ok = await confirmModal({ title: 'Xác nhận xóa', bodyNode: body });
    if (!ok) return;
    try {
      const paths = await api.deleteVideo(v.id);
      await removeFile('videos', paths.video_path);
      await removeFile('thumbnails', paths.thumbnail_path);
      toast('Đã xóa video', 'success');
      if (lastCount === 1 && st.page > 1) st.page--;
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  $('q').addEventListener('input', debounce(() => { st.q = $('q').value.trim(); st.page = 1; load(); }, 400));
  $('cat').addEventListener('change', () => { st.cat = $('cat').value; st.page = 1; load(); });
  $('sort').addEventListener('change', () => { st.sort = $('sort').value; st.page = 1; load(); });

  loadCategories().then(load);
}
