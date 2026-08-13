// Dark/light theme. The <head> of every page contains a tiny inline script
// that applies the saved theme BEFORE first paint (prevents a white flash);
// this module handles the toggle button afterwards.

export function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function toggleTheme(e) {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';

  // --- Full-screen circular ripple via View Transitions API ---
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Find the click origin (centre of the toggle button)
    let x = window.innerWidth / 2;
    let y = 40; // fallback near topbar
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Radius must cover the farthest corner from the click point
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
      updateToggleIcons();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  } else {
    // Fallback for browsers without View Transitions
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    updateToggleIcons();
  }
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
