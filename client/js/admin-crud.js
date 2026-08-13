// Reusable CRUD table + modal helpers for admin pages.
// Each admin page calls buildCrudPage() with configuration.
import { toast } from './toast.js';

/**
 * Render a full CRUD table page with add/edit modals and delete confirmation.
 * @param {Object} config
 * @param {HTMLElement} config.container - The element to render into
 * @param {string} config.entityName - e.g. 'passage', 'test'
 * @param {Function} config.fetchAll - async () => items[]
 * @param {Function} config.create - async (body) => result
 * @param {Function} config.update - async (id, body) => result
 * @param {Function} config.remove - async (id) => result
 * @param {Array} config.columns - [{ key, label, render? }]
 * @param {Array} config.fields - [{ key, label, type, required?, options?, placeholder? }]
 * @param {Function} [config.onRowAction] - callback(item) for extra row actions
 */
export async function buildCrudPage(config) {
  const { container, entityName, fetchAll, create, update, remove, columns, fields } = config;

  // -- Render table --
  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div class="flex items-center gap-3">
        <input id="admin-search" type="text" placeholder="Search ${entityName}s…" class="admin-input" style="max-width:250px">
      </div>
      <button id="add-btn" class="admin-btn admin-btn-primary">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Add ${entityName}
      </button>
    </div>
    <div class="card overflow-x-auto">
      <table class="admin-table">
        <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}<th class="text-right">Actions</th></tr></thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
    <p id="empty-msg" class="hidden text-center text-sm text-slate-500 dark:text-slate-400 mt-6">No ${entityName}s found.</p>`;

  const tbody = container.querySelector('#table-body');
  const emptyMsg = container.querySelector('#empty-msg');
  const searchInput = container.querySelector('#admin-search');
  let items = [];

  function renderTable(filter = '') {
    const filtered = filter
      ? items.filter(item => columns.some(c => {
          const val = c.render ? c.render(item) : item[c.key];
          return String(val || '').toLowerCase().includes(filter.toLowerCase());
        }))
      : items;

    tbody.innerHTML = '';
    emptyMsg.classList.toggle('hidden', filtered.length > 0);

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = columns.map(c => {
        const val = c.render ? c.render(item) : (item[c.key] ?? '');
        return `<td>${val}</td>`;
      }).join('') + `
        <td class="text-right">
          <div class="flex items-center justify-end gap-2">
            <button class="admin-btn admin-btn-edit edit-btn" data-id="${item.id}">Edit</button>
            <button class="admin-btn admin-btn-delete delete-btn" data-id="${item.id}">Delete</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    // Bind edit/delete buttons
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items.find(i => i.id === Number(btn.dataset.id));
        if (item) openModal(item);
      });
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(Number(btn.dataset.id)));
    });
  }

  searchInput.addEventListener('input', () => renderTable(searchInput.value));

  async function loadData() {
    try {
      items = await fetchAll();
      renderTable(searchInput.value);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  // -- Modal --
  function openModal(existing = null) {
    const isEdit = !!existing;
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-body p-6 sm:p-8">
        <h3 class="font-display font-bold text-xl mb-5">${isEdit ? 'Edit' : 'Add'} ${entityName}</h3>
        <form id="modal-form" class="space-y-4">
          ${fields.map(f => {
            const value = isEdit ? (existing[f.key] ?? '') : (f.default ?? '');
            if (f.type === 'textarea') {
              return `<div><label class="block text-sm font-medium mb-1.5">${f.label}</label>
                <textarea name="${f.key}" class="admin-input" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</textarea></div>`;
            }
            if (f.type === 'select') {
              return `<div><label class="block text-sm font-medium mb-1.5">${f.label}</label>
                <select name="${f.key}" class="admin-input" ${f.required ? 'required' : ''}>
                  ${f.options.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select></div>`;
            }
            if (f.type === 'number') {
              return `<div><label class="block text-sm font-medium mb-1.5">${f.label}</label>
                <input type="number" name="${f.key}" class="admin-input" value="${value}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}></div>`;
            }
            return `<div><label class="block text-sm font-medium mb-1.5">${f.label}</label>
              <input type="text" name="${f.key}" class="admin-input" value="${typeof value === 'object' ? JSON.stringify(value) : value}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}></div>`;
          }).join('')}
          <div class="flex gap-3 pt-2">
            <button type="button" id="modal-cancel" class="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" class="flex-1 py-2.5 rounded-xl admin-btn-primary text-sm font-semibold transition">${isEdit ? 'Save changes' : 'Create'}</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const body = {};
      fields.forEach(f => {
        let val = formData.get(f.key);
        if (f.type === 'number') val = Number(val);
        if (f.json) { try { val = JSON.parse(val); } catch { /* keep as string */ } }
        body[f.key] = val;
      });

      try {
        if (isEdit) {
          await update(existing.id, body);
          toast(`${entityName} updated.`, 'success');
        } else {
          await create(body);
          toast(`${entityName} created.`, 'success');
        }
        modal.remove();
        await loadData();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // -- Delete confirmation --
  function confirmDelete(id) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-body p-6">
        <h3 class="font-display font-bold text-lg">Delete ${entityName}?</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">This action cannot be undone. All associated data will be permanently removed.</p>
        <div class="flex gap-3 mt-5">
          <button id="del-cancel" class="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button id="del-confirm" class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#del-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#del-confirm').addEventListener('click', async () => {
      try {
        await remove(id);
        toast(`${entityName} deleted.`, 'success');
        modal.remove();
        await loadData();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // -- Add button --
  container.querySelector('#add-btn').addEventListener('click', () => openModal());

  // -- Initial load --
  await loadData();

  // Return utilities for the page to use
  return { loadData, items: () => items, openModal };
}
