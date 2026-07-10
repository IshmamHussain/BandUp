// Shared Tailwind (Play CDN) config, loaded on every page right after the
// Tailwind script. One file = one source of truth for design tokens.
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand teal - primary actions, links, focus states
        brand: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a',
        },
        // Teal-tinted dark surfaces (instead of generic gray dark mode)
        ink: {
          950: '#081418', 900: '#0c1b20', 800: '#112630', 700: '#17333f',
          600: '#204554',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
};
