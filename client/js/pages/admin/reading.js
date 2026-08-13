import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';
import { toast } from '../../toast.js';

await initAdminShell({ active: 'reading', title: 'Reading' });

const crudContainer = document.getElementById('crud-container');
const questionsSection = document.getElementById('questions-section');
const questionsContainer = document.getElementById('questions-container');

// -- Passages CRUD --
const crud = await buildCrudPage({
  container: crudContainer,
  entityName: 'passage',
  fetchAll: adminApi.passages,
  create: (body) => adminApi.createPassage(body),
  update: (id, body) => adminApi.updatePassage(id, body),
  remove: (id) => adminApi.deletePassage(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title', render: (p) => `<span class="font-medium">${p.title}</span>` },
    { key: 'passage_type', label: 'Type', render: (p) => `<span class="admin-badge admin-badge-${p.passage_type === 'academic' ? 'medium' : 'easy'}">${p.passage_type}</span>` },
    { key: 'difficulty', label: 'Difficulty', render: (p) => `<span class="admin-badge admin-badge-${p.difficulty}">${p.difficulty}</span>` },
    { key: 'question_count', label: 'Questions', render: (p) => `
      <div class="flex items-center gap-2">
        <button class="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline manage-q" data-id="${p.id}" data-title="${p.title}">${p.question_count} →</button>
        <button class="generate-q inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
                       bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300
                       border border-amber-200 dark:border-amber-500/25
                       hover:bg-amber-100 dark:hover:bg-amber-500/20 transition"
                data-id="${p.id}" data-title="${p.title}">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.4-6.4-2.8 2.8M9.4 14.6l-2.8 2.8m12.8 0-2.8-2.8M9.4 9.4 6.6 6.6"/></svg>
          Generate
        </button>
      </div>` },
  ],
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Passage title' },
    { key: 'body', label: 'Body', type: 'textarea', required: true, placeholder: 'Full passage text…' },
    { key: 'passageType', label: 'Type', type: 'select', options: ['academic', 'general'], default: 'academic' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'medium' },
    { key: 'timeLimit', label: 'Time limit (minutes)', type: 'number', default: 20 },
  ],
});

// -- Manage questions for a passage --
crudContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.manage-q');
  if (btn) openQuestions(Number(btn.dataset.id), btn.dataset.title);
});

// -- Generate questions via AI --
crudContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.generate-q');
  if (btn) openGenerateModal(Number(btn.dataset.id), btn.dataset.title);
});

document.getElementById('close-questions').addEventListener('click', () => {
  questionsSection.classList.add('hidden');
  crudContainer.classList.remove('hidden');
});

async function openQuestions(passageId, title) {
  document.getElementById('passage-title').textContent = title;
  crudContainer.classList.add('hidden');
  questionsSection.classList.remove('hidden');

  await buildCrudPage({
    container: questionsContainer,
    entityName: 'question',
    fetchAll: () => adminApi.passageQuestions(passageId),
    create: (body) => adminApi.createPassageQuestion(passageId, body),
    update: (id, body) => adminApi.updateQuestion(id, body),
    remove: (id) => adminApi.deleteQuestion(id),
    columns: [
      { key: 'position', label: '#' },
      { key: 'question_text', label: 'Question', render: (q) => `<span class="max-w-xs truncate block">${q.question_text}</span>` },
      { key: 'question_type', label: 'Type', render: (q) => `<span class="admin-badge admin-badge-medium">${q.question_type}</span>` },
      { key: 'correct_answer', label: 'Answer' },
    ],
    fields: [
      { key: 'questionText', label: 'Question text', type: 'textarea', required: true },
      { key: 'questionType', label: 'Type', type: 'select', options: ['mcq', 'true_false_ng', 'fill_blank', 'matching'], default: 'mcq' },
      { key: 'optionsJson', label: 'Options (JSON array, e.g. ["A","B","C"])', type: 'text', json: true, placeholder: '["Option A", "Option B", "Option C"]' },
      { key: 'correctAnswer', label: 'Correct answer', type: 'text', required: true },
      { key: 'explanation', label: 'Explanation', type: 'textarea' },
      { key: 'position', label: 'Position', type: 'number', default: 1 },
    ],
  });
}

// ── AI Question Generation Modal ─────────────────────────────────────

function openGenerateModal(passageId, passageTitle) {
  const modal = document.createElement('div');
  modal.className = 'admin-modal';
  modal.innerHTML = `
    <div class="admin-modal-body p-6 sm:p-8" style="max-width:28rem">
      <div class="flex items-center gap-2.5 mb-5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center flex-shrink-0">
          <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.4-6.4-2.8 2.8M9.4 14.6l-2.8 2.8m12.8 0-2.8-2.8M9.4 9.4 6.6 6.6"/></svg>
        </div>
        <div>
          <h3 class="font-display font-bold text-lg">Generate Questions</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">for "${passageTitle}"</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5">Number of questions</label>
          <input id="gen-count" type="number" class="admin-input" value="10" min="1" max="20">
          <p class="text-xs text-slate-400 mt-1">Between 1 and 20 questions</p>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button id="gen-cancel" class="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
        <button id="gen-submit" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.4-6.4-2.8 2.8M9.4 14.6l-2.8 2.8m12.8 0-2.8-2.8M9.4 9.4 6.6 6.6"/></svg>
          Generate
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#gen-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#gen-submit').addEventListener('click', async () => {
    const count = Math.min(Math.max(Number(modal.querySelector('#gen-count').value) || 10, 1), 20);
    modal.remove();
    await runGeneration(passageId, passageTitle, count);
  });
}

async function runGeneration(passageId, passageTitle, count) {
  // Show loading overlay
  const loading = document.createElement('div');
  loading.className = 'admin-modal';
  loading.innerHTML = `
    <div class="admin-modal-body p-8 sm:p-10 text-center" style="max-width:24rem">
      <div class="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center">
        <svg class="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
      </div>
      <h3 class="font-display font-bold text-lg mb-2">Generating Questions…</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400">AI is analyzing the passage and creating ${count} IELTS-style questions. This may take a moment.</p>
    </div>`;
  document.body.appendChild(loading);

  try {
    const data = await adminApi.generateQuestions(passageId, { count });
    loading.remove();

    if (data.isMock) {
      toast('No API key configured — showing mock questions.', 'info');
    }

    openReviewModal(passageId, passageTitle, data.questions);
  } catch (err) {
    loading.remove();
    toast(err.message, 'error');
  }
}

function openReviewModal(passageId, passageTitle, questions) {
  // Track which questions are included (all by default)
  const included = new Set(questions.map((_, i) => i));

  const modal = document.createElement('div');
  modal.className = 'admin-modal';

  function renderQuestionsList() {
    return questions.map((q, i) => {
      const isIncluded = included.has(i);
      const typeBadge = {
        mcq: 'medium', true_false_ng: 'easy', fill_blank: 'hard', matching: 'medium'
      }[q.question_type] || 'medium';

      return `
        <div class="review-q p-4 rounded-xl border ${isIncluded ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50'} transition" data-idx="${i}">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#${q.position}</span>
              <span class="admin-badge admin-badge-${typeBadge}">${q.question_type}</span>
            </div>
            <button class="toggle-q text-xs font-semibold px-2 py-1 rounded-lg transition ${isIncluded
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
              : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10'
            }" data-idx="${i}">${isIncluded ? 'Remove' : 'Include'}</button>
          </div>
          <p class="text-sm font-medium mb-1.5">${q.question_text}</p>
          ${q.options_json ? `<div class="flex flex-wrap gap-1.5 mb-1.5">${q.options_json.map(o => `<span class="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${o}</span>`).join('')}</div>` : ''}
          <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Answer: <strong class="text-slate-700 dark:text-slate-200">${q.correct_answer}</strong></span>
          </div>
          ${q.explanation ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">${q.explanation}</p>` : ''}
        </div>`;
    }).join('');
  }

  function render() {
    const includedCount = included.size;
    modal.innerHTML = `
      <div class="admin-modal-body p-6 sm:p-8" style="max-width:42rem">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="font-display font-bold text-lg">Review Generated Questions</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${includedCount} of ${questions.length} questions selected for "${passageTitle}"</p>
          </div>
          <button class="review-close p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-1 review-list">
          ${renderQuestionsList()}
        </div>

        <div class="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/60">
          <button class="review-cancel flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">Discard all</button>
          <button class="review-save flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2" ${includedCount === 0 ? 'disabled' : ''}>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
            Save ${includedCount} question${includedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>`;

    // Bind events
    modal.querySelector('.review-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.review-cancel').addEventListener('click', () => modal.remove());

    modal.querySelectorAll('.toggle-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (included.has(idx)) included.delete(idx);
        else included.add(idx);
        render();
      });
    });

    modal.querySelector('.review-save').addEventListener('click', async () => {
      const toSave = questions.filter((_, i) => included.has(i));
      if (toSave.length === 0) return;

      const saveBtn = modal.querySelector('.review-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg> Saving…`;

      try {
        await adminApi.bulkCreateQuestions(passageId, { questions: toSave });
        toast(`${toSave.length} question${toSave.length !== 1 ? 's' : ''} saved successfully!`, 'success');
        modal.remove();
        // Refresh the passages table to show updated question counts
        crud.loadData();
      } catch (err) {
        toast(err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg> Save ${toSave.length} question${toSave.length !== 1 ? 's' : ''}`;
      }
    });
  }

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  render();
}
