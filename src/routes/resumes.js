import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/s3Upload.js";

import {
  uploadResume,
  getResumeByCandidate,
  getResume,
  getAllResumeUpdates,
  downloadResume,
} from "../controllers/resumeController.js";

const router = express.Router();

// ======================= ROUTES =======================

// Upload resume → directly to S3
router.post(
  "/upload",
  protect,
  upload.single("resume"),
  uploadResume
);

// Get all resume updates
router.get("/all-updates", protect, getAllResumeUpdates);

// Download resume (via S3 logic)
router.get("/download/:id", protect, downloadResume);

// Get resume by candidate
router.get("/candidate/:candidateId", protect, getResumeByCandidate);

// Get single resume (keep last)
router.get("/:id", protect, getResume);

export default router;
