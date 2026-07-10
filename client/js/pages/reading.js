// Reading passage list.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

await initShell({ active: 'reading', title: 'Reading' });

const listEl = document.getElementById('passage-list');

const DIFFICULTY_STYLES = {
  easy: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  hard: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

function starIcon(filled) {
  return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}"
    stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
    <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z"/></svg>`;
}

function passageCard(passage) {
  const card = document.createElement('article');
  card.className = 'card p-5 flex flex-col';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-display font-semibold leading-snug"></h3>
      <button class="bookmark-btn shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg transition
        ${passage.bookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}"
        aria-label="${passage.bookmarked ? 'Remove bookmark' : 'Bookmark this passage'}"
        aria-pressed="${Boolean(passage.bookmarked)}">
        ${starIcon(Boolean(passage.bookmarked))}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2 mt-3">
      <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${DIFFICULTY_STYLES[passage.difficulty]}">${passage.difficulty}</span>
      <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${passage.passage_type}</span>
      <span class="text-xs text-slate-500 dark:text-slate-400">${passage.question_count} questions · ${passage.time_limit} min</span>
    </div>
    <div class="mt-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
      ${passage.best_accuracy !== null
        ? `Best score: <span class="font-mono font-bold text-brand-600 dark:text-brand-400">${passage.best_accuracy}%</span>`
        : 'Not attempted yet'}
    </div>
    <a href="/pages/reading-test.html?id=${passage.id}"
       class="mt-auto text-center py-2.5 rounded-xl text-sm font-semibold transition
       ${passage.best_accuracy !== null
         ? 'border border-brand-500/50 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
         : 'bg-brand-600 hover:bg-brand-700 text-white'}">
      ${passage.best_accuracy !== null ? 'Practise again' : 'Start passage'}
    </a>`;

  card.querySelector('h3').textContent = passage.title;

  const bookmarkBtn = card.querySelector('.bookmark-btn');
  bookmarkBtn.addEventListener('click', async () => {
    try {
      const { bookmarked } = await api.togglePassageBookmark(passage.id);
      bookmarkBtn.innerHTML = starIcon(bookmarked);
      bookmarkBtn.className = `bookmark-btn shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg transition ${
        bookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`;
      bookmarkBtn.setAttribute('aria-pressed', bookmarked);
      toast(bookmarked ? 'Passage bookmarked' : 'Bookmark removed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  return card;
}

try {
  const passages = await api.passages();
  listEl.innerHTML = '';
  passages.forEach((passage) => listEl.appendChild(passageCard(passage)));
} catch (err) {
  listEl.innerHTML = `<div class="card p-6 sm:col-span-2 lg:col-span-3 text-center text-sm text-slate-500">
    Could not load passages. Please refresh the page.</div>`;
  toast(err.message, 'error');
}
