// Dashboard controller. One endpoint returns everything the dashboard
// page needs, so the page loads with a single API call.
import * as userModel from '../models/userModel.js';
import * as progressModel from '../models/progressModel.js';
import { ok, asyncHandler } from '../utils/helpers.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [user, weekly, modules, recent] = await Promise.all([
    userModel.findById(req.user.id),
    progressModel.weeklyStudyMinutes(req.user.id),
    progressModel.moduleAccuracy(req.user.id),
    progressModel.recentActivity(req.user.id),
  ]);

  // Fill the last 7 days so the chart always has 7 bars, even with no data.
  const byDate = new Map(
    weekly.map((row) => {
      const d = row.progress_date instanceof Date
        ? row.progress_date.toISOString().slice(0, 10)
        : String(row.progress_date).slice(0, 10);
      return [d, Number(row.minutes)];
    })
  );
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    last7Days.push({ date: key, minutes: byDate.get(key) || 0 });
  }

  const examCountdownDays = user.exam_date
    ? Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
    : null;

  return ok(res, {
    user: {
      name: user.name,
      targetBand: user.target_band,
      currentBandEstimate: user.current_band_estimate,
      studyStreak: user.study_streak,
      examDate: user.exam_date,
      examCountdownDays,
    },
    weeklyStudy: last7Days,
    moduleAccuracy: modules,
    recentActivity: recent,
  });
});

import { generateActionPlan, actionPlanStream } from '../services/aiService.js';

// In-memory cache for action plans: userId -> { data, timestamp, totalAttempts }
const planCache = new Map();

export const getActionPlan = asyncHandler(async (req, res) => {
  const [user, modules] = await Promise.all([
    userModel.findById(req.user.id),
    progressModel.moduleAccuracy(req.user.id),
  ]);

  const dashboardData = {
    targetBand: user?.target_band || '7.5',
    currentBandEstimate: user?.current_band_estimate || null,
    moduleAccuracy: modules || [],
  };

  const totalAttempts = (modules || []).reduce((sum, m) => sum + (m.attempted || 0), 0);
  const cacheKey = req.user.id;
  const isRefresh = req.query.refresh === 'true';

  // Return cached action plan if valid (10 minutes and same attempt count)
  if (!isRefresh && planCache.has(cacheKey)) {
    const cached = planCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 10 * 60 * 1000 && cached.totalAttempts === totalAttempts) {
      if (req.headers.accept?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        if (res.flushHeaders) res.flushHeaders();
        const text = `### 🎯 Overall Action Plan\n${cached.data.overall}\n\n### 📖 Reading\n${cached.data.reading}\n\n### 🎧 Listening\n${cached.data.listening}\n\n### ✍️ Writing\n${cached.data.writing}\n\n### 🗣️ Speaking\n${cached.data.speaking}\n\n`;
        res.write(`data: ${JSON.stringify({ text, plan: cached.data })}\n\n`);
        if (res.flush) res.flush();
        res.write('data: [DONE]\n\n');
        if (res.flush) res.flush();
        return res.end();
      }
      return ok(res, cached.data);
    }
  }

  // Generate structured action plan
  const planData = await generateActionPlan(dashboardData);
  planCache.set(cacheKey, {
    data: planData,
    timestamp: Date.now(),
    totalAttempts,
  });

  if (req.headers.accept?.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();
    const text = `### 🎯 Overall Action Plan\n${planData.overall}\n\n### 📖 Reading\n${planData.reading}\n\n### 🎧 Listening\n${planData.listening}\n\n### ✍️ Writing\n${planData.writing}\n\n### 🗣️ Speaking\n${planData.speaking}\n\n`;
    res.write(`data: ${JSON.stringify({ text, plan: planData })}\n\n`);
    if (res.flush) res.flush();
    res.write('data: [DONE]\n\n');
    if (res.flush) res.flush();
    return res.end();
  }

  return ok(res, planData);
});
