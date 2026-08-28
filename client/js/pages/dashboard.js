// Dashboard page logic.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { renderGauge } from '../gauge.js';

const user = await initShell({ active: 'dashboard', title: 'Dashboard' });

const el = (id) => document.getElementById(id);

// ---------- Load everything with one API call ----------
let data;
try {
  data = await api.dashboard();
} catch (err) {
  toast(err.message, 'error');
  throw err;
}

// ---------- Greeting ----------
const hour = new Date().getHours();
const timeOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
const greeting = el('greeting');
greeting.classList.remove('skeleton');
greeting.textContent = `${timeOfDay}, ${data.user.name.split(' ')[0]}`;

// ---------- Stat cards ----------
renderGauge(el('gauge'), {
  value: Number(data.user.currentBandEstimate) || 0,
  target: Number(data.user.targetBand) || null,
  label: 'Current band',
  size: 180,
});
el('gauge').classList.remove('skeleton');

el('stat-streak').innerHTML = `${data.user.studyStreak}<span class="text-base font-body font-medium text-slate-400"> day${data.user.studyStreak === 1 ? '' : 's'}</span>`;

if (data.user.examCountdownDays !== null) {
  el('stat-countdown').innerHTML = `${data.user.examCountdownDays}<span class="text-base font-body font-medium text-slate-400"> days</span>`;
  el('stat-countdown-sub').textContent = `Exam on ${new Date(data.user.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
} else {
  el('stat-countdown').textContent = '—';
}

const weekTotal = data.weeklyStudy.reduce((sum, day) => sum + day.minutes, 0);
el('stat-week').innerHTML = `${weekTotal}<span class="text-base font-body font-medium text-slate-400"> min</span>`;

// ---------- Charts ----------
const isDark = document.documentElement.classList.contains('dark');
const gridColor = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)';
const textColor = isDark ? '#94a3b8' : '#64748b';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';

new Chart(el('chart-week'), {
  type: 'bar',
  data: {
    labels: data.weeklyStudy.map((d) =>
      new Date(d.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' })),
    datasets: [{
      data: data.weeklyStudy.map((d) => d.minutes),
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, '#14b8a6');
        gradient.addColorStop(1, '#0891b2');
        return gradient;
      },
      borderRadius: 8,
      maxBarThickness: 42,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (item) => ` ${item.raw} minutes` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor } },
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, precision: 0 } },
    },
  },
});

const modules = data.moduleAccuracy.filter((m) => m.attempted > 0);
if (modules.length === 0) {
  el('chart-modules').classList.add('hidden');
  el('modules-empty').classList.remove('hidden');
} else {
  const palette = { reading: '#0d9488', vocabulary: '#06b6d4', writing: '#f59e0b', listening: '#6366f1', grammar: '#ec4899', speaking: '#8b5cf6' };
  new Chart(el('chart-modules'), {
    type: 'doughnut',
    data: {
      labels: modules.map((m) => m.module[0].toUpperCase() + m.module.slice(1)),
      datasets: [{
        data: modules.map((m) => Number(m.accuracy) || 0),
        backgroundColor: modules.map((m) => palette[m.module] || '#64748b'),
        borderWidth: 0,
        spacing: 3,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, boxWidth: 8 } },
        tooltip: { callbacks: { label: (item) => ` ${item.label}: ${item.raw}% accuracy` } },
      },
    },
  });
}

// ---------- Recent activity ----------
const activityList = el('activity-list');
if (data.recentActivity.length === 0) {
  activityList.innerHTML = `
    <div class="p-6 text-center">
      <p class="text-sm font-medium">No activity yet</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Start a reading passage — it takes 15 minutes.</p>
      <a href="/pages/reading.html" class="inline-block mt-3 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition">Start reading practice</a>
    </div>`;
} else {
  const icons = {
    reading: { bg: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400', path: '<path d="M12 6.5C10 4.8 7.5 4 4 4v14c3.5 0 6 .8 8 2.5 2-1.7 4.5-2.5 8-2.5V4c-3.5 0-6 .8-8 2.5z"/>' },
    writing: { bg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', path: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>' },
    speaking: { bg: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', path: '<path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>' },
  };
  activityList.innerHTML = data.recentActivity.map((item) => {
    const icon = icons[item.type] || icons.reading;
    const when = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `
      <div class="p-3.5 flex items-center gap-3">
        <span class="grid place-items-center w-8 h-8 rounded-lg shrink-0 ${icon.bg}">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icon.path}</svg>
        </span>
        <p class="text-sm font-medium truncate flex-1"></p>
        <span class="text-xs text-slate-400 shrink-0">${when}</span>
      </div>`;
  }).join('');
  // textContent for labels (data from DB, but defence in depth against XSS)
  activityList.querySelectorAll('p.truncate').forEach((p, i) => {
    p.textContent = data.recentActivity[i].label;
  });
}

// ---------- Goals modal ----------
const modal = el('goals-modal');
const bandSelect = el('target-band');
for (let band = 5; band <= 9; band += 0.5) {
  const option = document.createElement('option');
  option.value = band.toFixed(1);
  option.textContent = `Band ${band.toFixed(1)}`;
  bandSelect.appendChild(option);
}
if (data.user.targetBand) bandSelect.value = Number(data.user.targetBand).toFixed(1);
if (data.user.examDate) el('exam-date').value = String(data.user.examDate).slice(0, 10);
el('exam-date').min = new Date().toISOString().slice(0, 10);

el('goals-btn').addEventListener('click', () => modal.classList.remove('hidden'));
el('goals-cancel').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.classList.add('hidden');
});

el('goals-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api.updateGoals({
      targetBand: Number(bandSelect.value),
      examDate: el('exam-date').value || null,
    });
    toast('Goals saved. Aim high!', 'success');
    modal.classList.add('hidden');
    setTimeout(() => window.location.reload(), 700);
  } catch (err) {
    toast(err.message, 'error');
  }
});
