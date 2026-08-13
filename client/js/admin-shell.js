// Admin shell: sidebar, topbar, role guard. Mirrors shell.js but with
// admin-specific navigation and an admin role check.
import { adminApi } from './admin-api.js';
import { initThemeToggles } from './theme.js';
import { toast } from './toast.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/pages/admin/dashboard.html',
    icon: '<path d="M3 12l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>' },
  { id: 'reading', label: 'Reading', href: '/pages/admin/reading.html',
    icon: '<path d="M12 6.5C10 4.8 7.5 4 4 4v14c3.5 0 6 .8 8 2.5 2-1.7 4.5-2.5 8-2.5V4c-3.5 0-6 .8-8 2.5z"/><path d="M12 6.5V20.5"/>' },
  { id: 'listening', label: 'Listening', href: '/pages/admin/listening.html',
    icon: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z"/><path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z"/>' },
  { id: 'vocabulary', label: 'Vocabulary', href: '/pages/admin/vocabulary.html',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>' },
  { id: 'writing', label: 'Writing', href: '/pages/admin/writing.html',
    icon: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>' },
  { id: 'speaking', label: 'Speaking', href: '/pages/admin/speaking.html',
    icon: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>' },
  { id: 'students', label: 'Students', href: '/pages/admin/students.html',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
];

function iconSvg(paths, cls = 'w-5 h-5') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export async function initAdminShell({ active, title }) {
  // ---- Auth + Role guard ----
  let user;
  try {
    user = await adminApi.me();
  } catch {
    window.location.href = '/pages/login.html';
    return new Promise(() => {}); // halt page while redirecting
  }

  if (user.role !== 'admin') {
    window.location.href = '/pages/dashboard.html';
    return new Promise(() => {}); // not admin, redirect to student dash
  }

  document.title = `${title} · Admin · BandUp`;

  // ---- Sidebar ----
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  aside.className =
    'fixed inset-y-0 left-0 z-50 w-64 -translate-x-full md:translate-x-0 transition-transform ' +
    'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col';
  aside.innerHTML = `
    <a href="/pages/admin/dashboard.html" class="flex items-center gap-2.5 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
      <img src="/favicon.png" alt="BandUp Admin" class="w-8 h-8 rounded-lg">
      <span class="font-display font-bold text-lg text-slate-900 dark:text-white">Admin Panel</span>
    </a>
    <nav class="flex-1 px-3 py-4 space-y-1" aria-label="Admin navigation">
      ${NAV_ITEMS.map((item) => `
        <a href="${item.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
           ${item.id === active
             ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
             : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'}">
          ${iconSvg(item.icon)}${item.label}
        </a>`).join('')}
    </nav>
    <div class="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
      <a href="/pages/dashboard.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors mb-1">
        ${iconSvg('<path d="M15 18l-6-6 6-6"/>')} Student view
      </a>
      <button id="logout-btn" class="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors">
        ${iconSvg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>')}
        Log out
      </button>
    </div>`;
  document.body.prepend(aside);

  // ---- Mobile backdrop ----
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 z-40 bg-slate-950/50 hidden md:hidden';
  backdrop.addEventListener('click', closeSidebar);
  document.body.appendChild(backdrop);

  function openSidebar() { aside.classList.remove('-translate-x-full'); backdrop.classList.remove('hidden'); }
  function closeSidebar() { aside.classList.add('-translate-x-full'); backdrop.classList.add('hidden'); }

  // ---- Topbar ----
  const topbar = document.getElementById('topbar');
  topbar.className =
    'sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 ' +
    'bg-white/85 dark:bg-slate-950/85 backdrop-blur border-b border-slate-200 dark:border-slate-800';
  topbar.innerHTML = `
    <button id="menu-btn" class="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Open menu">
      ${iconSvg('<path d="M4 6h16M4 12h16M4 18h16"/>')}
    </button>
    <h1 class="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">${title}</h1>
    <span class="ml-2 px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 border dark:border-rose-800/50">Admin</span>
    <div class="ml-auto flex items-center gap-2 sm:gap-3">
      <button data-theme-toggle class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
        <span data-icon-moon>${iconSvg('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', 'w-5 h-5')}</span>
        <span data-icon-sun class="hidden">${iconSvg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'w-5 h-5')}</span>
      </button>
      <div class="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-rose-600 to-amber-500 text-white text-sm font-bold" title="${user.name}">
        ${(user.name || '?').trim().charAt(0).toUpperCase()}
      </div>
    </div>`;

  topbar.querySelector('#menu-btn').addEventListener('click', openSidebar);
  aside.querySelector('#logout-btn').addEventListener('click', async () => {
    try {
      await adminApi.logout();
      window.location.href = '/pages/login.html';
    } catch {
      toast('Could not log out. Please try again.', 'error');
    }
  });

  initThemeToggles();
  return user;
}
