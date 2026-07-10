// Dark/light theme. The <head> of every page contains a tiny inline script
// that applies the saved theme BEFORE first paint (prevents a white flash);
// this module handles the toggle button afterwards.

export function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem('theme', next);
  updateToggleIcons();
}

function updateToggleIcons() {
  const dark = currentTheme() === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.querySelector('[data-icon-sun]')?.classList.toggle('hidden', !dark);
    btn.querySelector('[data-icon-moon]')?.classList.toggle('hidden', dark);
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

// Wire up every toggle button on the page.
export function initThemeToggles() {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
  updateToggleIcons();
}
