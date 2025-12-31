
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

// import express from 'express';
// import {
//   createInterview,
//   getByCandidate,
//   updateInterview,
//   getAllInterviews,
//   updateInterviewStatus
// } from '../controllers/interviewController.js';

// const router = express.Router();

// router.post('/', createInterview);
// router.get('/', getAllInterviews);
// router.get('/candidate/:id', getByCandidate);
// router.put('/:id', updateInterview);

// router.put('/:id/status', updateInterviewStatus);


// export default router;

// // import express from 'express';
// // import {
// //   createInterview,
// //   getByCandidate,
// //   updateInterview,
// //   getAllInterviews,
// //   getInterviewers,
// //   createInterviewer,
// //   deleteInterviewer,
// // } from '../controllers/interviewController.js';

// // const router = express.Router();

// // router.post('/', createInterview);
// // router.get('/candidate/:id', getByCandidate);
// // router.put('/:id', updateInterview);
// // router.get('/', getAllInterviews);

// // router.get('/', getInterviewers);
// // router.post('/', createInterviewer);
// // router.delete('/:id', deleteInterviewer);


// // export default router;
