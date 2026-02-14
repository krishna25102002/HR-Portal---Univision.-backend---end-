import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate
} from '../controllers/candidateController.js';

const router = express.Router();
const upload = multer();

router.post('/', protect, upload.none(), createCandidate);
router.get('/', protect, getCandidates);
router.get('/:id', protect, getCandidateById);
router.put('/:id', protect, upload.none(), updateCandidate);
router.delete('/:id', protect, deleteCandidate);

export default router;
