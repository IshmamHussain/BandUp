// Reading test: timer, question navigation, submission, results review.
import { initShell } from '../shell.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

await initShell({ active: 'reading', title: 'Reading' });

const el = (id) => document.getElementById(id);
const params = new URLSearchParams(window.location.search);
const passageId = Number(params.get('id'));
if (!passageId) window.location.href = '/pages/reading.html';

// ---------- Load passage ----------
let passage;
try {
  passage = await api.passage(passageId);
} catch (err) {
  toast(err.message, 'error');
  setTimeout(() => (window.location.href = '/pages/reading.html'), 1200);
  throw err;
}

el('test-title').textContent = passage.title;

// Passage body: server stores literal \n sequences between paragraphs.
const paragraphs = passage.body.split(/\\n\\n|\n\n/);
el('passage-body').innerHTML = '';
paragraphs.forEach((text) => {
  const p = document.createElement('p');
  p.textContent = text;
  el('passage-body').appendChild(p);
});

// ---------- State ----------
const answers = new Map(); // questionId -> answer string
const startedAt = Date.now();

// ---------- Timer (counts down from the passage time limit) ----------
let secondsLeft = passage.time_limit * 60;
const timerEl = el('timer');

function renderTimer() {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  timerEl.textContent = `${minutes}:${seconds}`;
  if (secondsLeft <= 120) {
    timerEl.classList.add('bg-rose-100', 'dark:bg-rose-900/40', 'text-rose-600', 'dark:text-rose-400');
  }
}
renderTimer();

const timerInterval = setInterval(() => {
  secondsLeft--;
  renderTimer();
  if (secondsLeft <= 0) {
    clearInterval(timerInterval);
    toast("Time's up - submitting your answers.", 'info');
    submit();
  }
}, 1000);

// ---------- Render questions ----------
const questionsEl = el('questions');
const dotsEl = el('nav-dots');

passage.questions.forEach((question, index) => {
  // Navigator dot
  const dot = document.createElement('button');
  dot.className = 'nav-dot';
  dot.textContent = index + 1;
  dot.setAttribute('aria-label', `Go to question ${index + 1}`);
  dot.addEventListener('click', () => {
    document.getElementById(`q-${question.id}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  dotsEl.appendChild(dot);

  // Question card
  const card = document.createElement('article');
  card.className = 'card p-5 mb-4';
  card.id = `q-${question.id}`;

  const isChoice = Array.isArray(question.options_json) && question.options_json.length > 0;
  card.innerHTML = `
    <p class="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-1.5">Question ${index + 1}</p>
    <p class="font-medium mb-3.5 question-text"></p>
    <div class="options space-y-2"></div>`;
  card.querySelector('.question-text').textContent = question.question_text;

  const optionsEl = card.querySelector('.options');
  if (isChoice) {
    question.options_json.forEach((option) => {
      const label = document.createElement('label');
      label.className =
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer ' +
        'hover:border-brand-400 dark:hover:border-brand-600 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 ' +
        'dark:has-[:checked]:bg-brand-900/25 transition text-sm';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question-${question.id}`;
      input.value = option;
      input.className = 'accent-teal-600';
      const span = document.createElement('span');
      span.textContent = option;
      label.append(input, span);
      input.addEventListener('change', () => setAnswer(question.id, option, index));
      optionsEl.appendChild(label);
    });
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type your answer';
    input.className =
      'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ' +
      'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none transition text-sm';
    input.addEventListener('input', () => setAnswer(question.id, input.value.trim(), index));
    optionsEl.appendChild(input);
  }
  questionsEl.appendChild(card);
});

el('submit-row').classList.remove('hidden');

function setAnswer(questionId, value, index) {
  if (value) answers.set(questionId, value);
  else answers.delete(questionId);
  dotsEl.children[index]?.classList.toggle('answered', Boolean(value));
}

// ---------- Submit flow ----------
const confirmModal = el('confirm-modal');

el('submit-btn').addEventListener('click', () => {
  const unanswered = passage.questions.length - answers.size;
  if (unanswered > 0) {
    el('confirm-text').textContent =
      `${unanswered} of ${passage.questions.length} questions ${unanswered === 1 ? 'is' : 'are'} still blank. Unanswered questions count as incorrect.`;
    confirmModal.classList.remove('hidden');
  } else {
    submit();
  }
});
el('confirm-cancel').addEventListener('click', () => confirmModal.classList.add('hidden'));
el('confirm-submit').addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  submit();
});

let submitted = false;
async function submit() {
  if (submitted) return;
  submitted = true;
  clearInterval(timerInterval);
  el('submit-btn').disabled = true;
  el('submit-btn').textContent = 'Scoring…';

  const payload = {
    minutesSpent: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
    answers: passage.questions.map((question) => ({
      questionId: question.id,
      answer: answers.get(question.id) ?? '',
    })),
  };

  try {
    const result = await api.submitReading(passageId, payload);
    renderResults(result);
  } catch (err) {
    toast(err.message, 'error');
    submitted = false;
    el('submit-btn').disabled = false;
    el('submit-btn').textContent = 'Submit answers';
  }
}

// ---------- Results ----------
function renderResults(result) {
  el('questions').classList.add('hidden');
  el('submit-row').classList.add('hidden');
  dotsEl.classList.add('hidden');

  const resultsEl = el('results');
  resultsEl.classList.remove('hidden');

  const tone = result.accuracy >= 80 ? 'Excellent work' : result.accuracy >= 60 ? 'Good effort' : 'Keep practising';

  resultsEl.innerHTML = `
    <div class="card p-6 text-center mb-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">${tone}</p>
      <p class="font-mono font-bold text-5xl mt-2 text-gradient">${result.accuracy}%</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1.5">${result.correct} of ${result.total} correct</p>
      <div class="flex gap-2 justify-center mt-5">
        <a href="/pages/reading.html" class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">All passages</a>
        <button id="retry-btn" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition">Try again</button>
      </div>
    </div>
    <h3 class="font-display font-semibold mb-3">Answer review</h3>
    <div id="review-list" class="space-y-3"></div>`;

  document.getElementById('retry-btn').addEventListener('click', () => window.location.reload());

  const reviewList = document.getElementById('review-list');
  result.results.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = `card p-5 border-l-4 ${item.isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'}`;
    card.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold ${item.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
          ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'} · Question ${index + 1}
        </span>
      </div>
      <p class="text-sm question-text font-medium mb-2.5"></p>
      <div class="text-sm space-y-1">
        <p><span class="text-slate-400">Your answer:</span> <span class="your-answer font-medium"></span></p>
        ${item.isCorrect ? '' : `<p><span class="text-slate-400">Correct answer:</span> <span class="correct-answer font-medium text-emerald-600 dark:text-emerald-400"></span></p>`}
      </div>
      <div class="mt-3 p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-900/20 text-sm text-slate-600 dark:text-slate-300">
        <span class="font-semibold text-brand-700 dark:text-brand-400">Why: </span><span class="explanation"></span>
      </div>`;

    const question = passage.questions.find((q) => q.id === item.questionId);
    card.querySelector('.question-text').textContent = question?.question_text || '';
    card.querySelector('.your-answer').textContent = item.givenAnswer || '(blank)';
    if (!item.isCorrect) card.querySelector('.correct-answer').textContent = item.correctAnswer;
    card.querySelector('.explanation').textContent = item.explanation || '';
    reviewList.appendChild(card);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
