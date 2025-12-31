import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";

/* ================= ROUTE IMPORTS ================= */
import aiRoutes from "./routes/ai.js";
import candidateRoutes from "./routes/candidates.js";
import resumeRoutes from "./routes/resumes.js";
import interviewRoutes from "./routes/interviews.js";
import offerRoutes from "./routes/offers.js";
import emailRoutes from "./routes/emails.js";
import authRoutes from "./routes/auth.js";
import interviewerRoutes from "./routes/interviewers.js";


import adminRoutes from "./routes/admin.js";


dotenv.config();

const app = express();

/* ================= CORS CONFIG (🔥 MUST BE FIRST) ================= */

app.use(
  cors({
    origin: "http://localhost:3000", // React frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

/* ================= GLOBAL MIDDLEWARE ================= */

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Body limits (ONLY ONCE)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

/* ================= ROUTES ================= */

app.use("/api/ai", aiRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interviewers", interviewerRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

/* ================= HEALTH CHECK ================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "HR Portal Server is running",
    time: new Date().toISOString(),
  });
});

/* ================= MULTER ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("🚨 MULTER ERROR:", err.message);
    return res.status(400).json({
      error: "File upload error",
      message: err.message,
    });
  }
  next(err);
});

/* ================= GENERIC ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import multer from 'multer';
// import path from 'path';

// import aiRoutes from './routes/ai.js';
// import candidateRoutes from './routes/candidates.js';
// import resumeRoutes from './routes/resumes.js';
// import interviewRoutes from './routes/interviews.js';
// import offerRoutes from './routes/offers.js';
// import emailRoutes from './routes/emails.js';
// import authRoutes from "./routes/auth.js";

// import interviewerRoutes from './routes/interviewers.js';

// dotenv.config();

// const app = express();

// /* ================= GLOBAL MIDDLEWARE ================= */

// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// // ✅ IMPORTANT: set payload limits ONLY ONCE
// app.use(express.json({ limit: '25mb' }));
// app.use(express.urlencoded({ limit: '25mb', extended: true }));

// /* ================= ROUTES ================= */

// app.use('/api/ai', aiRoutes);
// app.use('/api/candidates', candidateRoutes);
// app.use('/api/resumes', resumeRoutes);
// app.use('/api/interviews', interviewRoutes);
// app.use('/api/offers', offerRoutes);
// app.use('/api/emails', emailRoutes);
// //auth details 
// app.use("/api/auth", authRoutes);

// app.use('/api/interviewers', interviewerRoutes);
// /* ================= HEALTH CHECK ================= */

// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'HR Portal Server is running',
//     time: new Date().toISOString(),
//   });
// });

// /* ================= MULTER ERROR HANDLER ================= */

// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     console.error('🚨 MULTER ERROR:', err.message);
//     return res.status(400).json({
//       error: 'File upload error',
//       message: err.message,
//     });
//   }
//   next(err);
// });

// /* ================= GENERIC ERROR HANDLER ================= */

// app.use((err, req, res, next) => {
//   console.error('🔥 SERVER ERROR:', err.stack);
//   res.status(500).json({
//     error: 'Internal Server Error',
//     message: err.message,
//   });
// });

// /* ================= SERVER START ================= */

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import multer from 'multer';

// import aiRoutes from './routes/ai.js';
// import candidateRoutes from './routes/candidates.js';
// import resumeRoutes from './routes/resumes.js';
// import interviewRoutes from './routes/interviews.js';
// import offerRoutes from './routes/offers.js';
// import emailRoutes from './routes/emails.js';

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.json({ limit: '25mb' }));
// app.use(express.urlencoded({ extended: true }));

// app.use('/uploads', express.static('uploads'));

// app.use('/api/ai', aiRoutes);
// app.use('/api/candidates', candidateRoutes);
// app.use('/api/resumes', resumeRoutes);
// app.use('/api/interviews', interviewRoutes);
// app.use('/api/offers', offerRoutes);
// app.use('/api/emails', emailRoutes);

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'HR Portal Server is running' });
// });

// /* ================= MULTER ERROR HANDLER (CRITICAL) ================= */
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     console.error('🚨 MULTER ERROR ON:', req.originalUrl);
//     return res.status(400).json({
//       error: 'MulterError',
//       field: err.field,
//       message: err.message,
//     });
//   }
//   next(err);
// });

// /* ================= GENERIC ERROR ================= */
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: 'Internal Server Error',
//     message: err.message,
//   });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`✅ Server running on port ${PORT}`)
// );

// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';

// // import aiRoutes from './routes/ai.js';
// // import candidateRoutes from './routes/candidates.js';
// // import resumeRoutes from './routes/resumes.js';
// // import interviewRoutes from './routes/interviews.js';
// // import offerRoutes from './routes/offers.js';
// // import emailRoutes from './routes/emails.js';

// // dotenv.config();

// // const app = express();

// // app.use(cors());
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // app.use('/uploads', express.static('uploads'));

// // app.use('/api/ai', aiRoutes);
// // app.use('/api/candidates', candidateRoutes);
// // app.use('/api/resumes', resumeRoutes);
// // app.use('/api/interviews', interviewRoutes);
// // app.use('/api/offers', offerRoutes);
// // app.use('/api/emails', emailRoutes);

// // // Health check
// // app.get('/api/health', (req, res) => {
// //   res.json({ status: 'HR Portal Server is running' });
// // });

// // // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(500).json({ error: 'Internal Server Error', message: err.message });
// // });

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// // // const express = require('express');
// // // const cors = require('cors');
// // // require('dotenv').config();

// // // const app = express();

// // // // Middleware
// // // app.use(cors());
// // // app.use(express.json({ limit: '1000mb' }));
// // // app.use(express.urlencoded({ limit: '1000mb', extended: true }));

// // // // Routes
// // // app.use('/api/candidates', require('./routes/candidates'));
// // // app.use('/api/resumes', require('./routes/resumes'));
// // // app.use('/api/interviews', require('./routes/interviews'));
// // // app.use('/api/emails', require('./routes/emails'));
// // // app.use('/api/offers', require('./routes/offers'));
// // // app.use('/api/ai', require('./routes/ai'));

// // // // Health check
// // // app.get('/api/health', (req, res) => {
// // //   res.json({ status: 'HR Portal Server is running' });
// // // });

// // // // Error handling middleware
// // // app.use((err, req, res, next) => {
// // //   console.error(err.stack);
// // //   res.status(500).json({ error: 'Internal Server Error', message: err.message });
// // // });

// // // const PORT = process.env.PORT || 5000;
// // // app.listen(PORT, () => {
// // //   console.log(`HR Portal Server running on port ${PORT}`);
// // // });

// // // module.exports = app;
