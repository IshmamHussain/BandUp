// App shell for authenticated pages: sidebar, topbar, auth guard.
// Each app page calls initShell() first; it verifies the session
// (redirecting to login if there is none) and builds the chrome.
import { api } from './api.js';
import { initThemeToggles } from './theme.js';
import { toast } from './toast.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/pages/dashboard.html',
    icon: '<path d="M3 12l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>' },
  { id: 'reading', label: 'Reading', href: '/pages/reading.html',
    icon: '<path d="M12 6.5C10 4.8 7.5 4 4 4v14c3.5 0 6 .8 8 2.5 2-1.7 4.5-2.5 8-2.5V4c-3.5 0-6 .8-8 2.5z"/><path d="M12 6.5V20.5"/>' },
  { id: 'listening', label: 'Listening', href: '/pages/listening.html',
    icon: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-5h3v3z"/><path d="M3 19a2 2 0 0 0 2 2h1v-5H3v3z"/>' },
  { id: 'vocabulary', label: 'Vocabulary', href: '/pages/vocabulary.html',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>' },
  { id: 'writing', label: 'Writing', href: '/pages/writing.html',
    icon: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>' },
];

function iconSvg(paths, cls = 'w-5 h-5') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export async function initShell({ active, title }) {
  // ---- Auth guard: no session, no app ----
  let user;
  try {
    user = await api.me();
  } catch {
    window.location.href = '/pages/login.html';
    return new Promise(() => {}); // halt page script while redirecting
  }

  document.title = `${title} · BandUp IELTS`;

  // ---- Sidebar ----
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  aside.className =
    'fixed inset-y-0 left-0 z-50 w-64 -translate-x-full md:translate-x-0 transition-transform ' +
    'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col';
  aside.innerHTML = `
    <a href="/pages/dashboard.html" class="flex items-center gap-2.5 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
      <span class="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-cyan-500 text-white font-display font-bold text-sm">B</span>
      <span class="font-display font-bold text-lg text-slate-900 dark:text-white">BandUp</span>
    </a>
    <nav class="flex-1 px-3 py-4 space-y-1" aria-label="Main">
      ${NAV_ITEMS.map((item) => `
        <a href="${item.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
           ${item.id === active
             ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
             : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}">
          ${iconSvg(item.icon)}${item.label}
        </a>`).join('')}
    </nav>
    <div class="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
      <button id="logout-btn" class="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors">
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

  function openSidebar() {
    aside.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  }
  function closeSidebar() {
    aside.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }

  // ---- Topbar ----
  const topbar = document.getElementById('topbar');
  const initial = (user.name || '?').trim().charAt(0).toUpperCase();
  topbar.className =
    'sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 ' +
    'bg-white/85 dark:bg-slate-950/85 backdrop-blur border-b border-slate-200 dark:border-slate-800';
  topbar.innerHTML = `
    <button id="menu-btn" class="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Open menu">
      ${iconSvg('<path d="M4 6h16M4 12h16M4 18h16"/>')}
    </button>
    <h1 class="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">${title}</h1>
    <div class="ml-auto flex items-center gap-2 sm:gap-3">
      <span id="streak-chip" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400" title="Study streak">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4-3 5.5-3 9a3 3 0 0 0 6 .2C15 8 19 9 19 14a7 7 0 1 1-14 0c0-5 5-7 7-12z"/></svg>
        <span data-streak>${user.study_streak ?? 0}</span> day${(user.study_streak ?? 0) === 1 ? '' : 's'}
      </span>
      <button data-theme-toggle class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
        <span data-icon-moon>${iconSvg('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', 'w-5 h-5')}</span>
        <span data-icon-sun class="hidden">${iconSvg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'w-5 h-5')}</span>
      </button>
      <div class="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 text-white text-sm font-bold" title="${user.name}">${initial}</div>
    </div>`;

  topbar.querySelector('#menu-btn').addEventListener('click', openSidebar);
  aside.querySelector('#logout-btn').addEventListener('click', async () => {
    try {
      await api.logout();
      window.location.href = '/pages/login.html';
    } catch {
      toast('Could not log out. Please try again.', 'error');
    }
  });

  initThemeToggles();
  return user;
}
