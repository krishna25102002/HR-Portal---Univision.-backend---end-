import express from 'express';
import {
  sendInterviewEmail,
  // sendOfferEmail,
  // getEmailLogs,
} from '../controllers/emailController.js';

const router = express.Router();

router.post('/interview', sendInterviewEmail);
// router.post('/offer', sendOfferEmail);
// router.get('/logs', getEmailLogs);

export default router;
