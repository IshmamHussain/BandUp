# IELTS Prep Platform

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
│       ├── services/        # aiService.js (Gemini API), emailService.js
│       └── utils/           # helpers.js, validate.js
└── database/
    ├── setup.sql            # Runs schema + seed in one command
    ├── schema.sql           # Creates the ielts_prep database + tables
    ├── schema_speaking.sql  # Speaking module tables
    └── seeds/seed.sql       # Demo content (passages, questions, vocab, prompts, listening)
```

## Setup (each team member)

New here? Follow **SETUP.md** for a step-by-step walkthrough. Short version:

1. **Install** Node.js 18+ and MySQL 8 (or MariaDB 10.6+). XAMPP is the easiest way to get MySQL.

2. **Create the database** in one command (from the project root):
   ```bash
   mysql -u root < database/setup.sql
   ```
   (Add `-p` if your root user has a password. Or import `database/setup.sql` via phpMyAdmin.)

3. **Config is pre-filled.** `server/.env` already works for XAMPP defaults (root user, empty password, a generated JWT secret). Only edit `DB_PASSWORD` if your MySQL root user has a password.

4. **Run:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Open http://localhost:5000

## API overview

All responses share one shape: `{ "success": bool, "data": ..., "error": null | "message" }`.
Auth uses a JWT in an HTTP-only cookie; the browser never handles tokens in JS.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | - | Create account (sets cookie) |
| POST | /api/auth/login | - | Sign in (sets cookie) |
| POST | /api/auth/logout | - | Clear cookie |
| GET | /api/auth/verify | - | Verify email link |
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

## Security decisions (know these for the viva)

- **SQL injection:** every query uses `pool.execute()` prepared statements. No string concatenation of user input into SQL, anywhere.
- **Password storage:** bcrypt, 12 rounds. Plain passwords never touch the database or logs.
- **Sessions:** JWT in an `httpOnly`, `sameSite=strict` cookie. XSS cannot steal it; CSRF is blocked by SameSite.
- **Answer keys:** correct answers and explanations are only sent to the client *after* submission; scoring happens on the server.
- **Object ownership:** queries for user-owned rows (essays, attempts) always include `user_id` in the WHERE clause, so IDs cannot be guessed.
- **Enumeration:** login returns the same error for wrong email and wrong password.
- **Input:** all bodies validated; JSON body limited to 100kb; essay length capped.

## Git workflow

- `main` is protected. Work on feature branches: `feature/reading-ui`, `fix/login-validation`.
- Open a PR, one teammate reviews, then merge. No direct pushes to main.
