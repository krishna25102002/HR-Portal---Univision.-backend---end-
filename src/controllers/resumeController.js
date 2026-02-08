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
  try {
    const { id: hrId, name: hrName } = req.user;
    const { candidate_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Resume file required" });
    }

    // 1️⃣ Parse resume using AI
    const parsed = await parseResume(req.file.path);

    // 2️⃣ Update candidate data
    await pool.query(
      `UPDATE candidates SET
        custom_first_name=?,
        custom_last_name=?,
        email_id=?,
        phone_number=?,
        skills=?,
        education=?,
        updated_by=?,
        updated_by_name=?
       WHERE id=?`,
      [
        parsed.first_name || null,
    parsed.last_name || null,
    parsed.email_id || null,
    parsed.phone_number || null,
    Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills,
    Array.isArray(parsed.education) ? parsed.education.join(" ") : parsed.education,
    hrId,
    hrName,
    candidate_id
      ]
    );

    // 3️⃣ Save resume version (THIS IS WHAT WAS MISSING)
    await pool.query(
      `INSERT INTO resume_versions
       (candidate_id, resume_file_path, updated_by, updated_by_name)
       VALUES (?, ?, ?, ?)`,
      [
        candidate_id,
        req.file.path,
        hrId,
        hrName
      ]
    );

    res.json({
      message: "Resume uploaded, parsed, and saved successfully",
      parsed
    });

  } catch (err) {
    console.error("Upload resume error:", err);
    res.status(500).json({ error: "Resume upload failed" });
  }
};

// export const uploadResume = async (req, res) => {
//   try {
//     const hrId = req.user.id;
//     const hrName = req.user.name;
//     const candidateId = req.body.candidate_id;

//     if (!req.file) {
//       return res.status(400).json({ error: "Resume file required" });
//     }

//     // 🔍 Parse resume (KEEP YOUR EXISTING LOGIC)
//     // const parsed = await parseResume(req.file.path);
//       fd.append("candidate_id", candidateId);
//       const res = await api.post("/resumes/upload", fd);

//     // ✅ Update candidate fields
//     await pool.query(
//       `UPDATE candidates SET
//         custom_first_name=?,
//         custom_last_name=?,
//         email_id=?,
//         phone_number=?,
//         skills=?,
//         education=?,
//         updated_by=?,
//         updated_by_name=?
//       WHERE id=?`,
//       [
//         parsed.firstName,
//         parsed.lastName || null,
//         parsed.email || null,
//         parsed.phone || null,
//         parsed.skills || null,
//         parsed.education || null,
//         hrId,
//         hrName,
//         candidateId,
//       ]
//     );

//     // ✅ SAVE RESUME VERSION (NEW)
//     await pool.query(
//       `INSERT INTO resume_versions
//        (candidate_id, resume_file_path, updated_by, updated_by_name)
//        VALUES (?, ?, ?, ?)`,
//       [
//         candidateId,
//         req.file.path,
//         hrId,
//         hrName
//       ]
//     );
//       console.log("Resume saved for candidate:", candidateId);

//     res.json({
//       message: "Resume uploaded & saved successfully",
//       parsed
//     });

//   } catch (err) {
//     console.error("Resume upload error:", err);
//     res.status(500).json({ error: "Resume upload failed" });
//   }
// };

// export const uploadResume = async (req, res) => {
//   const parsed = await parseResume(req.file.path);

//   await pool.query(
//     `UPDATE candidates SET
//       custom_first_name=?,
//       custom_last_name=?,
//       email_id=?,
//       phone_number=?,
//       skills=?,
//       education=?
//      WHERE id=?`,
//     [
//       parsed.firstName,
//       parsed.lastName || null,
//       parsed.email || null,
//       parsed.phone || null,
//       parsed.skills || null,
//       parsed.education || null,
//       req.body.candidate_id,
//     ]
//   );
//    res.json(parsed);
// };

/**
 * ===============================
 * GET RESUMES BY CANDIDATE
 * ===============================
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
export const getResumeByCandidate = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        resume_file_path,
        updated_by_name,
        created_at
       FROM resume_versions
       WHERE candidate_id = ?
       ORDER BY created_at DESC`,
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
export const getResume = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM resume_versions WHERE id = ?',
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

/**
 * ===============================
 * GET ALL RESUME UPDATES (for Profile page)
 * ===============================
 */
export const getAllResumeUpdates = async (req, res) => {
  try {
    const hrId = req.user.id; // 🔥 logged-in HR

    const [rows] = await pool.query(
      `
      SELECT
        rv.id,
        rv.candidate_id,
        rv.resume_file_path,
        rv.updated_by_name,
        rv.created_at,

        CONCAT(
          COALESCE(c.custom_first_name, ''),
          ' ',
          COALESCE(c.custom_last_name, '')
        ) AS candidate_name,

        NULL AS candidate_role

      FROM resume_versions rv
      JOIN candidates c ON c.id = rv.candidate_id
      WHERE rv.updated_by = ?          -- 🔥 FILTER BY HR
      ORDER BY rv.created_at DESC
      `,
      [hrId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getAllResumeUpdates error:", err);
    res.status(500).json({ error: "Failed to fetch resume updates" });
  }
};

// export const getAllResumeUpdates = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `
//       SELECT
//         rv.id,
//         rv.candidate_id,
//         rv.resume_file_path,
//         rv.updated_by_name,
//         rv.created_at,
//         c.custom_first_name AS first_name,
//         c.custom_last_name AS last_name
//       FROM resume_versions rv
//       JOIN candidates c ON c.id = rv.candidate_id
//       ORDER BY rv.created_at DESC
//       `
//     );

//     res.json(rows);
//   } catch (err) {
//     console.error("getAllResumeUpdates error:", err);
//     res.status(500).json({ error: "Failed to fetch resume updates" });
//   }
// };


/**
 * ===============================
 * DOWNLOAD RESUME FILE
 * ===============================
 */
export const downloadResume = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT resume_file_path FROM resume_versions WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const filePath = rows[0].resume_file_path;

    res.download(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Failed to download resume" });
      }
    });
  } catch (err) {
    console.error("downloadResume error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
