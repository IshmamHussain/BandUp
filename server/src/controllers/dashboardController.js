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
