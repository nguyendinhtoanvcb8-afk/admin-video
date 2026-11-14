import { requireAuth } from '../guard.js';
import { renderLayout } from '../layout.js';
import { api } from '../api.js';
import { toast, showSkeleton, showState } from '../ui.js';
import { formatNumber, formatBytes, truncate } from '../utils.js';

const user = await requireAuth();
if (user) init();

function init() {
  renderLayout({ user, active: 'dashboard', title: 'Dashboard' });
  const $ = id => document.getElementById(id);
  let barChart = null, lineChart = null, group = 'day';

  Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#6B7280';
  const gridY = { color: '#F1F5F9' };

  async function loadStats() {
    try {
      const s = await api.stats();
      $('s-videos').textContent = formatNumber(s.total_videos);
      $('s-views').textContent = formatNumber(s.total_views);
      $('s-storage').textContent = formatBytes(s.total_storage_bytes);
    } catch (e) { toast(e.message, 'error'); }
  }

  // Chuẩn bị khu vực biểu đồ: skeleton / rỗng / lỗi / hiện chart
  function area(prefix) {
    const state = $(prefix + '-state'), box = $(prefix + '-box');
    return {
      loading() { box.classList.add('hidden'); showSkeleton(state, 1, 260); },
      empty(msg) { box.classList.add('hidden'); showState(state, { message: msg }); },
      error(msg, retry) { box.classList.add('hidden'); showState(state, { icon: '⚠️', message: msg, retry }); },
      ready() { state.replaceChildren(); box.classList.remove('hidden'); },
    };
  }
  const barArea = area('bar'), lineArea = area('line');

  async function loadBar() {
    barArea.loading();
    try {
      const items = await api.topVideos(10);
      if (!items.length) return barArea.empty('Chưa có video nào');
      barArea.ready();
      barChart?.destroy();
      barChart = new Chart($('bar'), {
        type: 'bar',
        data: { labels: items.map(v => truncate(v.title, 15)),
          datasets: [{ data: items.map(v => v.views), backgroundColor: '#2563EB', borderRadius: 6 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false },
            tooltip: { callbacks: { title: c => items[c[0].dataIndex].title, label: c => formatNumber(c.parsed.y) + ' lượt xem' } } },
          scales: { x: { grid: { display: false } }, y: { grid: gridY, beginAtZero: true, ticks: { callback: v => formatNumber(v) } } },
          onClick: (_, els) => {
            if (!els.length) return;
            const id = items[els[0].index].id;
            location.href = (user.role === 'ADMIN' ? 'video-form.html?id=' : 'video-detail.html?id=') + id;
          },
        },
      });
    } catch (e) { barArea.error(e.message, loadBar); }
  }

  async function loadLine() {
    lineArea.loading();
    try {
      const rows = await api.viewsByPeriod(group);
      if (!rows.length) return lineArea.empty('Chưa có dữ liệu lượt xem');
      lineArea.ready();
      lineChart?.destroy();
      lineChart = new Chart($('line'), {
        type: 'line',
        data: { labels: rows.map(r => r.period),
          datasets: [{ data: rows.map(r => r.views), borderColor: '#2563EB', borderWidth: 2,
            backgroundColor: 'rgba(37,99,235,.08)', fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 5 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => formatNumber(c.parsed.y) + ' lượt xem' } } },
          scales: { x: { grid: { display: false } }, y: { grid: gridY, beginAtZero: true, ticks: { callback: v => formatNumber(v) } } },
        },
      });
    } catch (e) { lineArea.error(e.message, loadLine); }
  }

  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    group = b.dataset.group;
    document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('active', x === b));
    loadLine();
  }));

  const loadAll = () => Promise.all([loadStats(), loadBar(), loadLine()]);
  $('refresh').addEventListener('click', loadAll);
  loadAll();
}
