// Listening tests list.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

await initShell({ active: 'listening', title: 'Listening' });

const listEl = document.getElementById('passage-list');

const DIFFICULTY_STYLES = {
  easy: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  hard: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

function testCard(test) {
  const card = document.createElement('article');
  card.className = 'card p-5 flex flex-col';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-display font-semibold leading-snug"></h3>
    </div>
    <div class="flex flex-wrap items-center gap-2 mt-3">
      <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${DIFFICULTY_STYLES[test.difficulty]}">${test.difficulty}</span>
      <span class="text-xs text-slate-500 dark:text-slate-400">${test.question_count} questions · ${test.time_limit} min</span>
    </div>
    <div class="mt-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
      ${test.best_accuracy !== null
        ? `Best score: <span class="font-mono font-bold text-brand-600 dark:text-brand-400">${test.best_accuracy}%</span>`
        : 'Not attempted yet'}
    </div>
    <a href="/pages/listening-test.html?id=${test.id}"
       class="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition
       ${test.best_accuracy !== null
         ? 'border border-brand-500/50 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
         : 'bg-brand-600 hover:bg-brand-700 text-white'}">
      ${test.best_accuracy !== null ? 'Practise again' : 'Start test'}
    </a>`;

  card.querySelector('h3').textContent = test.title;
  return card;
}

try {
  const tests = await api.listeningTests();
  listEl.innerHTML = '';
  tests.forEach((test) => listEl.appendChild(testCard(test)));
} catch (err) {
  listEl.innerHTML = `<div class="card p-6 sm:col-span-2 lg:col-span-3 text-center text-sm text-slate-500">
    Could not load listening tests. Please refresh the page.</div>`;
  toast(err.message, 'error');
}
