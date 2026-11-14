import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, confirmModal, showSkeleton, showState, el } from '../ui.js';
import { formatDate, debounce } from '../utils.js';

const user = await requireAuth({ admin: true });
if (user) init();

function init() {
  renderLayout({ user, active: 'users', title: 'Danh sách User' });
  const $ = id => document.getElementById(id);

  async function load() {
    $('table-wrap').classList.add('hidden');
    showSkeleton($('state'), 5, 44);
    try {
      // Danh sách các account khác (ẩn chính mình)
      const list = (await api.listUsers($('q').value.trim())).filter(u => u.id !== user.id);
      if (!list.length) return showState($('state'), { message: 'Không tìm thấy user nào' });
      $('state').replaceChildren();
      $('rows').replaceChildren(...list.map(row));
      $('table-wrap').classList.remove('hidden');
    } catch (e) { showState($('state'), { icon: '⚠️', message: e.message, retry: load }); }
  }

  function row(u) {
    const sel = el('select', { class: 'select', style: 'min-width:120px;width:auto',
      'aria-label': 'Role của ' + u.username },
      el('option', { value: 'USER', text: 'USER' }), el('option', { value: 'ADMIN', text: 'ADMIN' }));
    sel.value = u.role;
    sel.addEventListener('change', async () => {
      const next = sel.value;
      const body = document.createDocumentFragment();
      body.append('Đổi role của ', el('strong', { text: u.username }), ` thành ${next}?`);
      if (!await confirmModal({ title: 'Đổi role', bodyNode: body, confirmLabel: 'Đổi', danger: false })) { sel.value = u.role; return; }
      sel.disabled = true;
      try {
        await api.setUserRole(u.id, next);
        u.role = next;
        toast(`Đã đổi role ${u.username} thành ${next}`, 'success');
      } catch (e) { sel.value = u.role; toast(e.message, 'error'); }
      finally { sel.disabled = false; }
    });
    return el('tr', {},
      el('td', {}, el('span', { class: 't-title', text: u.username })),
      el('td', { text: u.full_name || '—' }), el('td', { text: u.email }),
      el('td', {}, sel), el('td', { text: formatDate(u.created_at) }));
  }

  $('q').addEventListener('input', debounce(load, 400));
  load();
}
