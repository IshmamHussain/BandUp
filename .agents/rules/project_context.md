# BandUp IELTS Platform — Project Memory & Deployment Status

This file persists memory and context across AI assistant sessions.

## 📌 Project Overview
- **Project Name**: BandUp (AI-powered IELTS Preparation Platform)
- **Repository**: [https://github.com/IshmamHussain/BandUp](https://github.com/IshmamHussain/BandUp) (Branch: `master`)
- **Stack**: Node.js (v18+), Express (ES Modules), Plain JS/HTML/CSS Frontend served statically, MySQL (via mysql2/promise) with prepared queries, Gemini AI API for evaluation, Resend for email verification.

## 🚀 Accomplished in Current Session
1. **Frontend Pushed to GitHub**: Added and committed all client pages, admin panels, gauge scripts, styles, audio assets, and UI components that were previously untracked locally.
2. **Root Deployment Config**: Created root `package.json` with `"start": "npm start --prefix server"` and `"build": "npm install --prefix server"` for zero-configuration PaaS deployment.
3. **Cloud Database SSL**: Updated `server/src/config/db.js` and `server/src/config/env.js` to automatically enable `ssl: { rejectUnauthorized: false }` for cloud MySQL hosts (e.g. Aiven, TiDB, Clever Cloud).
4. **Speaking Audio Uploads**: Made audio upload path relative to `fileURLToPath(import.meta.url)` in `server/src/routes/speakingRoutes.js` and ensured automatic directory creation.
5. **Git Push Protection Cleaned**: Removed hardcoded database credentials from `server/scripts/seed_aiven.js` to use environment variables safely.

## 🔐 Environment Variables for Cloud Deployment (Render / Railway)
- `NODE_ENV`: `production`
- `DB_HOST`: Hostname of cloud database (e.g., Aiven)
- `DB_PORT`: Database port (e.g. `12113`)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (e.g., `defaultdb` or `ielts_prep`)
- `DB_SSL`: `true`
- `JWT_SECRET`: `5df6aee4003c66b78815db50496864f2534121f8b56c194fb1c024b5dccc8541`
- `JWT_EXPIRES_IN`: `7d`
- `GEMINI_API_KEY`: Google Gemini API Key
- `AI_MODEL`: `gemini-2.0-flash`
- `RESEND_API_KEY`: Resend API Key for email verification
- `CLIENT_ORIGIN`: Live URL of the deployed app (e.g., `https://bandup.onrender.com`)

## 📋 Next Steps for Tomorrow
1. Deploy the service to Render or Railway.
2. Verify live database connectivity and user registration/login.
3. Test speaking audio recording and AI writing evaluation on the live deployment.
