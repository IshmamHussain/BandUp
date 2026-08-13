// Writing module: essay editor, AI evaluation display, submission history, progress charts.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { renderGauge } from '../gauge.js';

const user = await initShell({ active: 'writing', title: 'Writing' });

const el = (id) => document.getElementById(id);
let TARGET_WORDS = 250;
const CACHE_KEY = `ielts_saved_essays_${user.id}`;
let savedEssays = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); // Cache to store text when switching tasks

// ---------- Prompts ----------
let prompts = [];
try {
  prompts = await api.writingPrompts();
} catch (err) {
  toast(err.message, 'error');
}

const tests = [...new Set(prompts.map((p) => p.category || 'General'))];
const testSelect = el('test-select');
tests.forEach((test) => {
  const option = document.createElement('option');
  option.value = test;
  option.textContent = test;
  testSelect.appendChild(option);
});

let currentTask1 = null;
let currentTask2 = null;
let promptChartT1 = null;
let promptChartT2 = null;

function populateTest() {
  const selectedTest = testSelect.value;
  const testPrompts = prompts.filter((p) => (p.category || 'General') === selectedTest);
  
  currentTask1 = testPrompts.find(p => p.task_type === 'task1');
  currentTask2 = testPrompts.find(p => p.task_type === 'task2');

  setupTask('t1', currentTask1, 150);
  setupTask('t2', currentTask2, 250);
}

function setupTask(prefix, prompt, targetWords) {
  if (!prompt) return;

  el(`prompt-text-${prefix}`).textContent = prompt.prompt_text || '';

  // Chart setup
  const chartContainer = el(`prompt-chart-container-${prefix}`);
  let chartInstance = prefix === 't1' ? promptChartT1 : promptChartT2;
  
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (prompt.chart_data) {
    chartContainer.classList.remove('hidden');
    const config = JSON.parse(JSON.stringify(prompt.chart_data)); // deep clone
    
    const resolveCallbacks = (obj) => {
      if (!obj) return;
      if (obj.ticks?.callback === 'PERCENT') obj.ticks.callback = (v) => v + '%';
      if (obj.ticks?.callback === 'LITRES') obj.ticks.callback = (v) => v + 'L';
    };
    
    resolveCallbacks(config.options?.scales?.y);
    resolveCallbacks(config.options?.scales?.x);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)';
    
    if (config.options?.scales) {
      Object.values(config.options.scales).forEach((scale) => {
        if (scale.ticks) scale.ticks.color = textColor;
        if (scale.grid) scale.grid.color = gridColor;
        if (scale.angleLines) scale.angleLines.color = gridColor;
        if (scale.pointLabels) scale.pointLabels.color = textColor;
      });
    }

    const newChart = new Chart(el(`prompt-chart-${prefix}`), config);
    if (prefix === 't1') promptChartT1 = newChart;
    else promptChartT2 = newChart;
  } else {
    chartContainer.classList.add('hidden');
  }

  // Restore essay box text and reset counters
  const savedText = savedEssays[prompt.id] || '';
  el(`essay-${prefix}`).value = savedText;
  
  const count = savedText.trim() ? savedText.trim().split(/\s+/).length : 0;
  el(`word-count-${prefix}`).textContent = count;
  el(`word-progress-${prefix}`).style.width = `${Math.min(100, (100 * count) / targetWords)}%`;
  el(`elapsed-${prefix}`).textContent = '00:00';
  
  // Hide evaluation panel if open
  el(`evaluation-${prefix}`).classList.add('hidden');
}

testSelect.addEventListener('change', populateTest);
if (tests.length) populateTest();

// ---------- Editor logic ----------
function bindEditor(prefix, targetWords) {
  const essayEl = el(`essay-${prefix}`);
  let timerStarted = false;
  let seconds = 0;

  essayEl.addEventListener('input', () => {
    const text = essayEl.value;
    const prompt = prefix === 't1' ? currentTask1 : currentTask2;
    if (prompt) {
      savedEssays[prompt.id] = text;
      localStorage.setItem(CACHE_KEY, JSON.stringify(savedEssays));
    }

    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    el(`word-count-${prefix}`).textContent = count;
    el(`word-progress-${prefix}`).style.width = `${Math.min(100, (100 * count) / targetWords)}%`;

    if (!timerStarted && count > 0) {
      timerStarted = true;
      setInterval(() => {
        seconds++;
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        el(`elapsed-${prefix}`).textContent = `${mm}:${ss}`;
      }, 1000);
    }
  });

}

async function evaluateTask(prefix, prompt, text) {
  if (!prompt || !text || text.length < 20) return;

  el(`evaluating-${prefix}`).classList.remove('hidden');
  el(`evaluation-${prefix}`).classList.add('hidden');
  el(`evaluation-${prefix}`).innerHTML = '';
  
  try {
    const result = await api.submitEssay({
      promptId: prompt.id,
      taskType: prompt.task_type,
      essayText: text,
    });

    renderEvaluation(el(`evaluation-${prefix}`), result.evaluation, {
      isMock: result.isMock,
      wordCount: text.split(/\s+/).length,
      hideOverall: true
    });
    
    el(`evaluating-${prefix}`).classList.add('hidden');
    el(`evaluation-${prefix}`).classList.remove('hidden');
    progressLoaded = false;
    
    return result.evaluation.band_overall;
  } catch (err) {
    el(`evaluating-${prefix}`).classList.add('hidden');
    toast(err.message, 'error');
    throw err;
  }
}

el('submit-btn-both').addEventListener('click', async () => {
  const textT1 = el('essay-t1').value.trim();
  const textT2 = el('essay-t2').value.trim();

  if (textT1.length < 20 && textT2.length < 20) {
    toast('Please write at least 20 characters in one of the tasks before evaluating.', 'info');
    return;
  }

  const submitBtn = el('submit-btn-both');
  submitBtn.disabled = true;

  try {
    let scoreT1 = null;
    let scoreT2 = null;

    if (textT1.length >= 20 && currentTask1) {
      el(`evaluating-t1`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      scoreT1 = await evaluateTask('t1', currentTask1, textT1);
    }
    
    if (textT2.length >= 20 && currentTask2) {
      el(`evaluating-t2`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      scoreT2 = await evaluateTask('t2', currentTask2, textT2);
    }
    
    if (scoreT1 !== null && scoreT2 !== null) {
      // Calculate overall test score: Task 2 is worth twice as much as Task 1
      const rawScore = (scoreT1 + (scoreT2 * 2)) / 3;
      const finalScore = Math.round(rawScore * 2) / 2; // round to nearest 0.5
      
      const overallEl = el('overall-test-score');
      overallEl.innerHTML = `
        <h2 class="font-display font-extrabold text-4xl sm:text-5xl mb-3">${finalScore.toFixed(1)}</h2>
        <p class="text-indigo-100 font-medium text-lg uppercase tracking-wider">Overall Writing Band Score</p>
        <p class="text-indigo-200 text-sm mt-3">Calculated from Task 1 (${scoreT1.toFixed(1)}) and Task 2 (${scoreT2.toFixed(1)})</p>
      `;
      overallEl.classList.remove('hidden');
      overallEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      el('overall-test-score').classList.add('hidden');
    }
    
    toast('Evaluation complete for submitted tasks!', 'success');
  } catch (e) {
    console.error(e);
  } finally {
    submitBtn.disabled = false;
  }
});

bindEditor('t1', 150);
bindEditor('t2', 250);

// ---------- Evaluation renderer (shared by write + history views) ----------
const CRITERIA_LABELS = {
  task_achievement: 'Task Achievement',
  coherence_cohesion: 'Coherence & Cohesion',
  lexical_resource: 'Lexical Resource',
  grammatical_range_accuracy: 'Grammar Range & Accuracy',
};

function criterionBar(key, criterion) {
  const percent = (100 * criterion.band) / 9;
  return `
    <div>
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="font-medium">${CRITERIA_LABELS[key] || key}</span>
        <span class="font-mono font-bold text-brand-600 dark:text-brand-400">${Number(criterion.band).toFixed(1)}</span>
      </div>
      <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-500" style="width:${percent}%"></div>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 criterion-comment"></p>
    </div>`;
}

function renderEvaluation(container, evaluation, { isMock = false, wordCount = null, hideOverall = false } = {}) {
  container.innerHTML = `
    ${isMock ? `<div class="p-3.5 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
      Development mode: this is a placeholder evaluation. Add an AI API key on the server for real grading.</div>` : ''}

    <div class="card p-6 grid ${hideOverall ? 'grid-cols-1' : 'sm:grid-cols-2'} gap-6 items-center mb-4">
      ${!hideOverall ? `<div class="grid place-items-center"><div class="eval-gauge"></div></div>` : ''}
      <div class="space-y-4 eval-criteria"></div>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 mb-4">
      <div class="card p-5">
        <h4 class="font-display font-semibold text-emerald-600 dark:text-emerald-400 mb-2.5">What worked</h4>
        <ul class="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside strengths"></ul>
      </div>
      <div class="card p-5">
        <h4 class="font-display font-semibold text-amber-600 dark:text-amber-400 mb-2.5">Focus next on</h4>
        <ul class="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside improvements"></ul>
      </div>
    </div>

    <div class="card p-5 mb-4 grammar-card hidden">
      <h4 class="font-display font-semibold mb-3">Grammar corrections</h4>
      <div class="space-y-3 grammar-list"></div>
    </div>

    <div class="card p-5 mb-4 vocab-card hidden">
      <h4 class="font-display font-semibold mb-3">Stronger word choices</h4>
      <div class="flex flex-wrap gap-2 vocab-list"></div>
    </div>

    <div class="card p-5 sample-card hidden">
      <h4 class="font-display font-semibold mb-2">One paragraph, rewritten at band 8</h4>
      <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic sample-text"></p>
    </div>`;

  // 2. Render Gauge (if not hidden)
  if (!hideOverall) {
    renderGauge(container.querySelector('.eval-gauge'), {
      value: evaluation.band_overall,
      label: wordCount ? `Overall · ${wordCount} words` : 'Overall band',
      size: 190,
    });
  }

  const criteriaEl = container.querySelector('.eval-criteria');
  Object.entries(evaluation.criteria || {}).forEach(([key, criterion]) => {
    criteriaEl.insertAdjacentHTML('beforeend', criterionBar(key, criterion));
    criteriaEl.lastElementChild.querySelector('.criterion-comment').textContent = criterion.comment || '';
  });

  const fillList = (selector, items) => {
    const list = container.querySelector(selector);
    (items || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  };
  fillList('.strengths', evaluation.strengths);
  fillList('.improvements', evaluation.improvements);

  if (evaluation.grammar_mistakes?.length) {
    container.querySelector('.grammar-card').classList.remove('hidden');
    const list = container.querySelector('.grammar-list');
    evaluation.grammar_mistakes.forEach((mistake) => {
      const item = document.createElement('div');
      item.className = 'p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-sm space-y-1';
      item.innerHTML = `
        <p class="line-through text-rose-500/80 original"></p>
        <p class="text-emerald-600 dark:text-emerald-400 font-medium corrected"></p>
        <p class="text-xs text-slate-500 dark:text-slate-400 why"></p>`;
      item.querySelector('.original').textContent = mistake.original;
      item.querySelector('.corrected').textContent = mistake.corrected;
      item.querySelector('.why').textContent = mistake.explanation;
      list.appendChild(item);
    });
  }

  if (evaluation.vocabulary_suggestions?.length) {
    container.querySelector('.vocab-card').classList.remove('hidden');
    const list = container.querySelector('.vocab-list');
    evaluation.vocabulary_suggestions.forEach((suggestion) => {
      const chip = document.createElement('span');
      chip.className = 'px-3 py-1.5 rounded-full text-xs bg-cyan-50 dark:bg-cyan-900/25 text-cyan-800 dark:text-cyan-300';
      chip.textContent = `${suggestion.original} → ${suggestion.better}`;
      chip.title = suggestion.context || '';
      list.appendChild(chip);
    });
  }

  if (evaluation.improved_sample_paragraph) {
    container.querySelector('.sample-card').classList.remove('hidden');
    container.querySelector('.sample-text').textContent = evaluation.improved_sample_paragraph;
  }
}

// ---------- History tab ----------
async function loadHistory() {
  const listEl = el('history-list');
  listEl.innerHTML = `<div class="card p-4"><span class="skeleton block h-5 w-2/3"></span></div>`;
  el('history-detail').classList.add('hidden');

  let submissions;
  try {
    submissions = await api.submissions();
  } catch (err) {
    toast(err.message, 'error');
    return;
  }

  if (submissions.length === 0) {
    listEl.innerHTML = `<div class="card p-8 text-center">
      <p class="font-medium text-sm">No essays yet</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Your submissions and band scores will appear here.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = '';
  submissions.forEach((submission) => {
    const row = document.createElement('button');
    row.className = 'card w-full p-4 flex items-center gap-4 text-left hover:border-brand-400 dark:hover:border-brand-600 transition';
    row.innerHTML = `
      <span class="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 font-mono font-bold text-brand-700 dark:text-brand-300">
        ${submission.band_overall ? Number(submission.band_overall).toFixed(1) : '…'}
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium truncate submission-prompt"></span>
        <span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          ${submission.task_type === 'task1' ? 'Task 1' : 'Task 2'} · ${submission.word_count} words ·
          ${new Date(submission.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </span>
      <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`;
    row.querySelector('.submission-prompt').textContent = submission.prompt_text || 'Free writing';
    row.addEventListener('click', () => openSubmission(submission.id));
    listEl.appendChild(row);
  });
}

async function openSubmission(id) {
  let submission;
  try {
    submission = await api.submission(id);
  } catch (err) {
    toast(err.message, 'error');
    return;
  }
  const detail = el('history-detail');
  detail.classList.remove('hidden');
  detail.innerHTML = `
    <div class="card p-5 mb-4">
      <h4 class="font-display font-semibold mb-2">Your essay</h4>
      <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap essay-text"></p>
    </div>
    <div class="eval-container"></div>`;
  detail.querySelector('.essay-text').textContent = submission.essay_text;
  if (submission.evaluation_json) {
    renderEvaluation(detail.querySelector('.eval-container'), submission.evaluation_json, { wordCount: submission.word_count });
  }
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Progress tab ----------
let progressLoaded = false;
let bandTrendChart = null;
let criteriaRadarChart = null;

async function loadProgress() {
  if (progressLoaded) return;

  let stats;
  try {
    stats = await api.writingStats();
  } catch (err) {
    toast(err.message, 'error');
    return;
  }

  if (stats.totalEssays === 0) {
    el('progress-stats').classList.add('hidden');
    el('chart-band-trend').closest('.card').classList.add('hidden');
    el('chart-criteria-radar').closest('.card').classList.add('hidden');
    el('progress-empty').classList.remove('hidden');
    progressLoaded = true;
    return;
  }

  el('progress-empty').classList.add('hidden');

  // Stats cards
  el('stat-total-essays').textContent = stats.totalEssays;
  el('stat-avg-band').textContent = stats.avgBand?.toFixed(1) || '—';
  el('stat-best-band').textContent = stats.bestBand?.toFixed(1) || '—';

  // Chart theme
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // --- Line chart: band score trend ---
  const trendLabels = stats.timeline.map((d) =>
    new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  );
  const trendData = stats.timeline.map((d) => d.band);

  if (bandTrendChart) bandTrendChart.destroy();
  bandTrendChart = new Chart(el('chart-band-trend'), {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Band score',
        data: trendData,
        borderColor: '#0d9488',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(13,148,136,0.25)');
          gradient.addColorStop(1, 'rgba(13,148,136,0.02)');
          return gradient;
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#0d9488',
        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex;
              const entry = stats.timeline[i];
              if (!entry) return '';
              return `${trendLabels[i]} · ${entry.category}`;
            },
            label: (item) => ` Band ${item.raw} · ${stats.timeline[item.dataIndex]?.wordCount || 0} words`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 0 } },
        y: {
          min: 0, max: 9,
          grid: { color: gridColor },
          ticks: { color: textColor, stepSize: 1 },
        },
      },
    },
  });

  // --- Radar chart: criteria averages ---
  if (stats.criteriaAverages) {
    const radarLabels = [
      'Task Achievement',
      'Coherence & Cohesion',
      'Lexical Resource',
      'Grammar Range & Accuracy',
    ];
    const radarData = [
      stats.criteriaAverages.task_achievement || 0,
      stats.criteriaAverages.coherence_cohesion || 0,
      stats.criteriaAverages.lexical_resource || 0,
      stats.criteriaAverages.grammatical_range_accuracy || 0,
    ];

    if (criteriaRadarChart) criteriaRadarChart.destroy();
    criteriaRadarChart = new Chart(el('chart-criteria-radar'), {
      type: 'radar',
      data: {
        labels: radarLabels,
        datasets: [{
          label: 'Average band',
          data: radarData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.15)',
          borderWidth: 2.5,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0, max: 9,
            ticks: { stepSize: 1, color: textColor, backdropColor: 'transparent' },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: { color: textColor, font: { size: 11, weight: '500' } },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.label}: ${item.raw}`,
            },
          },
        },
      },
    });
  } else {
    el('chart-criteria-radar').closest('.card').classList.add('hidden');
  }

  progressLoaded = true;
}

// ---------- Tabs ----------
const tabWrite = el('tab-write');
const tabHistory = el('tab-history');
const tabProgress = el('tab-progress');
const ACTIVE = 'px-4 py-2 bg-brand-600 text-white';
const INACTIVE = 'px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition';

function switchTab(tab) {
  const isWrite = tab === 'write';
  const isHistory = tab === 'history';
  const isProgress = tab === 'progress';

  el('write-section').classList.toggle('hidden', !isWrite);
  el('history-section').classList.toggle('hidden', !isHistory);
  el('progress-section').classList.toggle('hidden', !isProgress);

  tabWrite.className = isWrite ? ACTIVE : INACTIVE;
  tabHistory.className = isHistory ? ACTIVE : INACTIVE;
  tabProgress.className = isProgress ? ACTIVE : INACTIVE;

  tabWrite.setAttribute('aria-selected', String(isWrite));
  tabHistory.setAttribute('aria-selected', String(isHistory));
  tabProgress.setAttribute('aria-selected', String(isProgress));

  if (isHistory) loadHistory();
  if (isProgress) loadProgress();
}
tabWrite.addEventListener('click', () => switchTab('write'));
tabHistory.addEventListener('click', () => switchTab('history'));
tabProgress.addEventListener('click', () => switchTab('progress'));
