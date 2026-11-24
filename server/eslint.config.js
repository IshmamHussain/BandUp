// ESLint (flat config) for the whole project: Node server code and the
// browser JS in ../client. Run with `npm run lint` from server/ (the script
// runs ESLint from the repo root so both folders share this one config).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'server/scripts/ielts-ai-dataset/**',
      'client/js/tw-config.js', // Tailwind CDN config object, not app code
    ],
  },

  js.configs.recommended,

  // Shared rules
  {
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },

  // Server: Node ES modules
  {
    files: ['server/**/*.js', 'server/**/*.mjs', '*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['server/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['server/tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Client: plain browser scripts + CDN globals
  {
    files: ['client/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        Chart: 'readonly',
        marked: 'readonly', // markdown renderer loaded from CDN on dashboard.html
        tailwind: 'readonly',
      },
    },
  },
];
