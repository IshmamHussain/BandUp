// Vocabulary: flashcard deck + quiz mode.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

const initPromise = initShell({ active: 'vocabulary', title: 'Vocabulary' });

const el = (id) => document.getElementById(id);

// ---------- State ----------
let words = [];
let index = 0;
let activeCategory = null;
let activeBandLevel = null;
let bookmarkedOnly = false;
let categories = [];

// ---------- Filters ----------
async function renderFilters() {
  const filtersEl = el('filters');
  filtersEl.innerHTML = '';

  const makeChip = (label, active, onClick) => {
    const chip = document.createElement('button');
    chip.className = `px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
      active
        ? 'bg-brand-600 text-white'
        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'}`;
    chip.textContent = label;
    chip.addEventListener('click', onClick);
    return chip;
  };

  filtersEl.appendChild(makeChip('All words', !activeCategory && !bookmarkedOnly && !activeBandLevel, () => {
    activeCategory = null; bookmarkedOnly = false; activeBandLevel = null; loadWords();
  }));
  categories.forEach((category) => {
    filtersEl.appendChild(makeChip(`${category.category} (${category.word_count})`, activeCategory === category.category, () => {
      activeCategory = category.category; bookmarkedOnly = false; activeBandLevel = null; loadWords();
    }));
  });

  // Band level filter separator
  const sep = document.createElement('span');
  sep.className = 'w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1';
  filtersEl.appendChild(sep);

  [6, 7, 8, 9].forEach((level) => {
    filtersEl.appendChild(makeChip(`Band ${level}`, activeBandLevel === String(level), () => {
      activeBandLevel = String(level); activeCategory = null; bookmarkedOnly = false; loadWords();
    }));
  });

  filtersEl.appendChild(makeChip('★ Bookmarked', bookmarkedOnly, () => {
    bookmarkedOnly = true; activeCategory = null; activeBandLevel = null; loadWords();
  }));
}

// ---------- Flashcards ----------
const scene = el('flip-scene');
let flipped = false;

function flip(force) {
  flipped = force !== undefined ? force : !flipped;
  scene.classList.toggle('flipped', flipped);
}
el('card-front').addEventListener('click', () => flip());
el('card-back').addEventListener('click', () => flip());
document.addEventListener('keydown', (event) => {
  if (el('cards-section').classList.contains('hidden')) return;
  if (event.key === ' ') { event.preventDefault(); flip(); }
  if (event.key === 'ArrowRight') move(1);
  if (event.key === 'ArrowLeft') move(-1);
});

function starIcon(filled) {
  return `<svg class="w-5 h-5 ${filled ? 'text-amber-500' : 'text-slate-400'}" viewBox="0 0 24 24"
    fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
    <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z"/></svg>`;
}

const STATUS_LABELS = { new: 'new word', learning: 'still learning', mastered: 'mastered' };

function renderCard() {
  const word = words[index];
  if (!word) return;
  flip(false);
  el('word').textContent = word.word;
  el('back-word').textContent = word.word;
  el('meaning').textContent = word.meaning;
  el('example').textContent = word.example_sentence ? `"${word.example_sentence}"` : '';
  el('synonyms').textContent = (!word.synonyms || word.synonyms === '—' || word.synonyms.includes('ÔÇö')) ? 'None' : word.synonyms;
  el('antonyms').textContent = (!word.antonyms || word.antonyms === '—' || word.antonyms.includes('ÔÇö')) ? 'None' : word.antonyms;
  el('bookmark-btn').innerHTML = starIcon(Boolean(Number(word.bookmarked)));
  el('card-position').textContent = `${index + 1} of ${words.length}`;
  el('card-status').textContent = STATUS_LABELS[word.status] || word.status;
}

function move(step) {
  if (words.length === 0) return;
  index = (index + step + words.length) % words.length;
  renderCard();
}
el('prev-btn').addEventListener('click', () => move(-1));
el('next-btn').addEventListener('click', () => move(1));

el('bookmark-btn').addEventListener('click', async () => {
  const word = words[index];
  const oldBookmarked = Boolean(Number(word.bookmarked));
  const newBookmarked = !oldBookmarked;
  
  word.bookmarked = newBookmarked ? 1 : 0;
  el('bookmark-btn').innerHTML = starIcon(newBookmarked);

  try {
    await api.toggleVocabBookmark(word.id);
    toast(newBookmarked ? `"${word.word}" bookmarked` : 'Bookmark removed', 'success');
  } catch (err) {
    word.bookmarked = oldBookmarked ? 1 : 0;
    el('bookmark-btn').innerHTML = starIcon(oldBookmarked);
    toast('Failed to bookmark: ' + err.message, 'error');
  }
});

async function setStatus(status) {
  const word = words[index];
  const oldStatus = word.status;
  
  word.status = status;
  toast(status === 'mastered' ? `"${word.word}" mastered 🎉` : `Keep revising "${word.word}"`, 'success');
  move(1);
  
  try {
    await api.setVocabStatus(word.id, status);
  } catch (err) {
    word.status = oldStatus;
    toast('Failed to update status: ' + err.message, 'error');
  }
}
el('status-learning').addEventListener('click', () => setStatus('learning'));
el('status-mastered').addEventListener('click', () => setStatus('mastered'));

async function loadWords() {
  renderFilters();
  try {
    words = await api.vocabulary({ category: activeCategory, bookmarked: bookmarkedOnly, bandLevel: activeBandLevel });
  } catch (err) {
    toast(err.message, 'error');
    return;
  }
  index = 0;
  const empty = words.length === 0;
  el('flip-scene').classList.toggle('hidden', empty);
  el('cards-empty').classList.toggle('hidden', !empty);
  el('flip-scene').nextElementSibling.classList.toggle('hidden', empty);
  if (!empty) renderCard();
}

// ---------- Quiz mode ----------
const QUIZ_LENGTH = 8;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startQuiz() {
  const pool = shuffle(words).slice(0, QUIZ_LENGTH);
  if (pool.length < 4) {
    el('quiz-body').innerHTML = `<div class="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
      This filter has too few words for a quiz. Choose "All words" and try again.</div>`;
    return;
  }
  let current = 0;
  let score = 0;

  function renderQuestion() {
    const word = pool[current];
    // 3 wrong meanings + the right one
    const wrong = shuffle(allWords.filter((w) => w.id !== word.id)).slice(0, 3).map((w) => w.meaning);
    const options = shuffle([word.meaning, ...wrong]);

    const container = document.createElement('div');
    container.className = 'card p-6 page-enter';
    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Question ${current + 1} of ${pool.length}</p>
        <p class="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">Score ${score}</p>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-1.5">What does this word mean?</p>
      <p class="font-display font-bold text-2xl mb-5 quiz-word"></p>
      <div class="space-y-2 quiz-options"></div>`;
    container.querySelector('.quiz-word').textContent = word.word;

    const optionsEl = container.querySelector('.quiz-options');
    let locked = false;
    options.forEach((meaning) => {
      const btn = document.createElement('button');
      btn.className =
        'w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm ' +
        'hover:border-brand-400 dark:hover:border-brand-600 transition';
      btn.textContent = meaning;
      btn.addEventListener('click', async () => {
        if (locked) return;
        locked = true;
        const correct = meaning === word.meaning;
        btn.classList.add(correct ? 'border-emerald-500' : 'border-rose-500',
                          correct ? 'bg-emerald-50' : 'bg-rose-50',
                          correct ? 'dark:bg-emerald-900/25' : 'dark:bg-rose-900/25');
        if (!correct) {
          // Highlight the right answer too.
          [...optionsEl.children].find((b) => b.textContent === word.meaning)
            ?.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/25');
        }
        if (correct) score++;
        // Quiz results feed back into word status.
        api.setVocabStatus(word.id, correct ? 'mastered' : 'learning').catch(() => {});
        setTimeout(() => {
          current++;
          if (current < pool.length) renderQuestion();
          else renderResult();
        }, 900);
      });
      optionsEl.appendChild(btn);
    });

    el('quiz-body').replaceChildren(container);
  }

  function renderResult() {
    const percent = Math.round((100 * score) / pool.length);
    el('quiz-body').innerHTML = `
      <div class="card p-8 text-center page-enter">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Quiz complete</p>
        <p class="font-mono font-bold text-5xl mt-3 text-gradient">${score}/${pool.length}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
          ${percent >= 75 ? 'Impressive vocabulary range!' : percent >= 50 ? 'Solid - review the misses on the flashcards.' : 'Back to the flashcards - repetition is how these stick.'}
        </p>
        <button id="quiz-again" class="mt-6 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition">Take another quiz</button>
      </div>`;
    document.getElementById('quiz-again').addEventListener('click', startQuiz);
  }

  renderQuestion();
}

// ---------- Mode switching ----------
const modeCards = el('mode-cards');
const modeQuiz = el('mode-quiz');
const ACTIVE = 'px-4 py-2 bg-brand-600 text-white';
const INACTIVE = 'px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition';

let allWords = [];

async function switchMode(quiz) {
  el('cards-section').classList.toggle('hidden', quiz);
  el('quiz-section').classList.toggle('hidden', !quiz);
  modeCards.className = quiz ? INACTIVE : ACTIVE;
  modeQuiz.className = quiz ? ACTIVE : INACTIVE;
  modeCards.setAttribute('aria-selected', String(!quiz));
  modeQuiz.setAttribute('aria-selected', String(quiz));
  if (quiz) {
    if (allWords.length === 0) {
      try {
        allWords = await api.vocabulary();
      } catch (err) {
        toast('Failed to load quiz options', 'error');
      }
    }
    startQuiz();
  }
}
modeCards.addEventListener('click', () => switchMode(false));
modeQuiz.addEventListener('click', () => switchMode(true));

// ---------- Init ----------
try {
  const [cats] = await Promise.all([
    api.vocabCategories().catch(() => []),
    initPromise
  ]);
  categories = cats;
} catch { /* filters just won't show categories */ }
await loadWords();
