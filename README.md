# IELTS Prep Platform

> **Note:** Since This is on the free Supabase plan, only 2 accounts can register per hour.

AI-powered IELTS preparation platform. Node.js + Express + MySQL backend, HTML + Tailwind + vanilla JS frontend.

## Current status

- [x] Database schema + seed content (8 reading passages, 51 questions, 92 vocabulary words, 4 writing prompts, 2 listening tests, 10 speaking prompts)
- [x] REST API: auth, reading, listening, vocabulary, writing (AI evaluation), speaking (AI evaluation), admin, dashboard
- [x] Frontend: landing page, auth, dashboard (Chart.js), reading test, listening test, vocabulary flashcards + quiz, writing evaluator, speaking evaluator — dark/light mode, skeletons, toasts, mobile responsive

## Project structure

```
BandUp/
├── client/                  # Frontend (HTML + Tailwind + vanilla JS) — served by Express
│   ├── index.html           # Landing page
│   ├── css/custom.css       # Custom styles
│   ├── pages/               # dashboard, reading, listening, writing, speaking, vocabulary, login, register, admin/
│   └── js/
│       ├── api.js           # Fetch wrapper for all API calls
│       ├── shell.js         # Shared layout, nav, auth state
│       ├── theme.js         # Dark/light mode toggle
│       ├── toast.js         # Notification toasts
│       ├── admin-*.js       # Admin panel logic
│       └── pages/           # Per-page JS (dashboard, reading-test, writing, speaking, etc.)
├── server/
│   ├── server.js            # Entry point
│   ├── package.json         # Dependencies & scripts
│   ├── .env.example         # Template for environment variables
│   └── src/
│       ├── app.js           # Express app: middleware, static files, routes
│       ├── config/          # env.js (validated env vars), db.js (MySQL pool)
│       ├── middleware/      # auth.js (JWT cookie), errorHandler.js
│       ├── routes/          # index.js + speakingRoutes.js — URL → controller mappings
│       ├── controllers/     # auth, reading, listening, writing, speaking, vocabulary, dashboard, admin
│       ├── models/          # ALL SQL lives here (prepared statements only)
│       ├── services/        # aiService.js (Gemini API), storageService.js (private audio)
│       └── utils/           # helpers.js, validate.js
└── database/
    ├── setup.sql            # Runs schema + seed in one command
    ├── schema.sql           # Creates the ielts_prep database + tables
    ├── schema_speaking.sql  # Speaking module tables
    └── seeds/seed.sql       # Demo content (passages, questions, vocab, prompts, listening)
```

## Setup

New here? Follow **SETUP.md** for a step-by-step walkthrough. Short version:

1. **Install** Node.js 18+ and MySQL 8 (or MariaDB 10.6+). XAMPP is the easiest way to get MySQL.

2. **Create the database** in one command (from the project root):
   ```bash
   mysql -u root < database/setup.sql
   ```
   (Add `-p` if your root user has a password. Or import `database/setup.sql` via phpMyAdmin.)

3. **Configure.** Copy `server/.env.example` to `server/.env`, set `DB_PASSWORD`, generate a fresh `JWT_SECRET` and add your Supabase keys (see SETUP.md).

   Admins are not seeded. Register normally, then run `npm run admin -- promote <email>` from `server/`.

4. **Run:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Open http://localhost:5000

## How scores are calculated

- **Reading / listening:** marked on the server and stored as one result per
  test (`test_results`), converted to a band on a 40-question scale.
- **Writing / speaking:** Gemini's JSON is validated before it is saved
  (`server/src/services/evaluationValidator.js`). All four criteria must be
  present, each is clamped to 0–9 in 0.5 steps, and `band_overall` is
  recomputed from them. If Gemini's own overall disagrees, that is recorded
  in `meta.inconsistent`. The model name is stored in `meta.model`. Speaking
  prompts are loaded from the database, and essay text is fenced as untrusted
  input.
- **Band estimate:** for each module, a weighted mean of the last 5 results:
  - reading and listening tests are weighted by question count
  - Task 2 essays count double

  The overall band is the mean of the module bands, rounded the IELTS way
  (`server/src/services/bandEstimate.js`). It is recalculated whenever a
  result is added or deleted.

## Database migrations

Schema and data changes live in `server/src/config/migrations.js`. Each one
runs exactly once, in order, and is recorded in the `_migrations` table. The
server applies pending migrations on startup; you can also run them by hand:

```bash
cd server
npm run migrate
```

`npm start` only starts the server. Nothing deletes or re-inserts content on
startup. To change content, add a new migration (insert-if-missing or a guarded
update) or use the admin panel.

## Tests, linting and CI

```bash
cd server
npm test        # node:test suite - auth, admin access, private audio storage, startup guards
npm run lint    # ESLint for server/ and client/
```

The tests boot the real Express app against in-memory fakes of MySQL and
Supabase (see `server/tests/helpers/testApp.js`), so they need no database,
no `.env` and no network, and never touch production. GitHub Actions
(`.github/workflows/ci.yml`) runs lint + tests on every push and pull request.

## API overview

All responses share one shape: `{ "success": bool, "data": ..., "error": null | "message" }`.
Auth uses a JWT in an HTTP-only cookie; the browser never handles tokens in JS.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | - | Create account (sets cookie) |
| POST | /api/auth/login | - | Sign in (sets cookie) |
| POST | /api/auth/logout | - | Clear cookie and revoke the session server-side |
| GET | /api/auth/me | yes | Current user + profile |
| PATCH | /api/auth/goals | yes | Set target band / exam date |
| GET | /api/reading/tests | yes | List passages + per-user best score |
| GET | /api/reading/tests/:id | yes | Passage + questions (no answers) |
| POST | /api/reading/tests/:id/submit | yes | Score answers server-side |
| POST | /api/reading/tests/:id/bookmark | yes | Toggle bookmark |
| GET | /api/listening/tests | yes | List listening tests |
| GET | /api/listening/tests/:id | yes | One test + questions (no answers) |
| POST | /api/listening/tests/:id/submit | yes | Score answers server-side |
| GET | /api/vocabulary | yes | Words (+ ?category= &bookmarked=true) |
| GET | /api/vocabulary/categories | yes | Category list with counts |
| PATCH | /api/vocabulary/:id/status | yes | new / learning / mastered |
| POST | /api/vocabulary/:id/bookmark | yes | Toggle bookmark |
| GET | /api/writing/prompts | yes | Essay questions |
| POST | /api/writing/submit | yes | Save essay + AI evaluation |
| GET | /api/writing/submissions | yes | Essay history |
| GET | /api/writing/submissions/:id | yes | One essay + full feedback |
| POST | /api/writing/submissions/:id/retry | yes | Re-run a failed AI evaluation |
| GET | /api/writing/stats | yes | Writing statistics |
| GET | /api/speaking/prompts | yes | Speaking prompts |
| POST | /api/speaking/submit | yes | Upload audio + AI evaluation |
| GET | /api/speaking/history | yes | Speaking submission history |
| GET | /api/speaking/stats | yes | Speaking statistics |
| GET | /api/speaking/:id | yes | One speaking submission + feedback |
| GET | /api/dashboard | yes | Everything the dashboard page needs |
| GET | /api/admin/stats | admin | Platform-wide statistics |
| CRUD | /api/admin/reading/passages | admin | Manage reading passages + questions |
| CRUD | /api/admin/listening/tests | admin | Manage listening tests + questions |
| CRUD | /api/admin/vocabulary | admin | Manage vocabulary words |
| CRUD | /api/admin/writing/prompts | admin | Manage writing prompts |
| CRUD | /api/admin/speaking/prompts | admin | Manage speaking prompts |
| CRUD | /api/admin/students | admin | Manage student accounts |
