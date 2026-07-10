// Route definitions. Thin by design: routes map URLs to controllers and
// attach middleware. All logic lives in controllers and models.
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as reading from '../controllers/readingController.js';
import * as listening from '../controllers/listeningController.js';
import * as vocabulary from '../controllers/vocabularyController.js';
import * as writing from '../controllers/writingController.js';
import * as dashboard from '../controllers/dashboardController.js';

export const apiRouter = Router();

// --- Auth (public) ---
apiRouter.post('/auth/register', auth.register);
apiRouter.post('/auth/login', auth.login);
apiRouter.post('/auth/logout', auth.logout);

// --- Auth (protected) ---
apiRouter.get('/auth/me', requireAuth, auth.me);
apiRouter.patch('/auth/goals', requireAuth, auth.updateGoals);

// --- Reading ---
apiRouter.get('/reading/passages', requireAuth, reading.listPassages);
apiRouter.get('/reading/passages/:id', requireAuth, reading.getPassage);
apiRouter.post('/reading/passages/:id/submit', requireAuth, reading.submitAnswers);
apiRouter.post('/reading/passages/:id/bookmark', requireAuth, reading.toggleBookmark);

// --- Listening ---
apiRouter.get('/listening/tests', requireAuth, listening.listTests);
apiRouter.get('/listening/tests/:id', requireAuth, listening.getTest);
apiRouter.post('/listening/tests/:id/submit', requireAuth, listening.submitAnswers);

// --- Vocabulary ---
apiRouter.get('/vocabulary', requireAuth, vocabulary.listWords);
apiRouter.get('/vocabulary/categories', requireAuth, vocabulary.listCategories);
apiRouter.patch('/vocabulary/:id/status', requireAuth, vocabulary.setStatus);
apiRouter.post('/vocabulary/:id/bookmark', requireAuth, vocabulary.toggleBookmark);

// --- Writing ---
apiRouter.get('/writing/prompts', requireAuth, writing.listPrompts);
apiRouter.post('/writing/submit', requireAuth, writing.submitEssay);
apiRouter.get('/writing/submissions', requireAuth, writing.listSubmissions);
apiRouter.get('/writing/submissions/:id', requireAuth, writing.getSubmission);
apiRouter.get('/writing/stats', requireAuth, writing.getWritingStats);

// --- Dashboard ---
apiRouter.get('/dashboard', requireAuth, dashboard.getDashboard);
