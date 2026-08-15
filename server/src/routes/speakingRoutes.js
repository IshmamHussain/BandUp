import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as speakingController from '../controllers/speakingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../../client/media/audio/submissions');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.mimetype === 'audio/mp3' ? '.mp3' : '.webm';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

router.use(requireAuth);

router.get('/prompts', speakingController.getPrompts);
router.post('/submit', upload.single('audio'), speakingController.submitAudio);
router.get('/history', speakingController.getHistory);
router.get('/stats', speakingController.getStats);
router.get('/:id', speakingController.getSubmission);
router.post('/:id/retry', speakingController.retryEvaluation);
router.delete('/:id', speakingController.deleteSubmission);

export default router;
