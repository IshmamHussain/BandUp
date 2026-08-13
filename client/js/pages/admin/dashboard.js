import { initAdminShell } from '../../admin-shell.js';
import { adminApi } from '../../admin-api.js';
import { toast } from '../../toast.js';

await initAdminShell({ active: 'dashboard', title: 'Dashboard' });

try {
  const stats = await adminApi.stats();
  document.getElementById('stat-passages').textContent = stats.passages;
  document.getElementById('stat-tests').textContent = stats.tests;
  document.getElementById('stat-words').textContent = stats.words;
  document.getElementById('stat-prompts').textContent = stats.prompts;
  document.getElementById('stat-users').textContent = stats.users;
} catch (err) {
  toast(err.message, 'error');
}
