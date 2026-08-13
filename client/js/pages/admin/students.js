import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { buildCrudPage } from '../../admin-crud.js';

await initAdminShell({ active: 'students', title: 'Students' });

await buildCrudPage({
  container: document.getElementById('crud-container'),
  entityName: 'student',
  fetchAll: adminApi.students,
  create: async () => { throw new Error('Students must register themselves.'); },
  update: (id, body) => {
    const data = { ...body };
    if (data.targetBand === '-') data.targetBand = null;
    return adminApi.updateStudent(id, data);
  },
  remove: (id) => adminApi.deleteStudent(id),
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (s) => `<span class="font-semibold">${s.name}</span>` },
    { key: 'email', label: 'Email' },
    { key: 'target_band', label: 'Target', render: (s) => s.target_band ? `<span class="font-mono font-bold text-brand-600 dark:text-brand-400">${s.target_band}</span>` : '<span class="text-slate-400">-</span>' },
    { key: 'study_streak', label: 'Streak', render: (s) => s.study_streak ? `🔥 ${s.study_streak}` : '<span class="text-slate-400">0</span>' },
    { key: 'created_at', label: 'Joined', render: (s) => new Date(s.created_at).toLocaleDateString() },
  ],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
    { key: 'targetBand', label: 'Target Band', type: 'select', options: ['-', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'], default: '-' },
  ],
});
