import pool from '../config/database.js';

/* ================= CREATE ================= */
export const createCandidate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hrId = req.user.id;
    const hrName = req.user.name;

    const {
      first_name,
      last_name,
      email_id,
      phone_number,
      skills,
      education,
      custom_current_employer,
      custom_overall_experience_years,
      custom_relevant_experience_years,
      custom_current_salary_lpa,
      custom_expected_salary_lpa,
      notice_period,
      position,
      status = "applied",
    } = req.body;

    // 🔴 Mandatory email check
    if (!email_id) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 🔍 DUPLICATE CHECK
    const [existing] = await pool.query(
      "SELECT id FROM candidates WHERE email_id = ?",
      [email_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "Candidate already exists with this email",
        candidateId: existing[0].id
      });
    }

    // ✅ INSERT
    const [result] = await pool.query(
      `INSERT INTO candidates (
        custom_first_name,
        custom_last_name,
        email_id,
        phone_number,
        skills,
        education,
        custom_current_employer,
        custom_overall_experience_years,
        custom_relevant_experience_years,
        custom_current_salary_lpa,
        custom_expected_salary_lpa,
        notice_period,
        position,
        status,
        updated_by,
        updated_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name || null,
        email_id,
        phone_number || null,
        skills || null,
        education || null,
        custom_current_employer || null,
        custom_overall_experience_years || null,
        custom_relevant_experience_years || null,
        custom_current_salary_lpa || null,
        custom_expected_salary_lpa || null,
        notice_period || null,
        position || null,
        status,
        hrId,
        hrName
      ]
    );

    res.status(201).json({
      message: "Candidate created successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error("Create candidate error:", err);

    // 🔐 DB unique fallback
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Candidate already exists with this email"
      });
    }

    res.status(500).json({ error: "Server error" });
  }
};

/* ================= LIST ================= */
export const getCandidates = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.custom_first_name AS first_name,
        c.custom_last_name AS last_name,
        c.email_id,
        c.phone_number,
        c.skills,
        c.status,
        c.position,
        c.created_at,
        COALESCE(u.name, 'Unknown') AS updated_by_name
      FROM candidates c
      LEFT JOIN users u ON c.updated_by = u.id
      ORDER BY c.created_at DESC
      LIMIT 5000
    `);

    res.json(rows);
  } catch (err) {
    console.error('getCandidates error:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

/* ================= DETAIL ================= */
export const getCandidateById = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
      id,
      custom_first_name AS first_name,
      custom_last_name AS last_name,
      email_id,
      phone_number,
      skills,
      education,
      custom_current_employer,
      custom_overall_experience_years,
      custom_relevant_experience_years,
      custom_current_salary_lpa,
      custom_expected_salary_lpa,
      notice_period,
      position,
      status,
      updated_by_name,
      updated_at
     FROM candidates
     WHERE id = ?`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  res.json(rows[0]);
};

/* ================= UPDATE ================= */
export const updateCandidate = async (req, res) => {
  try {
    const hrId = req.user.id;
    const hrName = req.user.name;

    const {
      first_name,
      last_name,
      email_id,
      phone_number,
      skills,
      education,
      custom_current_employer,
      custom_overall_experience_years,
      custom_relevant_experience_years,
      custom_current_salary_lpa,
      custom_expected_salary_lpa,
      notice_period,
      position,
      status
    } = req.body;

    await pool.query(
      `UPDATE candidates SET
        custom_first_name=?,
        custom_last_name=?,
        email_id=?,
        phone_number=?,
        skills=?,
        education=?,
        custom_current_employer=?,
        custom_overall_experience_years=?,
        custom_relevant_experience_years=?,
        custom_current_salary_lpa=?,
        custom_expected_salary_lpa=?,
        notice_period=?,
        position=?,
        status=?,
        updated_by=?,
        updated_by_name=?
      WHERE id=?`,
      [
        first_name,
        last_name || null,
        email_id,
        phone_number || null,
        skills || null,
        education || null,
        custom_current_employer || null,
        custom_overall_experience_years || null,
        custom_relevant_experience_years || null,
        custom_current_salary_lpa || null,
        custom_expected_salary_lpa || null,
        notice_period || null,
        position || null,
        status || "applied",
        hrId,
        hrName,
        req.params.id
      ],
    );

      // 🔥 Insert status log
        await pool.query(
          `
          INSERT INTO candidate_status_logs (candidate_id, hr_id, status)
          VALUES (?, ?, ?)
          `,
          [req.params.id, hrId, status || "applied"]
            );

    res.json({ success: true });
  } catch (err) {
    console.error("Update candidate error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Delete related logs first
    await pool.query(
      "DELETE FROM candidate_status_logs WHERE candidate_id = ?",
      [id]
    );

    // 2️⃣ Then delete candidate
    await pool.query(
      "DELETE FROM candidates WHERE id = ?",
      [id]
    );

    res.json({ message: "Candidate deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting candidate" });
  }
};
