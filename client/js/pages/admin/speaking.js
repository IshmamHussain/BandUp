import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';

await initAdminShell({ active: 'speaking', title: 'Speaking Tests' });

await buildCrudPage({
  container: document.getElementById('crud-container'),
  entityName: 'test',
  fetchAll: adminApi.speakingPrompts,
  create: (body) => adminApi.createSpeakingPrompt(body),
  update: (id, body) => adminApi.updateSpeakingPrompt(id, body),
  remove: (id) => adminApi.deleteSpeakingPrompt(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title', render: (p) => `<span class="font-medium">${p.title}</span>` },
    { key: 'category', label: 'Category', render: (p) => p.category || '—' },
    { key: 'submission_count', label: 'Submissions', render: (p) => `<span class="font-mono">${p.submission_count}</span>` },
  ],
  fields: [
    { key: 'title', label: 'Test Title', type: 'text', required: true, placeholder: 'e.g. Travel and Transport' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Travel' },
    { key: 'part1Prompt', label: 'Part 1 Prompt', type: 'textarea', required: true, placeholder: 'Questions about familiar topics...' },
    { key: 'part2Prompt', label: 'Part 2 Prompt', type: 'textarea', placeholder: 'Describe a time when...' },
    { key: 'part3Prompt', label: 'Part 3 Prompt', type: 'textarea', placeholder: 'Discussion topics related to Part 2...' },
  ],
});
