import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';

await initAdminShell({ active: 'writing', title: 'Writing' });

await buildCrudPage({
  container: document.getElementById('crud-container'),
  entityName: 'prompt',
  fetchAll: adminApi.prompts,
  create: (body) => adminApi.createPrompt(body),
  update: (id, body) => adminApi.updatePrompt(id, body),
  remove: (id) => adminApi.deletePrompt(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'task_type', label: 'Task', render: (p) => `<span class="admin-badge admin-badge-${p.task_type === 'task1' ? 'easy' : 'medium'}">${p.task_type === 'task1' ? 'Task 1' : 'Task 2'}</span>` },
    { key: 'category', label: 'Category', render: (p) => p.category || '—' },
    { key: 'prompt_text', label: 'Prompt', render: (p) => `<span class="max-w-sm truncate block text-sm">${p.prompt_text}</span>` },
    { key: 'submission_count', label: 'Submissions', render: (p) => `<span class="font-mono">${p.submission_count}</span>` },
  ],
  fields: [
    { key: 'taskType', label: 'Task type', type: 'select', options: ['task1', 'task2'], default: 'task2', required: true },
    { key: 'promptText', label: 'Prompt text', type: 'textarea', required: true, placeholder: 'Write the writing prompt…' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Education, Environment' },
    { key: 'chartData', label: 'Chart data (JSON, for Task 1)', type: 'textarea', json: true, placeholder: '{"type":"bar","data":{...}}' },
  ],
});
