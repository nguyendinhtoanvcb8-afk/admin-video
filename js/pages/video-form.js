import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, setLoading, showSkeleton, showState, el } from '../ui.js';
import { formatBytes, formatDuration } from '../utils.js';
import { uploadFile, removeFile } from '../storage.js';

const user = await requireAuth({ admin: true });
if (user) init();

function init() {
  const editId = new URLSearchParams(location.search).get('id');
  renderLayout({ user, active: 'videos', title: editId ? 'Sửa video' : 'Thêm video' });
  const $ = id => document.getElementById(id);
  const form = $('form');
  $('heading').textContent = editId ? 'Sửa video' : 'Thêm video';

  const MAX_VIDEO = 50 * 1024 * 1024, MAX_THUMB = 5 * 1024 * 1024;
  const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
  const THUMB_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  let existing = null;      // video hiện tại khi sửa
  let duration = null;      // thời lượng (giây) của file mới chọn
  let grabbedThumb = null;  // File tạo từ khung hình video
  let dirty = false;
  let saving = false;
  let objectUrls = [];

  const fieldErr = (input, msg) => {
    const err = input.closest('.field').querySelector('.error-text');
    input.classList.toggle('is-invalid', !!msg);
    err.textContent = msg || ''; err.classList.toggle('hidden', !msg);
    return !msg;
  };
  const makeUrl = f => { const u = URL.createObjectURL(f); objectUrls.push(u); return u; };

  window.addEventListener('beforeunload', e => { if (dirty && !saving) { e.preventDefault(); e.returnValue = ''; } });
  form.addEventListener('input', () => { dirty = true; });
  $('description').addEventListener('input', () => { $('desc-count').textContent = $('description').value.length; });

  // Tải danh mục (+ dữ liệu video khi sửa)
  async function boot() {
    form.classList.add('hidden');
    showSkeleton($('state'), 4, 48);
    try {
      const [cats, video] = await Promise.all([api.listCategories(), editId ? api.getVideo(editId) : null]);
      cats.forEach(c => $('category').appendChild(el('option', { value: c.id, text: c.name })));
      if (video) {
        existing = video;
        $('title').value = video.title || '';
        $('description').value = video.description || '';
        $('category').value = video.category_id ?? '';
        $('status').value = video.status;
        $('desc-count').textContent = $('description').value.length;
        $('video-label').textContent = 'File video (chọn để thay thế)';
        if (video.video_url) { $('video-preview').src = video.video_url; $('video-preview').classList.remove('hidden'); }
        if (video.thumbnail_url) { $('thumb-preview').src = video.thumbnail_url; $('thumb-preview').classList.remove('hidden'); }
        $('video-info').textContent = `Hiện tại: ${formatBytes(video.file_size)} · ${formatDuration(video.duration)}`;
      }
      $('state').replaceChildren();
      form.classList.remove('hidden');
    } catch (e) { showState($('state'), { icon: '⚠️', message: e.message, retry: boot }); }
  }

  // Chọn file video: kiểm tra, xem trước, đọc thời lượng
  $('video').addEventListener('change', () => {
    const f = $('video').files[0];
    grabbedThumb = null;
    if (!f) return;
    if (!VIDEO_TYPES.includes(f.type)) { fieldErr($('video'), 'Chỉ chấp nhận file mp4, webm hoặc mov'); $('video').value = ''; return; }
    if (f.size > MAX_VIDEO) { fieldErr($('video'), 'File video tối đa 50MB'); $('video').value = ''; return; }
    fieldErr($('video'), '');
    const u = makeUrl(f);
    $('video-preview').src = u; $('video-preview').classList.remove('hidden');
    duration = null;
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      duration = Math.round(probe.duration) || 0;
      $('video-info').textContent = `${f.name} · ${formatBytes(f.size)} · ${formatDuration(duration)}`;
    };
    probe.onerror = () => { $('video-info').textContent = `${f.name} · ${formatBytes(f.size)}`; };
    probe.src = u;
  });

  $('thumb').addEventListener('change', () => {
    const f = $('thumb').files[0];
    if (!f) return;
    if (!THUMB_TYPES.includes(f.type)) { fieldErr($('thumb'), 'Chỉ chấp nhận ảnh jpg, png hoặc webp'); $('thumb').value = ''; return; }
    if (f.size > MAX_THUMB) { fieldErr($('thumb'), 'Ảnh tối đa 5MB'); $('thumb').value = ''; return; }
    fieldErr($('thumb'), '');
    grabbedThumb = null;
    $('thumb-preview').src = makeUrl(f); $('thumb-preview').classList.remove('hidden');
  });

  // Lấy khung hình giây thứ 1 làm thumbnail
  $('grab').addEventListener('click', () => {
    const v = $('video-preview');
    if (v.classList.contains('hidden') || !v.src) { toast('Hãy chọn video trước', 'warning'); return; }
    const capture = () => {
      try {
        const c = document.createElement('canvas');
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext('2d').drawImage(v, 0, 0);
        c.toBlob(b => {
          if (!b) { toast('Không lấy được ảnh từ video', 'error'); return; }
          grabbedThumb = new File([b], 'thumbnail.jpg', { type: 'image/jpeg' });
          $('thumb').value = '';
          $('thumb-preview').src = makeUrl(grabbedThumb); $('thumb-preview').classList.remove('hidden');
          dirty = true;
        }, 'image/jpeg', 0.85);
      } catch { toast('Không lấy được ảnh từ video này', 'error'); }
    };
    v.pause();
    v.onseeked = () => { v.onseeked = null; capture(); };
    v.currentTime = Math.min(1, (v.duration || 1) / 2);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = $('title').value.trim();
    const videoFile = $('video').files[0];
    let ok = fieldErr($('title'), title && title.length <= 200 ? '' : 'Vui lòng nhập tiêu đề (tối đa 200 ký tự)');
    ok = fieldErr($('description'), $('description').value.length <= 2000 ? '' : 'Mô tả tối đa 2000 ký tự') && ok;
    ok = fieldErr($('video'), editId || videoFile ? '' : 'Vui lòng chọn file video') && ok;
    if (!ok) return;

    const thumbFile = $('thumb').files[0] || grabbedThumb;
    const btn = $('save');
    setLoading(btn, true); saving = true;
    form.querySelectorAll('input,select,textarea,button').forEach(x => { if (x !== btn) x.disabled = true; });
    $('uploading').classList.remove('hidden');
    const uploaded = []; // [bucket, path] để dọn nếu lỗi

    try {
      const data = {
        title, description: $('description').value.trim(),
        category_id: $('category').value || null, status: $('status').value,
      };
      if (videoFile) {
        const up = await uploadFile('videos', videoFile); uploaded.push(['videos', up.path]);
        Object.assign(data, { video_path: up.path, video_url: up.url, file_size: up.size, duration: duration ?? 0 });
      }
      if (thumbFile) {
        const up = await uploadFile('thumbnails', thumbFile); uploaded.push(['thumbnails', up.path]);
        Object.assign(data, { thumbnail_path: up.path, thumbnail_url: up.url, thumbnail_size: up.size });
      }
      if (editId) await api.updateVideo(editId, data); else await api.createVideo(data);

      // Sửa + thay file: lưu DB thành công mới xóa file cũ
      if (existing) {
        if (videoFile) await removeFile('videos', existing.video_path);
        if (thumbFile) await removeFile('thumbnails', existing.thumbnail_path);
      }
      dirty = false;
      toast(editId ? 'Đã cập nhật video' : 'Đã thêm video', 'success');
      setTimeout(() => location.href = 'videos.html', 600);
    } catch (err) {
      await Promise.all(uploaded.map(([b, p]) => removeFile(b, p))); // tránh file rác
      toast(err.message, 'error');
      saving = false;
      form.querySelectorAll('input,select,textarea,button').forEach(x => { x.disabled = false; });
      setLoading(btn, false);
      $('uploading').classList.add('hidden');
    }
  });

  boot();
}
