
import express from 'express';
import {
  createInterview,
  getAllInterviews,
  getByCandidate,
  updateInterview,
  updateInterviewStatus
} from '../controllers/interviewController.js';

const router = express.Router();

// Create interview (auto-updates candidate status)
router.post('/', createInterview);

// List all interviews
router.get('/', getAllInterviews);

// Get interviews by candidate
router.get('/candidate/:id', getByCandidate);

// Update interview details (no status sync here)
router.put('/:id', updateInterview);

// Update interview status (syncs candidate status)
router.put('/:id/status', updateInterviewStatus);

export default router;
