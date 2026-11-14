import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, confirmModal, setLoading, showSkeleton, showState, el } from '../ui.js';
import { slugify } from '../utils.js';

const user = await requireAuth({ admin: true });
if (user) init();

function init() {
  renderLayout({ user, active: 'categories', title: 'Danh mục' });
  const $ = id => document.getElementById(id);

  async function load() {
    $('table-wrap').classList.add('hidden');
    showSkeleton($('state'), 4, 44);
    try {
      const cats = await api.listCategories();
      if (!cats.length) return showState($('state'), { message: 'Chưa có danh mục nào' });
      $('state').replaceChildren();
      $('rows').replaceChildren(...cats.map(c => el('tr', {},
        el('td', { text: c.id }),
        el('td', {}, el('div', { class: 't-title', text: c.name }), el('div', { class: 't-sub', text: c.description || '' })),
        el('td', { text: c.slug }), el('td', { text: c.video_count }),
        el('td', {}, el('div', { class: 'actions' },
          el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: '✏️ Sửa', onclick: () => openModal(c) }),
          el('button', { class: 'btn btn-danger btn-sm', type: 'button', text: '🗑 Xóa', onclick: () => onDelete(c) }))))));
      $('table-wrap').classList.remove('hidden');
    } catch (e) { showState($('state'), { icon: '⚠️', message: e.message, retry: load }); }
  }

  // Modal thêm / sửa danh mục
  function openModal(cat) {
    const name = el('input', { class: 'input', maxlength: 100 });
    const slug = el('input', { class: 'input', maxlength: 100 });
    const desc = el('textarea', { class: 'textarea', maxlength: 500 });
    const err = el('div', { class: 'error-text hidden' });
    name.value = cat?.name || ''; slug.value = cat?.slug || ''; desc.value = cat?.description || '';
    let slugTouched = !!cat;
    slug.addEventListener('input', () => { slugTouched = true; });
    name.addEventListener('input', () => { if (!slugTouched) slug.value = slugify(name.value); });

    const cancel = el('button', { class: 'btn btn-outline', type: 'button', text: 'Hủy' });
    const save = el('button', { class: 'btn btn-primary', type: 'submit', text: 'Lưu' });
    const form = el('form', { class: 'modal', novalidate: true },
      el('h2', { text: cat ? 'Sửa danh mục' : 'Thêm danh mục' }),
      el('div', { class: 'field' }, el('label', { text: 'Tên *' }), name),
      el('div', { class: 'field' }, el('label', { text: 'Slug *' }), slug),
      el('div', { class: 'field' }, el('label', { text: 'Mô tả' }), desc), err,
      el('div', { class: 'modal-actions' }, cancel, save));
    const overlay = el('div', { class: 'modal-overlay' }, form);
    document.body.appendChild(overlay);
    name.focus();
    const close = () => overlay.remove();
    cancel.onclick = close;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const n = name.value.trim(), s = slugify(slug.value);
      if (!n || !s) { err.textContent = 'Tên và slug không được để trống'; err.classList.remove('hidden'); return; }
      setLoading(save, true);
      try {
        await api.saveCategory({ id: cat?.id, name: n, slug: s, description: desc.value.trim() });
        toast('Đã lưu danh mục', 'success'); close(); load();
      } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); setLoading(save, false); }
    });
  }

  async function onDelete(c) {
    const body = document.createDocumentFragment();
    body.append('Xóa danh mục ', el('strong', { text: c.name }), '? Video thuộc danh mục này sẽ chuyển thành không có danh mục.');
    if (!await confirmModal({ title: 'Xác nhận xóa', bodyNode: body })) return;
    try { await api.deleteCategory(c.id); toast('Đã xóa danh mục', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  $('add').addEventListener('click', () => openModal(null));
  load();
}
