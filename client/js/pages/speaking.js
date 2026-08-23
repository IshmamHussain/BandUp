import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

const user = await initShell({ active: 'speaking', title: 'Speaking' });

const el = (id) => document.getElementById(id);

// --- Tabs (3-tab system: Practice / History / Progress) ---
const tabPractice = el('tab-practice');
const tabHistory = el('tab-history');
const tabProgress = el('tab-progress');
const ACTIVE = 'px-4 py-2 bg-brand-600 text-white';
const INACTIVE = 'px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition';

function switchTab(tab) {
  const tabs = { practice: tabPractice, history: tabHistory, progress: tabProgress };
  const sections = { practice: 'practice-section', history: 'history-section', progress: 'progress-section' };
  
  for (const [key, btn] of Object.entries(tabs)) {
    btn.className = key === tab ? ACTIVE : INACTIVE;
    btn.setAttribute('aria-selected', key === tab ? 'true' : 'false');
    el(sections[key]).classList.toggle('hidden', key !== tab);
  }
  
  if (tab === 'history') loadHistory();
  if (tab === 'progress') loadProgress();
}

tabPractice.addEventListener('click', () => switchTab('practice'));
tabHistory.addEventListener('click', () => switchTab('history'));
tabProgress.addEventListener('click', () => switchTab('progress'));

// Auto-switch based on URL param
const urlTab = new URLSearchParams(window.location.search).get('tab');
if (urlTab === 'history' || urlTab === 'progress') {
  switchTab(urlTab);
}

// --- Load Stats Banner ---
async function loadStats() {
  try {
    const stats = await api.speakingStats();
    el('stat-total').textContent = stats.total_tests ?? 0;
    el('stat-avg').textContent = stats.avg_band ? Number(stats.avg_band).toFixed(1) : '—';
    el('stat-best').textContent = stats.best_band ? Number(stats.best_band).toFixed(1) : '—';
  } catch {
    el('stat-total').textContent = '0';
    el('stat-avg').textContent = '—';
    el('stat-best').textContent = '—';
  }
}
loadStats();

// --- Load Prompts ---
const CATEGORY_ICONS = {
  'General': '💬', 'Technology': '💻', 'Education': '📚', 'Environment': '🌍',
  'Health': '🏥', 'Travel': '✈️', 'Culture': '🎭', 'Work': '💼',
  'Media': '📺', 'Society': '👥', 'Sports': '⚽', 'Science': '🔬',
};

async function loadPrompts() {
  try {
    const tests = await api.speakingPrompts(); // Actually tests now
    const grid = el('topics-grid');
    grid.innerHTML = '';
    
    tests.forEach((test, index) => {
      const category = test.category || 'General';
      const icon = CATEGORY_ICONS[category] || '🎯';
      const card = document.createElement('div');
      card.className = 'card topic-card p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 group cursor-pointer flex flex-col h-full stagger-card';
      card.style.animationDelay = `${index * 60}ms`;
      card.innerHTML = `
        <div class="mb-3 flex items-center gap-2">
          <span class="text-lg">${icon}</span>
          <span class="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">${category}</span>
          <span class="inline-block px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded text-xs font-medium uppercase ml-auto">FULL TEST</span>
        </div>
        <h4 class="font-semibold text-slate-900 dark:text-white mb-2">${test.title}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">Contains Part 1, Part 2, and Part 3</p>
        <button class="w-full py-2.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-600 group-hover:text-white dark:group-hover:bg-brand-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors mt-auto flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          Start Full Test
        </button>
      `;
      card.addEventListener('click', () => {
        window.location.href = `speaking-test.html?testId=${test.id}`;
      });
      grid.appendChild(card);
    });
  } catch (err) {
    toast(err.message, 'error');
  }
}

loadPrompts();

// --- History ---
let historyLoading = false;
async function loadHistory(skipOpen = false) {
  if (historyLoading) return;
  historyLoading = true;
  try {
    const history = await api.speakingHistory();
    const listEl = el('history-list');
    listEl.innerHTML = '';

    if (history.length === 0) {
      el('history-empty').classList.remove('hidden');
      el('history-detail').classList.add('hidden');
      return;
    }

    el('history-empty').classList.add('hidden');
    
    history.forEach((sub, index) => {
      const row = document.createElement('button');
      row.className = 'w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 bg-white dark:bg-slate-900 stagger-card';
      row.style.animationDelay = `${index * 50}ms`;
      row.innerHTML = `
        <span class="flex items-center justify-center w-11 h-11 rounded-full font-bold text-sm shrink-0 ${sub.status === 'evaluated' ? 'bg-gradient-to-br from-brand-100 to-cyan-100 text-brand-700 dark:from-brand-900/40 dark:to-cyan-900/30 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}">
          ${sub.band_overall ? Number(sub.band_overall).toFixed(1) : '...'}
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium truncate">${sub.prompt_text || 'Speaking Test'}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full Test • ${sub.duration_sec}s • ${new Date(sub.created_at).toLocaleDateString()}
          </span>
        </span>
        <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      `;
      row.addEventListener('click', () => openSubmission(sub.id));
      listEl.appendChild(row);
    });
    
    // Open the first one
    if (history.length > 0 && !skipOpen) openSubmission(history[0].id);
    
    historyLoading = false;
  } catch (err) {
    historyLoading = false;
    toast(err.message, 'error');
  }
}

async function retryEvaluation(id) {
  try {
    await api.retrySpeakingEvaluation(id);
    toast('Re-evaluation started', 'success');
    openSubmission(id);
    loadHistory();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteSubmission(id) {
  if (!confirm('Are you sure you want to delete this test?')) return;
  try {
    await api.deleteSpeakingSubmission(id);
    toast('Deleted successfully', 'success');
    el('history-detail').classList.add('hidden');
    loadHistory();
    loadStats();
    if (!el('progress-section').classList.contains('hidden')) {
      loadProgress();
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

let currentViewedSubmissionId = null;

async function openSubmission(id) {
  try {
    currentViewedSubmissionId = id;
    const sub = await api.speakingSubmission(id);
    
    // Only update the view if we are still viewing this submission
    if (currentViewedSubmissionId !== id) return;

    const detail = el('history-detail');
    detail.classList.remove('hidden');
    
    // Only update audio/prompt if it's a new selection to avoid resetting the audio player
    if (detail.querySelector('#history-audio').getAttribute('data-sub-id') !== id.toString()) {
      detail.querySelector('.prompt-text').textContent = sub.prompt_text;
      detail.querySelector('#history-audio').src = sub.audio_url;
      detail.querySelector('#history-audio').setAttribute('data-sub-id', id);
    }
    
    const deleteBtn = detail.querySelector('#btn-delete-history');
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteSubmission(id);
    }
    
    const evalContainer = detail.querySelector('.eval-container');
    
    if (sub.status === 'evaluated' && sub.evaluation_json) {
      evalContainer.innerHTML = '';
      renderSpeakingEvaluation(evalContainer, sub.evaluation_json, id);
    } else {
      // If it's already showing the pending state, don't overwrite to keep the progress bar animation smooth
      if (!evalContainer.querySelector('.eval-pending')) {
        evalContainer.innerHTML = `
          <div class="eval-pending card p-8 border-brand-200 dark:border-brand-900/30 flex flex-col items-center text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-950/20 opacity-50"></div>
            <div class="relative z-10 flex flex-col items-center">
              <div class="w-12 h-12 mb-5 border-[3px] border-brand-100 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin"></div>
              <h3 class="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 mb-2">Analyzing your speech</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">The AI examiner is transcribing your response and evaluating your fluency, vocabulary, and grammar...</p>
              <div class="w-full max-w-xs bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div class="h-full bg-brand-500 rounded-full animate-progress" style="width: 0%"></div>
              </div>
            </div>
          </div>`;
          
        // Start the fake progress bar animation
        setTimeout(() => {
          const bar = evalContainer.querySelector('.animate-progress');
          if (bar) {
            bar.style.transition = 'width 15s cubic-bezier(0.1, 0.7, 0.1, 1)';
            bar.style.width = '95%';
          }
        }, 50);
      }
      
      // Poll again in 3 seconds
      setTimeout(() => {
        if (currentViewedSubmissionId === id) {
          openSubmission(id);
          // Also reload history list to show the updated status icon there
          loadHistory(true); 
        }
      }, 3000);
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderSpeakingEvaluation(container, json, submissionId) {
  if (json.error) {
    container.innerHTML = `<div class="card p-4 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        Failed to evaluate: ${json.error}
      </div>
      <div class="flex gap-2 mt-2">
        <button id="btn-retry-${submissionId}" class="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">Try Again</button>
        <button id="btn-delete-${submissionId}" class="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition">Delete</button>
      </div>
    </div>`;
    
    document.getElementById(`btn-retry-${submissionId}`).addEventListener('click', () => retryEvaluation(submissionId));
    document.getElementById(`btn-delete-${submissionId}`).addEventListener('click', () => deleteSubmission(submissionId));
    return;
  }
  
  const bandPct = Math.round((json.band_overall / 9) * 100);
  
  let html = `
    <div class="card p-6 mb-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-display font-semibold">AI Evaluation</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Estimated Band Score</p>
        </div>
        <div class="band-ring w-18 h-18" style="--band-pct: ${bandPct}%; width: 72px; height: 72px;">
          <div class="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-2xl font-bold font-mono text-brand-700 dark:text-brand-300 shadow-inner">
            ${json.band_overall.toFixed(1)}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
  `;
  
  const criteriaMap = {
    'fluency_and_coherence': { label: 'Fluency & Coherence', icon: '🗣️' },
    'lexical_resource': { label: 'Lexical Resource', icon: '📖' },
    'grammatical_range_accuracy': { label: 'Grammar', icon: '✏️' },
    'pronunciation': { label: 'Pronunciation', icon: '🔊' }
  };

  if (json.criteria) {
    for (const [key, details] of Object.entries(json.criteria)) {
      const meta = criteriaMap[key] || { label: key, icon: '📊' };
      const pct = Math.round((details.band / 9) * 100);
      html += `
        <div class="criteria-card bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>${meta.icon}</span>
              ${meta.label}
            </span>
            <span class="text-sm font-bold font-mono text-brand-700 dark:text-brand-300">${details.band.toFixed(1)}</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-2 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-500 transition-all duration-700" style="width: ${pct}%"></div>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${details.comment}</p>
        </div>
      `;
    }
  }
  
  html += `</div></div>`;

  if (json.transcript) {
    html += `
      <div class="card p-5 mb-4">
        <h4 class="font-semibold mb-2 flex items-center gap-2">
          <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Transcript
        </h4>
        <p class="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">"${json.transcript}"</p>
      </div>
    `;
  }
  
  if (json.pronunciation_issues && json.pronunciation_issues.length > 0) {
    html += `
      <div class="card p-5 mb-4">
        <h4 class="font-semibold mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
          Pronunciation Focus
        </h4>
        <ul class="space-y-2">
          ${json.pronunciation_issues.map(p => `
            <li class="text-sm bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 flex items-start gap-2">
              <span class="font-semibold text-orange-700 dark:text-orange-400 shrink-0">${p.word}</span>
              <span class="text-slate-600 dark:text-slate-400">${p.issue}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

// --- Progress Tab ---
let progressLoading = false;
let trendChart = null;
let radarChart = null;

async function loadProgress() {
  if (progressLoading) return;
  progressLoading = true;
  try {
    const stats = await api.speakingStats();
    
    if (!stats.history || stats.history.length === 0) {
      el('progress-empty').classList.remove('hidden');
      el('chart-band-trend').parentElement.parentElement.classList.add('hidden');
      el('chart-criteria-radar').parentElement.parentElement.classList.add('hidden');
      progressLoading = false;
      return;
    }

    el('progress-empty').classList.add('hidden');
    el('chart-band-trend').parentElement.parentElement.classList.remove('hidden');
    el('chart-criteria-radar').parentElement.parentElement.classList.remove('hidden');

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Band Score Trend
    const labels = stats.history.map((h, i) => `Test ${i + 1}`);
    const bands = stats.history.map(h => h.band_overall);

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(el('chart-band-trend'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Band Score',
          data: bands,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0d9488',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 9, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
          x: { ticks: { color: textColor }, grid: { display: false } },
        }
      }
    });

    // Criteria Radar
    if (stats.avg_criteria) {
      const criteriaLabels = ['Fluency & Coherence', 'Lexical Resource', 'Grammar', 'Pronunciation'];
      const criteriaKeys = ['fluency_and_coherence', 'lexical_resource', 'grammatical_range_accuracy', 'pronunciation'];
      const criteriaData = criteriaKeys.map(k => stats.avg_criteria[k] ?? 0);

      if (radarChart) radarChart.destroy();
      radarChart = new Chart(el('chart-criteria-radar'), {
        type: 'radar',
        data: {
          labels: criteriaLabels,
          datasets: [{
            label: 'Average Score',
            data: criteriaData,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13,148,136,0.15)',
            borderWidth: 2,
            pointBackgroundColor: '#0d9488',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0, max: 9,
              ticks: { stepSize: 1, display: false },
              grid: { color: gridColor },
              pointLabels: { color: textColor, font: { size: 11, weight: 500 } },
              angleLines: { color: gridColor },
            }
          }
        }
      });
    } else {
      el('chart-criteria-radar').parentElement.parentElement.classList.add('hidden');
    }

    progressLoading = false;
  } catch (err) {
    progressLoading = false;
    toast(err.message, 'error');
  }
}
