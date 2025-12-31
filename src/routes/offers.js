import express from 'express';
import {
  createOffer,
  getOffer,
  getOffersByCandidate,
  updateOffer,
  respondToOffer,
} from '../controllers/offerController.js';

const router = express.Router();

router.post('/', createOffer);
router.get('/:id', getOffer);
router.get('/candidate/:candidateId', getOffersByCandidate);
router.put('/:id', updateOffer);
router.post('/:id/respond', respondToOffer);

export default router;
