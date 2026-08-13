import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';
import { toast } from '../../toast.js';

await initAdminShell({ active: 'listening', title: 'Listening' });

const crudContainer = document.getElementById('crud-container');
const questionsSection = document.getElementById('questions-section');
const questionsContainer = document.getElementById('questions-container');

// -- Tests CRUD --
const crud = await buildCrudPage({
  container: crudContainer,
  entityName: 'test',
  fetchAll: adminApi.tests,
  create: (body) => adminApi.createTest(body),
  update: (id, body) => adminApi.updateTest(id, body),
  remove: (id) => adminApi.deleteTest(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title', render: (t) => `<span class="font-medium">${t.title}</span>` },
    { key: 'difficulty', label: 'Difficulty', render: (t) => `<span class="admin-badge admin-badge-${t.difficulty}">${t.difficulty}</span>` },
    { key: 'time_limit', label: 'Minutes' },
    { key: 'question_count', label: 'Questions', render: (t) => `<button class="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline manage-q" data-id="${t.id}" data-title="${t.title}">${t.question_count} →</button>` },
  ],
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Test title' },
    { key: 'audioUrl', label: 'Audio URL', type: 'text', required: true, placeholder: 'https://example.com/audio.mp3' },
    { key: 'transcript', label: 'Transcript', type: 'textarea', placeholder: 'Full transcript text…' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'medium' },
    { key: 'timeLimit', label: 'Time limit (minutes)', type: 'number', default: 30 },
  ],
});

// -- Manage questions for a test --
crudContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.manage-q');
  if (btn) openQuestions(Number(btn.dataset.id), btn.dataset.title);
});

document.getElementById('close-questions').addEventListener('click', () => {
  questionsSection.classList.add('hidden');
  crudContainer.classList.remove('hidden');
});

async function openQuestions(testId, title) {
  document.getElementById('test-title').textContent = title;
  crudContainer.classList.add('hidden');
  questionsSection.classList.remove('hidden');

  await buildCrudPage({
    container: questionsContainer,
    entityName: 'question',
    fetchAll: () => adminApi.testQuestions(testId),
    create: (body) => adminApi.createTestQuestion(testId, body),
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
      { key: 'optionsJson', label: 'Options (JSON array)', type: 'text', json: true, placeholder: '["Option A", "Option B", "Option C"]' },
      { key: 'correctAnswer', label: 'Correct answer', type: 'text', required: true },
      { key: 'explanation', label: 'Explanation', type: 'textarea' },
      { key: 'position', label: 'Position', type: 'number', default: 1 },
    ],
  });
}
