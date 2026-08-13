import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';

await initAdminShell({ active: 'vocabulary', title: 'Vocabulary' });

await buildCrudPage({
  container: document.getElementById('crud-container'),
  entityName: 'word',
  fetchAll: adminApi.vocabulary,
  create: (body) => adminApi.createWord(body),
  update: (id, body) => adminApi.updateWord(id, body),
  remove: (id) => adminApi.deleteWord(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'word', label: 'Word', render: (w) => `<span class="font-semibold">${w.word}</span>` },
    { key: 'category', label: 'Category', render: (w) => `<span class="admin-badge admin-badge-medium">${w.category}</span>` },
    { key: 'band_level', label: 'Band', render: (w) => `<span class="font-mono font-bold text-brand-600 dark:text-brand-400">${w.band_level}</span>` },
    { key: 'meaning', label: 'Meaning', render: (w) => `<span class="max-w-xs truncate block text-sm text-slate-500 dark:text-slate-400">${w.meaning}</span>` },
  ],
  fields: [
    { key: 'word', label: 'Word', type: 'text', required: true, placeholder: 'e.g. ubiquitous' },
    { key: 'meaning', label: 'Meaning', type: 'textarea', required: true, placeholder: 'Definition…' },
    { key: 'synonyms', label: 'Synonyms (comma-separated)', type: 'text', placeholder: 'pervasive, widespread' },
    { key: 'antonyms', label: 'Antonyms (comma-separated)', type: 'text', placeholder: 'rare, uncommon' },
    { key: 'exampleSentence', label: 'Example sentence', type: 'textarea', placeholder: 'Use in context…' },
    { key: 'pronunciation', label: 'Pronunciation (IPA)', type: 'text', placeholder: '/juːˈbɪkwɪtəs/' },
    { key: 'category', label: 'Category', type: 'text', default: 'general', placeholder: 'e.g. education, environment' },
    { key: 'bandLevel', label: 'Band level', type: 'select', options: ['6', '7', '8', '9'], default: '7' },
  ],
});
