import express from 'express';
import multer from 'multer';
import path from 'path';
import * as speakingController from '../controllers/speakingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), '../client/media/audio/submissions/'));
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

export default router;
