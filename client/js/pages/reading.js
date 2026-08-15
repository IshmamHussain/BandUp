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

function testCard(test) {
  const card = document.createElement('article');
  card.className = 'card p-5 flex flex-col';
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-display font-semibold leading-snug"></h3>
      <button class="bookmark-btn shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg transition
        ${test.bookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}"
        aria-label="${test.bookmarked ? 'Remove bookmark' : 'Bookmark this test'}"
        aria-pressed="${Boolean(test.bookmarked)}">
        ${starIcon(Boolean(test.bookmarked))}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2 mt-3">
      <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${DIFFICULTY_STYLES[test.difficulty]}">${test.difficulty}</span>
      <span class="text-xs text-slate-500 dark:text-slate-400">${test.question_count} questions / ${test.time_limit} min</span>
    </div>
    <div class="mt-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
      ${test.best_accuracy !== null
        ? `Best score: <span class="font-mono font-bold text-brand-600 dark:text-brand-400">${test.best_accuracy}%</span>`
        : 'Not attempted yet'}
    </div>
    <div class="mt-auto flex gap-2">
      <a href="/pages/reading-test.html?id=${test.id}"
         class="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition
         ${test.best_accuracy !== null
           ? 'border border-brand-500/50 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
           : 'bg-brand-600 hover:bg-brand-700 text-white'}">
        ${test.best_accuracy !== null ? 'Practise again' : 'Start test'}
      </a>
      ${test.best_accuracy !== null ? `
      <button class="delete-btn px-3 rounded-xl border border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition" aria-label="Delete history" title="Delete history">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>` : ''}
    </div>`;

  card.querySelector('h3').textContent = test.title;

  const bookmarkBtn = card.querySelector('.bookmark-btn');
  bookmarkBtn.addEventListener('click', async () => {
    try {
      const { bookmarked } = await api.toggleReadingBookmark(test.id);
      bookmarkBtn.innerHTML = starIcon(bookmarked);
      bookmarkBtn.className = `bookmark-btn shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg transition ${
        bookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`;
      bookmarkBtn.setAttribute('aria-pressed', bookmarked);
      toast(bookmarked ? 'Test bookmarked' : 'Bookmark removed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  const deleteBtn = card.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete your attempts for this test?')) return;
      try {
        await api.deleteReadingAttempts(test.id);
        toast('History deleted successfully', 'success');
        // Rerender the list by just reloading
        window.location.reload();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  return card;
}

try {
  const tests = await api.readingTests();
  listEl.innerHTML = '';
  tests.forEach((test) => listEl.appendChild(testCard(test)));
} catch (err) {
  listEl.innerHTML = `<div class="card p-6 sm:col-span-2 lg:col-span-3 text-center text-sm text-slate-500">
    Could not load tests. Please refresh the page.</div>`;
  toast(err.message, 'error');
}
