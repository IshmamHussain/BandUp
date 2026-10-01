// Dashboard page logic.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { renderGauge } from '../gauge.js';

const el = (id) => document.getElementById(id);

let user, data;
try {
  [user, data] = await Promise.all([
    initShell({ active: 'dashboard', title: 'Dashboard' }),
    api.dashboard()
  ]);
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

// Hide the redundant topbar streak counter since the dashboard has a giant one
const topbarStreak = document.getElementById('streak-chip');
if (topbarStreak) topbarStreak.classList.add('!hidden');

// ---------- Stat cards ----------
renderGauge(el('gauge'), {
  value: Number(data.user.currentBandEstimate) || 0,
  target: Number(data.user.targetBand) || null,
  label: 'Current band',
  size: 180,
  color: '#06b6d4' // Cyan color matching the theme
});
el('gauge').classList.remove('skeleton');

// Populate Module Accuracies
let overallSum = 0;
let attemptedModules = 0;
const breakdownData = [];

el('stat-streak').innerHTML = `${data.user.studyStreak}<span class="text-xl font-medium text-slate-400 ml-1">Days</span>`;
const weekTotal = data.weeklyStudy.reduce((sum, day) => sum + day.minutes, 0);
el('stat-week').innerHTML = `${weekTotal} min studied`;

const moduleAccCards = document.querySelectorAll('.module-acc');
moduleAccCards.forEach(card => {
  const modName = card.dataset.module;
  const modData = data.moduleAccuracy.find(m => m.module === modName);
  let estimatedBand = '-.-';
  
  if (modData && modData.attempted > 0) {
    const accuracy = Number(modData.accuracy);
    let bandNum = (accuracy / 100) * 9;
    bandNum = Math.max(4, Math.round(bandNum * 2) / 2);
    estimatedBand = bandNum.toFixed(1);
    
    card.textContent = estimatedBand;
    const bar = card.nextElementSibling.firstElementChild;
    if (bar) bar.style.width = `${accuracy}%`;
    
    overallSum += bandNum;
    attemptedModules++;
  } else {
    card.textContent = '-.-';
    const bar = card.nextElementSibling.firstElementChild;
    if (bar) bar.style.width = `0%`;
  }
  
  breakdownData.push({ 
    name: modName.charAt(0).toUpperCase() + modName.slice(1), 
    band: estimatedBand 
  });
});

const calculatedOverall = attemptedModules > 0 ? (Math.round((overallSum / attemptedModules) * 2) / 2).toFixed(1) : '-.-';

const breakdownModal = el('breakdown-modal');
if (el('breakdown-btn') && breakdownModal) {
  el('breakdown-btn').addEventListener('click', () => {
    el('breakdown-list').innerHTML = breakdownData.map(item => `
      <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <span class="text-slate-600 dark:text-slate-400 font-medium">${item.name}</span>
        <span class="font-display font-bold text-slate-900 dark:text-white">${item.band}</span>
      </div>
    `).join('');
    
    el('breakdown-total').textContent = calculatedOverall;
    breakdownModal.classList.remove('hidden');
  });
  
  el('breakdown-close').addEventListener('click', () => breakdownModal.classList.add('hidden'));
  breakdownModal.addEventListener('click', (e) => {
    if (e.target === breakdownModal) breakdownModal.classList.add('hidden');
  });
}

// ---------- Charts ----------
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.color = '#94a3b8';

new Chart(el('chart-week'), {
  type: 'line',
  data: {
    labels: data.weeklyStudy.map((d) =>
      new Date(d.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' })),
    datasets: [{
      label: 'Study Minutes',
      data: data.weeklyStudy.map((d) => d.minutes),
      borderColor: '#06b6d4', // Cyan
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)'); // Cyan 500
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)'); // Purple 500
        return gradient;
      },
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#0f172a',
      pointBorderColor: '#06b6d4',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (item) => ` ${item.raw} minutes` } 
      },
    },
    scales: {
      x: { grid: { display: false, drawBorder: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false }, ticks: { precision: 0 } },
    },
  },
});

// ---------- Recent activity ----------
const activityList = el('activity-list');
if (data.recentActivity.length === 0) {
  activityList.innerHTML = `
    <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
      <svg class="w-12 h-12 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      <p class="text-sm font-medium">No activity yet</p>
      <p class="text-xs mt-1">Complete your first test to see it here.</p>
    </div>`;
} else {
  const icons = {
    reading: { bg: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400', path: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>' },
    writing: { bg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', path: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>' },
    speaking: { bg: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400', path: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>' },
    listening: { bg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400', path: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1v-5h3v3zM3 19a2 2 0 002 2h1v-5H3v3z"/>' },
  };
  activityList.innerHTML = data.recentActivity.map((item) => {
    const icon = icons[item.type] || icons.reading;
    const when = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
    return `
      <div class="flex items-center gap-4 group hover:bg-slate-100 dark:hover:bg-slate-800/30 p-2 rounded-xl transition">
        <span class="grid place-items-center w-10 h-10 rounded-xl shrink-0 ${icon.bg}">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">${icon.path}</svg>
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate text-slate-800 dark:text-slate-200">${item.label}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Test</p>
        </div>
        <span class="text-xs text-slate-600 dark:text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">${when}</span>
      </div>`;
  }).join('');
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
