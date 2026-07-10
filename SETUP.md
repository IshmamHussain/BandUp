# SETUP — get the project running in 5 steps

This project is already configured for local development. If you use XAMPP
(root user, no password), you shouldn't need to edit any config at all.

---

## What you need first

- **Node.js 18 or newer** — check with `node --version`
- **MySQL or MariaDB running** — easiest via XAMPP (start the "MySQL" module)

---

## Step 1 — Unzip

Unzip `ielts-platform-full.zip` into your projects folder. You'll get one
folder called `ielts-platform`. Everything lives inside it — don't move
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

## Step 3 — Check the config (usually nothing to change)

The file `server/.env` is already filled in for XAMPP defaults
(user `root`, empty password, a ready-made security key).

Only edit it if your MySQL root user **has** a password — in that case open
`server/.env` and put the password after `DB_PASSWORD=`.

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
you add an Anthropic API key to `server/.env` (optional).

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
