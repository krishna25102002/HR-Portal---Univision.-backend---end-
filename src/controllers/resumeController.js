import fs from 'fs';
import path from 'path';
import util from 'util';
import libre from 'libreoffice-convert';
import pool from '../config/database.js';
import { parseResume } from '../services/documentAI.js';

libre.convertAsync = util.promisify(libre.convert);

/**
 * ===============================
 * UPLOAD + PARSE RESUME
 * ===============================
 */
export const uploadResume = async (req, res) => {
  const parsed = await parseResume(req.file.path);

  await pool.query(
    `UPDATE candidates SET
      custom_first_name=?,
      custom_last_name=?,
      email_id=?,
      phone_number=?,
      skills=?,
      education=?
     WHERE id=?`,
    [
      parsed.firstName,
      parsed.lastName || null,
      parsed.email || null,
      parsed.phone || null,
      parsed.skills || null,
      parsed.education || null,
      req.body.candidate_id,
    ]
  );
   res.json(parsed);
};
// export const uploadResume = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No resume file uploaded' });
//     }

//     const { candidateId } = req.body;
//     const inputPath = req.file.path;
//     const ext = path.extname(inputPath).toLowerCase();

//     let pdfPath = inputPath;

//     /**
//      * DOCX → PDF
//      */
//     if (ext === '.docx' || ext === '.doc') {
//       const docBuffer = fs.readFileSync(inputPath);
//       const pdfBuffer = await libre.convertAsync(docBuffer, '.pdf', undefined);

//       pdfPath = inputPath.replace(ext, '.pdf');
//       fs.writeFileSync(pdfPath, pdfBuffer);
//     }

//     /**
//      * DOCUMENT AI
//      */
//     const extractedText = await parseResume(pdfPath);

//     /**
//      * SAVE METADATA
//      */
//     await pool.query(
//       `
//       INSERT INTO resumes (candidate_id, file_name, file_path)
//       VALUES (?, ?, ?)
//       `,
//       [
//         candidateId || null,
//         req.file.originalname,
//         pdfPath,
//       ]
//     );

//     /**
//      * CLEANUP
//      */
//     fs.unlinkSync(inputPath);
//     if (pdfPath !== inputPath) fs.unlinkSync(pdfPath);

//     res.json({
//       success: true,
//       message: 'Resume uploaded and parsed successfully',
//       extractedText,
//     });

//   } catch (error) {
//     console.error('Resume parsing error:', error);
//     res.status(500).json({
//       error: 'Resume parsing failed',
//       details: error.message,
//     });
//   }
// };

/**
 * ===============================
 * GET RESUMES BY CANDIDATE
 * ===============================
 */
export const getResumeByCandidate = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM resumes WHERE candidate_id = ?',
      [req.params.candidateId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ===============================
 * GET RESUME BY ID
 * ===============================
 */
export const getResume = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM resumes WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// import pool from '../config/database.js';

// /**
//  * Upload resume (store file info)
//  */
// export const uploadResume = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No resume file uploaded' });
//     }

//     const { candidateId } = req.body;

//     await pool.query(
//       `INSERT INTO resumes (candidate_id, file_name, file_path)
//        VALUES (?, ?, ?)`,
//       [candidateId, req.file.originalname, req.file.path]
//     );

//     res.json({ message: 'Resume uploaded successfully' });
//   } catch (error) {
//     console.error('Resume upload error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// /**
//  * Get resumes by candidate
//  */
// export const getResumeByCandidate = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       'SELECT * FROM resumes WHERE candidate_id = ?',
//       [req.params.candidateId]
//     );

//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// /**
//  * Get resume by ID
//  */
// export const getResume = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       'SELECT * FROM resumes WHERE id = ?',
//       [req.params.id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ error: 'Resume not found' });
//     }

//     res.json(rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
 

// // const pool = require('../config/database');
// // const extractResumeText = require('../utils/resumeExtractor');

// // // ===============================
// // // Upload & Parse Resume
// // // ===============================
// // exports.uploadResume = async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ error: 'No resume file uploaded' });
// //     }

// //     const candidateId = req.body.candidateId || null;
// //     const fileName = req.file.originalname;
// //     const fileBuffer = req.file.buffer;

// //     // 🔹 Extract resume text (PDF / DOCX / TXT)
// //     const resumeText = await extractResumeText(fileBuffer);

// //     // 🔹 Save to DB
// //     const connection = await pool.getConnection();
// //     const [result] = await connection.query(
// //       `
// //       INSERT INTO resumes (candidate_id, file_name, resume_text)
// //       VALUES (?, ?, ?)
// //       `,
// //       [candidateId, fileName, resumeText]
// //     );
// //     connection.release();

// //     res.status(201).json({
// //       success: true,
// //       id: result.insertId,
// //       message: 'Resume uploaded and parsed successfully',
// //       resumeText // send full text to AI flow
// //     });

// //   } catch (error) {
// //     console.error("Resume Upload Error:", error);
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // // ===============================
// // // Get Resume by Candidate ID
// // // ===============================
// // exports.getResumeByCandidate = async (req, res) => {
// //   try {
// //     const connection = await pool.getConnection();
// //     const [resumes] = await connection.query(
// //       'SELECT * FROM resumes WHERE candidate_id = ?',
// //       [req.params.candidateId]
// //     );
// //     connection.release();

// //     res.json(resumes);

// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // // ===============================
// // // Get Resume by Resume ID
// // // ===============================
// // exports.getResume = async (req, res) => {
// //   try {
// //     const connection = await pool.getConnection();
// //     const [resumes] = await connection.query(
// //       'SELECT * FROM resumes WHERE id = ?',
// //       [req.params.id]
// //     );
// //     connection.release();

// //     res.json(resumes[0]);

// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };
