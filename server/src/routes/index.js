// Route definitions. Thin by design: routes map URLs to controllers and
// attach middleware. All logic lives in controllers and models.
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as reading from '../controllers/readingController.js';
import * as listening from '../controllers/listeningController.js';
import * as vocabulary from '../controllers/vocabularyController.js';
import * as writing from '../controllers/writingController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as admin from '../controllers/adminController.js';
import speakingRoutes from './speakingRoutes.js';
import * as speaking from '../controllers/speakingController.js';

export const apiRouter = Router();

// --- Auth (public) ---
apiRouter.post('/auth/register', auth.register);
apiRouter.post('/auth/login', auth.login);
apiRouter.post('/auth/logout', auth.logout);
apiRouter.get('/auth/verify', auth.verifyEmail);

// --- Auth (protected) ---
apiRouter.get('/auth/me', requireAuth, auth.me);
apiRouter.patch('/auth/goals', requireAuth, auth.updateGoals);

// --- Reading ---
apiRouter.get('/reading/tests', requireAuth, reading.listTests);
apiRouter.get('/reading/tests/:id', requireAuth, reading.getTest);
apiRouter.post('/reading/tests/:id/submit', requireAuth, reading.submitAnswers);
apiRouter.post('/reading/tests/:id/bookmark', requireAuth, reading.toggleBookmark);

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

// --- Speaking ---
apiRouter.use('/speaking', speakingRoutes);

// --- Dashboard ---
apiRouter.get('/dashboard', requireAuth, dashboard.getDashboard);

// --- Admin (all routes require auth + admin role) ---
apiRouter.get('/admin/stats',                          requireAuth, requireAdmin, admin.getStats);

apiRouter.get('/admin/reading/passages',               requireAuth, requireAdmin, admin.listPassages);
apiRouter.post('/admin/reading/passages',              requireAuth, requireAdmin, admin.createPassage);
apiRouter.put('/admin/reading/passages/:id',           requireAuth, requireAdmin, admin.updatePassage);
apiRouter.delete('/admin/reading/passages/:id',        requireAuth, requireAdmin, admin.deletePassage);
apiRouter.get('/admin/reading/passages/:id/questions', requireAuth, requireAdmin, admin.listPassageQuestions);
apiRouter.post('/admin/reading/passages/:id/questions',requireAuth, requireAdmin, admin.createPassageQuestion);
apiRouter.post('/admin/reading/passages/:id/generate-questions', requireAuth, requireAdmin, admin.generatePassageQuestions);
apiRouter.post('/admin/reading/passages/:id/questions/bulk',     requireAuth, requireAdmin, admin.bulkCreatePassageQuestions);

apiRouter.get('/admin/listening/tests',                requireAuth, requireAdmin, admin.listTests);
apiRouter.post('/admin/listening/tests',               requireAuth, requireAdmin, admin.createTest);
apiRouter.put('/admin/listening/tests/:id',            requireAuth, requireAdmin, admin.updateTest);
apiRouter.delete('/admin/listening/tests/:id',         requireAuth, requireAdmin, admin.deleteTest);
apiRouter.get('/admin/listening/tests/:id/questions',  requireAuth, requireAdmin, admin.listTestQuestions);
apiRouter.post('/admin/listening/tests/:id/questions', requireAuth, requireAdmin, admin.createTestQuestion);

apiRouter.put('/admin/questions/:id',                  requireAuth, requireAdmin, admin.updateQuestion);
apiRouter.delete('/admin/questions/:id',               requireAuth, requireAdmin, admin.deleteQuestion);

apiRouter.get('/admin/vocabulary',                     requireAuth, requireAdmin, admin.listVocabulary);
apiRouter.post('/admin/vocabulary',                    requireAuth, requireAdmin, admin.createWord);
apiRouter.put('/admin/vocabulary/:id',                 requireAuth, requireAdmin, admin.updateWord);
apiRouter.delete('/admin/vocabulary/:id',              requireAuth, requireAdmin, admin.deleteWord);

apiRouter.get('/admin/writing/prompts',                requireAuth, requireAdmin, admin.listPrompts);
apiRouter.post('/admin/writing/prompts',               requireAuth, requireAdmin, admin.createPrompt);
apiRouter.put('/admin/writing/prompts/:id',            requireAuth, requireAdmin, admin.updatePrompt);
apiRouter.delete('/admin/writing/prompts/:id',         requireAuth, requireAdmin, admin.deletePrompt);

apiRouter.get('/admin/speaking/prompts',               requireAuth, requireAdmin, admin.listSpeakingPrompts);
apiRouter.post('/admin/speaking/prompts',              requireAuth, requireAdmin, admin.createSpeakingPrompt);
apiRouter.put('/admin/speaking/prompts/:id',           requireAuth, requireAdmin, admin.updateSpeakingPrompt);
apiRouter.delete('/admin/speaking/prompts/:id',        requireAuth, requireAdmin, admin.deleteSpeakingPrompt);

apiRouter.get('/admin/students',                       requireAuth, requireAdmin, admin.listStudents);
apiRouter.put('/admin/students/:id',                   requireAuth, requireAdmin, admin.updateStudent);
apiRouter.delete('/admin/students/:id',                requireAuth, requireAdmin, admin.deleteStudent);
