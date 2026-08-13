# BandUp Deployment Reference

## 🚀 Quick Deployment Guide

### 1. Render.com (Recommended)
1. Log into **[dashboard.render.com](https://dashboard.render.com)** $\rightarrow$ Click **New +** $\rightarrow$ **Web Service**.
2. Connect repo: **`IshmamHussain/BandUp`**.
3. Settings:
   - **Environment**: `Node`
   - **Branch**: `master`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 2. Environment Variables Checklist
Add these in the **Environment** settings of your cloud platform:

| Variable | Recommended / Current Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DB_HOST` | `mysql-2b2eb065-ishmamhussain003-4f95.f.aivencloud.com` (or your cloud DB host) |
| `DB_PORT` | `12113` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(Your Aiven/Cloud DB password)* |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `5df6aee4003c66b78815db50496864f2534121f8b56c194fb1c024b5dccc8541` |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | *(Your Gemini API Key)* |
| `AI_MODEL` | `gemini-2.0-flash` |
| `RESEND_API_KEY` | *(Your Resend API Key)* |
| `CLIENT_ORIGIN` | `https://your-service-name.onrender.com` |

---

### 3. Verification & Live Testing
Once deployed:
1. Visit `https://your-service-name.onrender.com`.
2. Register a new user and verify email or login.
3. Test a Reading, Listening, Writing, and Speaking test submission.
