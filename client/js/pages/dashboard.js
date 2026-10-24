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
  const actionPlanContainer = el('ai-action-plan-container');
  const actionPlanContent = el('ai-action-plan-content');
  let currentPlanData = null;
  let currentActiveTab = 'all';
  let actionPlanLoading = false;

  const MODULE_CONFIG = {
    reading: { key: 'reading', name: 'Reading', emoji: '📖', url: '/pages/reading.html' },
    listening: { key: 'listening', name: 'Listening', emoji: '🎧', url: '/pages/listening.html' },
    writing: { key: 'writing', name: 'Writing', emoji: '✍️', url: '/pages/writing.html' },
    speaking: { key: 'speaking', name: 'Speaking', emoji: '🗣️', url: '/pages/speaking.html' },
    overall: { key: 'overall', name: 'Overall Strategy', emoji: '🎯', url: null },
  };

  function renderActionPlanCards(plan, activeFilter = 'all') {
    if (!plan) return '';

    const sections = [
      { key: 'overall', title: '🎯 Overall Action Plan', content: plan.overall, mod: MODULE_CONFIG.overall },
      { key: 'reading', title: '📖 Reading', content: plan.reading, mod: MODULE_CONFIG.reading },
      { key: 'listening', title: '🎧 Listening', content: plan.listening, mod: MODULE_CONFIG.listening },
      { key: 'writing', title: '✍️ Writing', content: plan.writing, mod: MODULE_CONFIG.writing },
      { key: 'speaking', title: '🗣️ Speaking', content: plan.speaking, mod: MODULE_CONFIG.speaking },
    ];

    const filtered = activeFilter === 'all' 
      ? sections 
      : sections.filter(s => s.key === activeFilter);

    if (filtered.length === 0) {
      return `<div class="p-6 text-center text-xs text-slate-500 dark:text-slate-400">No action plan items found for this filter.</div>`;
    }

    return filtered.map(sec => {
      const isUnattempted = (sec.content || '').includes('Attempt a test of that module for action plan');

      if (isUnattempted && sec.mod.url) {
        return `
          <div class="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xl">
                ${sec.mod.emoji}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">${sec.title}</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">No test data</span>
                </div>
                <p class="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">Attempt a test of that module for action plan.</p>
              </div>
            </div>
            <a href="${sec.mod.url}" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs whitespace-nowrap">
              Take ${sec.mod.name} Test
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
        `;
      }

      return `
        <div class="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2.5">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-2.5">
            <div class="flex items-center gap-2.5">
              <span class="text-lg">${sec.mod.emoji}</span>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">${sec.title}</h4>
            </div>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${sec.key === 'overall' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40'}">
              ${sec.key === 'overall' ? 'Strategy' : 'Action Steps'}
            </span>
          </div>
          <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-li:my-1 max-w-none">
            ${marked.parse(sec.content || '')}
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadActionPlan(forceReload = false) {
    if (currentPlanData && !forceReload) {
      actionPlanContent.innerHTML = renderActionPlanCards(currentPlanData, currentActiveTab);
      return;
    }

    if (actionPlanLoading) return;
    actionPlanLoading = true;

    actionPlanContainer.classList.remove('hidden');
    actionPlanContent.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-3">
        <div class="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400 animate-pulse">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          Analyzing performance data and generating action plan...
        </div>
        <div class="space-y-2 animate-pulse">
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    `;

    try {
      const plan = await api.actionPlan(forceReload);
      currentPlanData = plan;
      actionPlanContent.innerHTML = renderActionPlanCards(plan, currentActiveTab);
    } catch (err) {
      console.error('Action plan error:', err);
      actionPlanContent.innerHTML = `
        <div class="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 text-center space-y-2.5">
          <div class="inline-flex p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mb-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold">AI Action Plan is temporarily busy</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">The AI service experienced high demand or a temporary rate limit. Please retry in a few moments.</p>
          <div>
            <button type="button" id="action-plan-retry-btn" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Retry Generating Action Plan
            </button>
          </div>
        </div>
      `;
      document.getElementById('action-plan-retry-btn')?.addEventListener('click', () => loadActionPlan(true));
    } finally {
      actionPlanLoading = false;
    }
  }

  // Bind tab click events
  const tabButtons = document.querySelectorAll('.action-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active', 'bg-brand-600', 'text-white', 'shadow-xs', 'font-semibold');
        b.classList.add('text-slate-600', 'dark:text-slate-400');
      });
      btn.classList.add('active', 'bg-brand-600', 'text-white', 'shadow-xs', 'font-semibold');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');

      currentActiveTab = btn.dataset.tab;
      if (currentPlanData) {
        actionPlanContent.innerHTML = renderActionPlanCards(currentPlanData, currentActiveTab);
      }
    });
  });

  // Refresh button listener
  el('ai-action-plan-refresh')?.addEventListener('click', () => {
    loadActionPlan(true);
  });

  el('breakdown-btn').addEventListener('click', () => {
    el('breakdown-list').innerHTML = breakdownData.map(item => `
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">${item.name}</span>
        <span class="font-display font-extrabold text-xl ${item.band === '-.-' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'} mt-0.5 block">${item.band}</span>
      </div>
    `).join('');
    
    el('breakdown-total').textContent = calculatedOverall;
    breakdownModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Trigger AI Action Plan
    loadActionPlan(false);
  });
  
  const closeBreakdownModal = () => {
    breakdownModal.classList.add('hidden');
    document.body.style.overflow = '';
  };
  
  el('breakdown-close')?.addEventListener('click', closeBreakdownModal);
  el('breakdown-close-top')?.addEventListener('click', closeBreakdownModal);
  breakdownModal.addEventListener('click', (e) => {
    if (e.target === breakdownModal) closeBreakdownModal();
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
