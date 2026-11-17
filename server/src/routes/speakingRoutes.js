import express from 'express';
import multer from 'multer';
import * as speakingController from '../controllers/speakingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Use memory storage — the buffer is uploaded to Supabase Storage,
// never written to Render's ephemeral disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

router.use(requireAuth);

router.get('/prompts', speakingController.getPrompts);
router.post('/submit', upload.single('audio'), speakingController.submitAudio);
router.get('/history', speakingController.getHistory);
router.get('/stats', speakingController.getStats);
router.get('/:id', speakingController.getSubmission);
router.get('/:id/audio', speakingController.getAudioUrl);
router.post('/:id/retry', speakingController.retryEvaluation);
router.delete('/:id', speakingController.deleteSubmission);

export default router;
