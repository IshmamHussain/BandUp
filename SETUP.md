# SETUP — get the project running in 5 steps

This project is already configured for local development. If you use XAMPP
(root user, no password), you shouldn't need to edit any config at all.

---

## What you need first

- **Node.js 18 or newer** — check with `node --version`
- **MySQL or MariaDB running** — easiest via XAMPP (start the "MySQL" module)

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/IshmamHussain/BandUp.git
cd BandUp
```

Everything lives inside one folder — don't move
`client`, `server`, or `database` out of it; they belong together.

## Step 2 — Create the database

Open a terminal **inside the `ielts-platform` folder** and run:

```bash
mysql -u root < database/setup.sql
```

If your MySQL root user has a password, add `-p`:

```bash
mysql -u root -p < database/setup.sql
```

**No terminal MySQL?** Open **phpMyAdmin** → Import tab → choose
`database/setup.sql` → Go. Same result.

This creates the `ielts_prep` database and fills it with the demo content
(reading passages, questions, vocabulary, writing prompts).

## Step 3 — Create the config

Copy `server/.env.example` to `server/.env`, then:

- put your MySQL password after `DB_PASSWORD=` (leave it empty for XAMPP's
  default root user),
- generate your **own** `JWT_SECRET` (never reuse one from a doc, chat or
  commit; anyone who knows it can forge an admin login):
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
  from your Supabase project (Settings → API). Login and registration go
  through Supabase Auth.

## Step 4 — Install and run

```bash
cd server
npm install
npm run dev
```

You should see:

```
Database connected: ielts_prep@localhost
IELTS Prep API running at http://localhost:5000 (development)
```

## Step 5 — Open it

Go to **http://localhost:5000** in your browser. Create an account, and
you're in. The AI essay grading runs in a clearly-labelled demo mode until
you add a Gemini API key (`GEMINI_API_KEY`) to `server/.env` (optional).

## Step 6 — Create an admin account

There is **no built-in admin and no default password**. Every admin is a
normal Supabase account that you promote:

1. Register in the app with the admin's email and verify it from the inbox.
2. From `server/`, run:
   ```bash
   npm run admin -- promote you@example.com
   ```
3. Log in with "Admin Sign In".

Other commands: `npm run admin -- list`, `demote <email>`,
`revoke <email>` (sign one user out everywhere) and `revoke-all`.

---

## If something goes wrong

**"Could not connect to MySQL"** → MySQL isn't running (start it in XAMPP),
or the password in `server/.env` doesn't match your MySQL root password.

**"Missing required environment variables"** → the `server/.env` file is
missing or a line was deleted. Copy `server/.env.example` to `server/.env`
and try again. Note: `DB_PASSWORD=` may be empty, but the line must exist.

**`mysql` command not recognised (Windows)** → use phpMyAdmin for Step 2
instead, or add MySQL's `bin` folder to your PATH.

**Port 5000 already in use** → change `PORT=5000` in `server/.env` to e.g.
`PORT=5050`, then open http://localhost:5050 instead.

---

## For your teammates (Git)

`node_modules/` and `.env` are excluded from Git on purpose. After cloning,
each person runs `npm install` and copies `.env.example` to `.env`
themselves. Never push `.env` to GitHub — it holds your keys.
