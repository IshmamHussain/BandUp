import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';

await initAdminShell({ active: 'speaking', title: 'Speaking' });

await buildCrudPage({
  container: document.getElementById('crud-container'),
  entityName: 'prompt',
  fetchAll: adminApi.speakingPrompts,
  create: (body) => adminApi.createSpeakingPrompt(body),
  update: (id, body) => adminApi.updateSpeakingPrompt(id, body),
  remove: (id) => adminApi.deleteSpeakingPrompt(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'part', label: 'Part', render: (p) => `<span class="admin-badge admin-badge-${p.part === 'part1' ? 'easy' : p.part === 'part2' ? 'medium' : 'hard'}">${p.part.replace('part', 'Part ')}</span>` },
    { key: 'category', label: 'Category', render: (p) => p.category || '—' },
    { key: 'prompt_text', label: 'Prompt', render: (p) => `<span class="max-w-sm truncate block text-sm">${p.prompt_text}</span>` },
    { key: 'submission_count', label: 'Submissions', render: (p) => `<span class="font-mono">${p.submission_count}</span>` },
  ],
  fields: [
    { key: 'part', label: 'Part', type: 'select', options: ['part1', 'part2', 'part3'], default: 'part2', required: true },
    { key: 'promptText', label: 'Prompt text', type: 'textarea', required: true, placeholder: 'Write the speaking prompt…' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Travel, Education' },
  ],
});
