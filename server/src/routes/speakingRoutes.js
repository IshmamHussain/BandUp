import express from 'express';
import multer from 'multer';
import * as speakingController from '../controllers/speakingController.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizeAudioMime } from '../services/storageService.js';
import { HttpError } from '../utils/helpers.js';

const router = express.Router();

// Use memory storage — the buffer is uploaded to Supabase Storage,
// never written to Render's ephemeral disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25 MB max, one file
  // Only accept audio. Anything else never reaches Supabase Storage.
  fileFilter(req, file, cb) {
    if (normalizeAudioMime(file.mimetype)) return cb(null, true);
    return cb(new HttpError(400, 'Only audio recordings can be uploaded.'));
  },
});

// Turn multer's own errors (too large, unexpected field) into clean 4xx
// responses instead of generic 500s.
function uploadAudio(req, res, next) {
  upload.single('audio')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Recording is too large (25 MB max).'
        : 'Invalid upload. Please record your answer again.';
      return next(new HttpError(status, message));
    }
    return next(err);
  });
}

router.use(requireAuth);

router.get('/prompts', speakingController.getPrompts);
router.post('/submit', uploadAudio, speakingController.submitAudio);
router.get('/history', speakingController.getHistory);
router.get('/stats', speakingController.getStats);
router.get('/:id', speakingController.getSubmission);
router.get('/:id/audio', speakingController.getAudioUrl);
router.post('/:id/retry', speakingController.retryEvaluation);
router.delete('/:id', speakingController.deleteSubmission);

export default router;
