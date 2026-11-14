import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, confirmModal, setLoading, showSkeleton, showState, el } from '../ui.js';
import { formatNumber, formatDuration, formatDate } from '../utils.js';

const user = await requireAuth();
if (user) init();

function init() {
  renderLayout({ user, active: 'videos', title: 'Chi tiết video' });
  const $ = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const admin = user.role === 'ADMIN';

  async function loadVideo() {
    if (!id) return showState($('state'), { icon: '⚠️', message: 'Thiếu mã video' });
    showSkeleton($('state'), 3, 80);
    try {
      const v = await api.getVideo(id);
      $('state').replaceChildren();
      $('player').src = v.video_url || '';
      if (v.thumbnail_url) $('player').poster = v.thumbnail_url;
      $('d-title').textContent = v.title;
      $('d-meta').textContent = [v.category_name, `${formatNumber(v.views)} lượt xem`, v.duration ? formatDuration(v.duration) : null,
        formatDate(v.created_at), v.created_by_username ? 'bởi ' + v.created_by_username : null].filter(Boolean).join(' · ');
      $('d-desc').textContent = v.description || 'Không có mô tả.';
      $('detail').classList.remove('hidden');
      document.title = v.title + ' – Video Admin';
      loadComments();
    } catch (e) { showState($('state'), { icon: '⚠️', message: e.message, retry: loadVideo }); }
  }

  async function loadComments() {
    showSkeleton($('cstate'), 2, 40); $('clist').replaceChildren();
    try {
      const list = await api.listComments(id);
      $('cstate').replaceChildren();
      if (!list.length) return showState($('cstate'), { icon: '💬', message: 'Chưa có bình luận nào' });
      $('clist').replaceChildren(...list.map(commentNode));
    } catch (e) { showState($('cstate'), { icon: '⚠️', message: e.message, retry: loadComments }); }
  }

  function commentNode(c) {
    const canDelete = admin || c.user_id === user.id;
    const btns = [];
    if (admin) btns.push(el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: c.is_hidden ? 'Hiện' : 'Ẩn', onclick: () => act(() => api.toggleComment(c.id, !c.is_hidden)) }));
    if (canDelete) btns.push(el('button', { class: 'btn btn-danger btn-sm', type: 'button', text: 'Xóa', onclick: async () => {
      if (await confirmModal({ title: 'Xóa bình luận', text: 'Bạn có chắc muốn xóa bình luận này?' })) act(() => api.deleteComment(c.id));
    } }));
    return el('div', { class: 'comment' + (c.is_hidden ? ' is-hidden' : '') },
      el('div', { class: 'avatar', text: (c.username || '?')[0].toUpperCase() }),
      el('div', { class: 'comment-body' },
        el('div', {}, el('strong', { text: c.username }), el('span', { class: 't-sub', text: ' · ' + formatDate(c.created_at) }),
          c.is_hidden ? el('span', { class: 'badge badge-HIDDEN', style: 'margin-left:8px', text: 'Đã ẩn' }) : null),
        el('div', { class: 'comment-text', text: c.content })),
      el('div', { class: 'actions' }, btns));
  }

  async function act(fn) {
    try { await fn(); loadComments(); } catch (e) { toast(e.message, 'error'); }
  }

  $('cform').addEventListener('submit', async e => {
    e.preventDefault();
    const text = $('ctext').value.trim();
    $('cerr').classList.toggle('hidden', !!text);
    if (!text) { $('cerr').textContent = 'Vui lòng nhập nội dung bình luận'; return; }
    setLoading($('csend'), true);
    try { await api.addComment(id, text); $('ctext').value = ''; loadComments(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setLoading($('csend'), false); }
  });

  loadVideo();
}
