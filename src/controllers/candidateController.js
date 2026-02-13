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

// export const deleteCandidate = async (req, res) => {
//   await pool.query('DELETE FROM candidates WHERE id=?', [req.params.id]);
//   res.json({ success: true });
// };

// import pool from '../config/database.js';

// /* ================= CREATE ================= */
// export const createCandidate = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const hrId = req.user.id;
//     const hrName = req.user.name;

//     const {
//       first_name,
//       last_name,
//       email_id,
//       phone_number,
//       skills,
//       education,
//       custom_current_employer,
//       custom_overall_experience_years,
//       custom_relevant_experience_years,
//       custom_current_salary_lpa,
//       custom_expected_salary_lpa,
//       notice_period,
//       position,
//       status = "applied",
//     } = req.body;

//     const [result] = await pool.query(
//       `INSERT INTO candidates (
//         custom_first_name,
//         custom_last_name,
//         email_id,
//         phone_number,
//         skills,
//         education,
//         custom_current_employer,
//         custom_overall_experience_years,
//         custom_relevant_experience_years,
//         custom_current_salary_lpa,
//         custom_expected_salary_lpa,
//         notice_period,
//         position,
//         status,
//         updated_by,
//         updated_by_name
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         first_name,
//         last_name || null,
//         email_id || null,
//         phone_number || null,
//         skills || null,
//         education || null,
//         custom_current_employer || null,
//         custom_overall_experience_years || null,
//         custom_relevant_experience_years || null,
//         custom_current_salary_lpa || null,
//         custom_expected_salary_lpa || null,
//         notice_period || null,
//         position || null,
//         status,
//         hrId,
//         hrName,
//       ]
//     );

//     res.json({ id: result.insertId });
//   } catch (err) {
//     console.error("Create candidate error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= LIST ================= */
// export const getCandidates = async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT
//         c.id,
//         c.custom_first_name AS first_name,
//         c.custom_last_name AS last_name,
//         c.email_id,
//         c.phone_number,
//         c.skills,
//         c.status,
//         c.position,
//         c.created_at,
//         c.notice_period,
//         c.custom_current_employer,
//         c.custom_overall_experience_years,
//         c.custom_relevant_experience_years,
//         c.custom_current_salary_lpa,
//         COALESCE(u.name, 'Unknown') AS updated_by_name
//       FROM candidates c
//       LEFT JOIN users u ON c.updated_by = u.id
//       ORDER BY c.created_at DESC
//       LIMIT 5000
//     `);

//     res.json(rows);
//   } catch (err) {
//     console.error('getCandidates error:', err);
//     res.status(500).json({ error: 'Failed to fetch candidates' });
//   }
// };

// /* ================= DETAIL ================= */
// export const getCandidateById = async (req, res) => {
//   const [rows] = await pool.query(
//     `SELECT
//       id,
//       custom_first_name AS first_name,
//       custom_last_name AS last_name,
//       email_id,
//       phone_number,
//       skills,
//       education,
//       custom_current_employer,
//       custom_overall_experience_years,
//       custom_relevant_experience_years,
//       custom_current_salary_lpa,
//       custom_expected_salary_lpa,
//       notice_period,
//       position,
//       status,
//       updated_by_name,
//       updated_at
//      FROM candidates
//      WHERE id = ?`,
//     [req.params.id]
//   );

//   if (!rows.length) return res.status(404).json({ error: 'Not found' });
//   res.json(rows[0]);
// };

// /* ================= UPDATE (🔥 FIXED) ================= */
// export const updateCandidate = async (req, res) => {
//   try {
//     const hrId = req.user.id;
//     const hrName = req.user.name;

//     const {
//       first_name,
//       last_name,
//       email_id,
//       phone_number,
//       skills,
//       education,
//       custom_current_employer,
//       custom_overall_experience_years,
//       custom_relevant_experience_years,
//       custom_current_salary_lpa,
//       custom_expected_salary_lpa,
//       notice_period,
//       position,
//       status // OPTIONAL
//     } = req.body;

//     let query = `
//       UPDATE candidates SET
//         custom_first_name=?,
//         custom_last_name=?,
//         email_id=?,
//         phone_number=?,
//         skills=?,
//         education=?,
//         custom_current_employer=?,
//         custom_overall_experience_years=?,
//         custom_relevant_experience_years=?,
//         custom_current_salary_lpa=?,
//         custom_expected_salary_lpa=?,
//         notice_period=?,
//         position=?,
//         updated_by=?,
//         updated_by_name=?
//     `;

//     const params = [
//       first_name,
//       last_name || null,
//       email_id || null,
//       phone_number || null,
//       skills || null,
//       education || null,
//       custom_current_employer || null,
//       custom_overall_experience_years || null,
//       custom_relevant_experience_years || null,
//       custom_current_salary_lpa || null,
//       custom_expected_salary_lpa || null,
//       notice_period || null,
//       position || null,
//       hrId,
//       hrName
//     ];

//     // ✅ update status ONLY if explicitly sent
//     if (status) {
//       query += `, status=?`;
//       params.push(status);
//     }

//     query += ` WHERE id=?`;
//     params.push(req.params.id);

//     await pool.query(query, params);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Update candidate error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= DELETE ================= */
// export const deleteCandidate = async (req, res) => {
//   await pool.query('DELETE FROM candidates WHERE id=?', [req.params.id]);
//   res.json({ success: true });
// };

// // import pool from '../config/database.js';

// // /* ================= CREATE ================= */
// // // export const createCandidate = async (req, res) => {
// // //   try {
// // //     const {
// // //       first_name,
// // //       last_name,
// // //       email_id,
// // //       phone_number,
// // //       skills,
// // //       education,
// // //       custom_current_employer,
// // //       custom_overall_experience_years,
// // //       custom_relevant_experience_years,
// // //       custom_current_salary_lpa,
// // //       custom_expected_salary_lpa,
// // //       notice_period,
// // //       position,
// // //       status = 'applied',
// // //     } = req.body;

// // //     // if (!first_name) {
// // //     //   return res.status(400).json({ error: 'First name is mandatory' });
// // //     // }


// // //     const allowedPositions = [
// // //   'Embedded System',
// // //   'Embedded Software',
// // //   'Post Silicon Validation',
// // //   'VLSI',
// // //   'Others',
// // //   'HR',
// // //   'Business Unit'
// // // ];

// // // if (position && !allowedPositions.includes(position)) {
// // //   return res.status(400).json({ error: 'Invalid position' });
// // // }

// // //     const [result] = await pool.query(
// // //       `INSERT INTO candidates (
// // //         custom_first_name,
// // //         custom_last_name,
// // //         email_id,
// // //         phone_number,
// // //         skills,
// // //         education,
// // //         custom_current_employer,
// // //         custom_overall_experience_years,
// // //         custom_relevant_experience_years,
// // //         custom_current_salary_lpa,
// // //         custom_expected_salary_lpa,
// // //         notice_period,
// // //         position,
// // //         status
// // //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// // //       [
// // //         first_name,
// // //         last_name || null,
// // //         email_id || null,
// // //         phone_number || null,
// // //         skills || null,
// // //         education || null,
// // //         custom_current_employer || null,
// // //         custom_overall_experience_years || null,
// // //         custom_relevant_experience_years || null,
// // //         custom_current_salary_lpa || null,
// // //         custom_expected_salary_lpa || null,
// // //         notice_period || null,
// // //         position || null,
// // //         status,
// // //       ]
// // //     );

// // //     res.json({ id: result.insertId });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // };
// // // export const createCandidate = async (req, res) => {
// // //   try {
// // //     const hrId = req.user.id;
// // //     const hrName = req.user.name;

// // //     const {
// // //       first_name,
// // //       last_name,
// // //       email_id,
// // //       phone_number,
// // //       skills,
// // //       education,
// // //       custom_current_employer,
// // //       custom_overall_experience_years,
// // //       custom_relevant_experience_years,
// // //       custom_current_salary_lpa,
// // //       custom_expected_salary_lpa,
// // //       notice_period,
// // //       position,
// // //       status = "applied",
// // //     } = req.body;

// // //     const [result] = await pool.query(
// // //       `INSERT INTO candidates (
// // //         custom_first_name,
// // //         custom_last_name,
// // //         email_id,
// // //         phone_number,
// // //         skills,
// // //         education,
// // //         custom_current_employer,
// // //         custom_overall_experience_years,
// // //         custom_relevant_experience_years,
// // //         custom_current_salary_lpa,
// // //         custom_expected_salary_lpa,
// // //         notice_period,
// // //         position,
// // //         status,
// // //         updated_by,
// // //         updated_by_name
// // //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// // //       [
// // //         first_name,
// // //         last_name || null,
// // //         email_id || null,
// // //         phone_number || null,
// // //         skills || null,
// // //         education || null,
// // //         custom_current_employer || null,
// // //         custom_overall_experience_years || null,
// // //         custom_relevant_experience_years || null,
// // //         custom_current_salary_lpa || null,
// // //         custom_expected_salary_lpa || null,
// // //         notice_period || null,
// // //         position || null,
// // //         status,
// // //         hrId,
// // //         hrName,
// // //       ]
// // //     );

// // //     res.json({ id: result.insertId });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // };
// // export const createCandidate = async (req, res) => {
// //   try {
// //     if (!req.user) {
// //       return res.status(401).json({ error: "Unauthorized" });
// //     }

// //     const hrId = req.user.id;
// //     const hrName = req.user.name;

// //     const {
// //       first_name,
// //       last_name,
// //       email_id,
// //       phone_number,
// //       skills,
// //       education,
// //       custom_current_employer,
// //       custom_overall_experience_years,
// //       custom_relevant_experience_years,
// //       custom_current_salary_lpa,
// //       custom_expected_salary_lpa,
// //       notice_period,
// //       position,
// //       status = "applied",
// //     } = req.body;

// //     const [result] = await pool.query(
// //       `INSERT INTO candidates (
// //         custom_first_name,
// //         custom_last_name,
// //         email_id,
// //         phone_number,
// //         skills,
// //         education,
// //         custom_current_employer,
// //         custom_overall_experience_years,
// //         custom_relevant_experience_years,
// //         custom_current_salary_lpa,
// //         custom_expected_salary_lpa,
// //         notice_period,
// //         position,
// //         status,
// //         updated_by,
// //         updated_by_name
// //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// //       [
// //         first_name,
// //         last_name || null,
// //         email_id || null,
// //         phone_number || null,
// //         skills || null,
// //         education || null,
// //         custom_current_employer || null,
// //         custom_overall_experience_years || null,
// //         custom_relevant_experience_years || null,
// //         custom_current_salary_lpa || null,
// //         custom_expected_salary_lpa || null,
// //         notice_period || null,
// //         position || null,
// //         status,
// //         hrId,
// //         hrName,
// //       ]
// //     );

// //     res.json({ id: result.insertId });
// //   } catch (err) {
// //     console.error("Create candidate error:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // };

// // /* ================= LIST ================= */
// // //   const [rows] = await pool.query(`
// // //     SELECT
// // //       id,
// // //       custom_first_name AS first_name,
// // //       custom_last_name AS last_name,
// // //       email_id,
// // //       phone_number,
// // //       skills,
// // //       status,
// // //       position,
// // //       created_at,
// // //       notice_period,
// // //       custom_current_employer,
// // //       custom_overall_experience_years,
// // //       custom_relevant_experience_years,
// // //       custom_current_salary_lpa
// // //     FROM candidates
// // //     ORDER BY created_at DESC
// // //   `);

// // //   res.json(rows);
// // // };
// // export const getCandidates = async (req, res) => {
// //   try {
// //     const [rows] = await pool.query(`
// //       SELECT
// //         c.id,
// //         c.custom_first_name AS first_name,
// //         c.custom_last_name AS last_name,
// //         c.email_id,
// //         c.phone_number,
// //         c.skills,
// //         c.status,
// //         c.position,
// //         c.created_at,
// //         c.notice_period,
// //         c.custom_current_employer,
// //         c.custom_overall_experience_years,
// //         c.custom_relevant_experience_years,
// //         c.custom_current_salary_lpa,
// //         COALESCE(u.name, 'Unknown') AS updated_by_name
// //       FROM candidates c
// //       LEFT JOIN users u ON c.updated_by = u.id
// //       ORDER BY c.created_at DESC
// //       LIMIT 5000
// //     `);

// //     res.json(rows);
// //   } catch (err) {
// //     console.error('getCandidates error:', err);
// //     res.status(500).json({ error: 'Failed to fetch candidates' });
// //   }
// // };

// // /* ================= DETAIL ================= */
// // export const getCandidateById = async (req, res) => {
// //   const [rows] = await pool.query(`
// //     SELECT
// //       id,
// //       custom_first_name AS first_name,
// //       custom_last_name AS last_name,
// //       email_id,
// //       phone_number,
// //       skills,
// //       education,
// //       custom_current_employer,
// //       custom_overall_experience_years,
// //       custom_relevant_experience_years,
// //       custom_current_salary_lpa,
// //       custom_expected_salary_lpa,
// //       notice_period,
// //       position,
// //       status
// //     FROM candidates
// //     WHERE id = ?
// //   `, [req.params.id]);

// //   if (!rows.length) return res.status(404).json({ error: 'Not found' });

// //   res.json(rows[0]);
// // };

// // /* ================= UPDATE ================= */
// // // export const updateCandidate = async (req, res) => {
// // //   const { first_name } = req.body;
// // //   if (!first_name) {
// // //     return res.status(400).json({ error: 'First name is mandatory' });
// // //   }

// // //   await pool.query(
// // //     `UPDATE candidates SET
// // //       custom_first_name=?,
// // //       custom_last_name=?,
// // //       email_id=?,
// // //       phone_number=?,
// // //       skills=?,
// // //       education=?,
// // //       custom_current_employer=?,
// // //       custom_overall_experience_years=?,
// // //       custom_relevant_experience_years=?,
// // //       custom_current_salary_lpa=?,
// // //       custom_expected_salary_lpa=?,
// // //       notice_period=?,
// // //       position=?,
// // //       status=?
// // //     WHERE id=?`,
// // //     [
// // //       req.body.first_name,
// // //       req.body.last_name || null,
// // //       req.body.email_id || null,
// // //       req.body.phone_number || null,
// // //       req.body.skills || null,
// // //       req.body.education || null,
// // //       req.body.custom_current_employer || null,
// // //       req.body.custom_overall_experience_years || null,
// // //       req.body.custom_relevant_experience_years || null,
// // //       req.body.custom_current_salary_lpa || null,
// // //       req.body.custom_expected_salary_lpa || null,
// // //       req.body.notice_period || null,
// // //       req.body.position || null,
// // //       req.body.status || 'applied',
// // //       req.params.id,
// // //     ]
// // //   );

// // //   res.json({ success: true });
// // // };
// // // export const updateCandidate = async (req, res) => {
// // //   try {
// // //     const hrId = req.user.id; // ✅ now works
// // //     const hrName = req.user.name;

// // //     await pool.query(
// // //       `UPDATE candidates SET
// // //         custom_first_name=?,
// // //         custom_last_name=?,
// // //         email_id=?,
// // //         phone_number=?,
// // //         skills=?,
// // //         education=?,
// // //         custom_current_employer=?,
// // //         custom_overall_experience_years=?,
// // //         custom_relevant_experience_years=?,
// // //         custom_current_salary_lpa=?,
// // //         custom_expected_salary_lpa=?,
// // //         notice_period=?,
// // //         position=?,
// // //         status=?,
// // //         updated_by_id=?,
// // //         updated_by_name=?
// // //       WHERE id=?`,
// // //       [
// // //         req.body.first_name,
// // //         req.body.last_name || null,
// // //         req.body.email_id || null,
// // //         req.body.phone_number || null,
// // //         req.body.skills || null,
// // //         req.body.education || null,
// // //         req.body.custom_current_employer || null,
// // //         req.body.custom_overall_experience_years || null,
// // //         req.body.custom_relevant_experience_years || null,
// // //         req.body.custom_current_salary_lpa || null,
// // //         req.body.custom_expected_salary_lpa || null,
// // //         req.body.notice_period || null,
// // //         req.body.position || null,
// // //         req.body.status || 'applied',
// // //         hrId,
// // //         hrName,
// // //         req.params.id,
// // //       ]
// // //     );

// // //     res.json({ success: true });
// // //   } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // };
// // export const updateCandidate = async (req, res) => {
// //   try {
// //     const hrId = req.user.id;
// //     const hrName = req.user.name;

// //     const {
// //       first_name,
// //       last_name,
// //       email_id,
// //       phone_number,
// //       skills,
// //       education,
// //       custom_current_employer,
// //       custom_overall_experience_years,
// //       custom_relevant_experience_years,
// //       custom_current_salary_lpa,
// //       custom_expected_salary_lpa,
// //       notice_period,
// //       position,
// //       status // OPTIONAL
// //     } = req.body;

// //     let query = `
// //       UPDATE candidates SET
// //         custom_first_name=?,
// //         custom_last_name=?,
// //         email_id=?,
// //         phone_number=?,
// //         skills=?,
// //         education=?,
// //         custom_current_employer=?,
// //         custom_overall_experience_years=?,
// //         custom_relevant_experience_years=?,
// //         custom_current_salary_lpa=?,
// //         custom_expected_salary_lpa=?,
// //         notice_period=?,
// //         position=?,
// //         updated_by=?,
// //         updated_by_name=?
// //     `;

// //     const params = [
// //       first_name,
// //       last_name || null,
// //       email_id || null,
// //       phone_number || null,
// //       skills || null,
// //       education || null,
// //       custom_current_employer || null,
// //       custom_overall_experience_years || null,
// //       custom_relevant_experience_years || null,
// //       custom_current_salary_lpa || null,
// //       custom_expected_salary_lpa || null,
// //       notice_period || null,
// //       position || null,
// //       hrId,
// //       hrName
// //     ];

// //     // ✅ ONLY update status if explicitly sent
// //     if (status) {
// //       query += `, status=?`;
// //       params.push(status);
// //     }

// //     query += ` WHERE id=?`;
// //     params.push(req.params.id);

// //     await pool.query(query, params);

// //     res.json({ success: true });
// //   } catch (err) {
// //     console.error("Update candidate error:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // };


// // /* ================= DELETE ================= */
// // export const deleteCandidate = async (req, res) => {
// //   await pool.query('DELETE FROM candidates WHERE id=?', [req.params.id]);
// //   res.json({ success: true });
// // };

// // // import pool from '../config/database.js';

// // // /**
// // //  * ==============================
// // //  * CREATE CANDIDATE
// // //  * ==============================
// // //  */
// // // export const createCandidate = async (req, res) => {
// // //   try {
// // //     console.log('REQ BODY:', req.body); // 👈 keep this for verification

// // //     const {
// // //       first_name,
// // //       last_name,
// // //       email_id,
// // //       phone_number,
// // //       skills,
// // //       education,
// // //       position,
// // //       status,
// // //     } = req.body;

// // //     const sql = `
// // //       INSERT INTO candidates (
// // //         custom_first_name,
// // //         custom_last_name,
// // //         email_id,
// // //         phone_number,
// // //         skills,
// // //         education,
// // //         position,
// // //         status
// // //       )
// // //       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
// // //     `;

// // //     const values = [
// // //       first_name || null,
// // //       last_name || null,
// // //       email_id || null,
// // //       phone_number || null,
// // //       skills || null,
// // //       education || null,
// // //       position || null,
// // //       status || 'applied',
// // //     ];

// // //     await pool.query(sql, values);

// // //     res.status(201).json({ message: 'Candidate created successfully' });
// // //   } catch (error) {
// // //     console.error('Create candidate error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };


// // // /**
// // //  * ==============================
// // //  * GET ALL CANDIDATES
// // //  * ==============================
// // //  */
// // // export const getCandidates = async (req, res) => {
// // //   try {
// // //     const [rows] = await pool.query(`
// // //       SELECT
// // //         id,
// // //         custom_first_name AS firstName,
// // //         custom_last_name AS lastName,
// // //         email_id AS email,
// // //         phone_number AS phone,
// // //         skills,
// // //         education,
// // //         position,
// // //         status,
// // //         created_at
// // //       FROM candidates
// // //       ORDER BY created_at DESC
// // //     `);

// // //     res.json(rows);
// // //   } catch (error) {
// // //     console.error('Get candidates error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // /**
// // //  * ==============================
// // //  * GET CANDIDATE BY ID
// // //  * ==============================
// // //  */
// // // export const getCandidateById = async (req, res) => {
// // //   try {
// // //     const [rows] = await pool.query(
// // //       `
// // //       SELECT
// // //         id,
// // //         custom_first_name AS firstName,
// // //         custom_last_name AS lastName,
// // //         email_id AS email,
// // //         phone_number AS phone,
// // //         skills,
// // //         education,
// // //         custom_current_employer AS currentEmployer,
// // //         custom_overall_experience_years AS overallExperience,
// // //         custom_relevant_experience_years AS relevantExperience,
// // //         custom_current_salary_lpa AS currentSalary,
// // //         custom_expected_salary_lpa AS expectedSalary,
// // //         notice_period AS noticePeriod,
// // //         position,
// // //         status
// // //       FROM candidates
// // //       WHERE id = ?
// // //       `,
// // //       [req.params.id]
// // //     );

// // //     if (!rows.length) {
// // //       return res.status(404).json({ error: 'Candidate not found' });
// // //     }

// // //     res.json(rows[0]);
// // //   } catch (error) {
// // //     console.error('Get candidate error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // /**
// // //  * ==============================
// // //  * UPDATE CANDIDATE
// // //  * ==============================
// // //  */
// // // export const updateCandidate = async (req, res) => {
// // //   try {
// // //     const {
// // //       firstName,
// // //       lastName,
// // //       email,
// // //       phone,
// // //       skills,
// // //       education,
// // //       currentEmployer,
// // //       overallExperience,
// // //       relevantExperience,
// // //       currentSalary,
// // //       expectedSalary,
// // //       noticePeriod,
// // //       position,
// // //       status,
// // //     } = req.body;

// // //     await pool.query(
// // //       `
// // //       UPDATE candidates SET
// // //         custom_first_name = ?,
// // //         custom_last_name = ?,
// // //         email_id = ?,
// // //         phone_number = ?,
// // //         skills = ?,
// // //         education = ?,
// // //         custom_current_employer = ?,
// // //         custom_overall_experience_years = ?,
// // //         custom_relevant_experience_years = ?,
// // //         custom_current_salary_lpa = ?,
// // //         custom_expected_salary_lpa = ?,
// // //         notice_period = ?,
// // //         position = ?,
// // //         status = ?
// // //       WHERE id = ?
// // //       `,
// // //       [
// // //         firstName || null,
// // //         lastName || null,
// // //         email || null,
// // //         phone || null,
// // //         skills || null,
// // //         education || null,
// // //         currentEmployer || null,
// // //         overallExperience || null,
// // //         relevantExperience || null,
// // //         currentSalary || null,
// // //         expectedSalary || null,
// // //         noticePeriod || null,
// // //         position || null,
// // //         status || 'applied',
// // //         req.params.id,
// // //       ]
// // //     );

// // //     res.json({ message: 'Candidate updated successfully' });
// // //   } catch (error) {
// // //     console.error('Update candidate error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // /**
// // //  * ==============================
// // //  * DELETE CANDIDATE
// // //  * ==============================
// // //  */
// // // export const deleteCandidate = async (req, res) => {
// // //   try {
// // //     await pool.query(
// // //       'DELETE FROM candidates WHERE id = ?',
// // //       [req.params.id]
// // //     );

// // //     res.json({ message: 'Candidate deleted successfully' });
// // //   } catch (error) {
// // //     console.error('Delete candidate error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // // import pool from '../config/database.js';

// // // // /**
// // // //  * Create candidate
// // // //  */
// // // // export const createCandidate = async (req, res) => {
// // // //   try {
// // // //     const data = req.body;

// // // //     const [result] = await pool.query(
// // // //       `INSERT INTO candidates
// // // //       (
// // // //         cfirst_name,
// // // //         custom_last_name,
// // // //         email_id,
// // // //         phone_number,
// // // //         skills,
// // // //         education,
// // // //         custom_current_employer,
// // // //         custom_overall_experience_years,
// // // //         custom_relevant_experience_years,
// // // //         custom_current_salary_lpa,
// // // //         custom_expected_salary_lpa,
// // // //         notice_period,
// // // //         position,
// // // //         status
// // // //       )
// // // //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// // // //       [
// // // //         data.custom_first_name,
// // // //         data.custom_last_name,
// // // //         data.email_id,
// // // //         data.phone_number,
// // // //         data.skills,
// // // //         data.education,
// // // //         data.custom_current_employer,
// // // //         data.custom_overall_experience_years,
// // // //         data.custom_relevant_experience_years,
// // // //         data.custom_current_salary_lpa,
// // // //         data.custom_expected_salary_lpa,
// // // //         data.notice_period,
// // // //         data.position,
// // // //         data.status || 'applied',
// // // //       ]
// // // //     );

// // // //     res.status(201).json({
// // // //       message: 'Candidate created successfully',
// // // //       id: result.insertId,
// // // //     });
// // // //   } catch (error) {
// // // //     console.error('Create candidate error:', error);
// // // //     res.status(500).json({ error: error.message });
// // // //   }
// // // // };

// // // // /**
// // // //  * Get all candidates
// // // //  */
// // // // export const getCandidates = async (req, res) => {
// // // //   try {
// // // //     const [candidates] = await pool.query(
// // // //       'SELECT * FROM candidates ORDER BY created_at DESC'
// // // //     );
// // // //     res.json(candidates);
// // // //   } catch (error) {
// // // //     res.status(500).json({ error: error.message });
// // // //   }
// // // // };

// // // // /**
// // // //  * Get candidate by ID
// // // //  */
// // // // export const getCandidateById = async (req, res) => {
// // // //   try {
// // // //     const [candidates] = await pool.query(
// // // //       'SELECT * FROM candidates WHERE id = ?',
// // // //       [req.params.id]
// // // //     );

// // // //     if (!candidates.length) {
// // // //       return res.status(404).json({ error: 'Candidate not found' });
// // // //     }

// // // //     res.json(candidates[0]);
// // // //   } catch (error) {
// // // //     res.status(500).json({ error: error.message });
// // // //   }
// // // // };

// // // // /**
// // // //  * Update candidate
// // // //  */
// // // // export const updateCandidate = async (req, res) => {
// // // //   try {
// // // //     const {
// // // //       custom_first_name,
// // // //       custom_last_name,
// // // //       email_id,
// // // //       phone_number,
// // // //       skills,
// // // //       education,
// // // //       custom_current_employer,
// // // //       custom_overall_experience_years,
// // // //       custom_relevant_experience_years,
// // // //       custom_current_salary_lpa,
// // // //       custom_expected_salary_lpa,
// // // //       notice_period,
// // // //       position,
// // // //       status,
// // // //     } = req.body;

// // // //     await pool.query(
// // // //       `UPDATE candidates SET
// // // //         custom_first_name = ?,
// // // //         custom_last_name = ?,
// // // //         email_id = ?,
// // // //         phone_number = ?,
// // // //         skills = ?,
// // // //         education = ?,
// // // //         custom_current_employer = ?,
// // // //         custom_overall_experience_years = ?,
// // // //         custom_relevant_experience_years = ?,
// // // //         custom_current_salary_lpa = ?,
// // // //         custom_expected_salary_lpa = ?,
// // // //         notice_period = ?,
// // // //         position = ?,
// // // //         status = ?
// // // //       WHERE id = ?`,
// // // //       [
// // // //         custom_first_name,
// // // //         custom_last_name,
// // // //         email_id,
// // // //         phone_number,
// // // //         skills,
// // // //         education,
// // // //         custom_current_employer,
// // // //         custom_overall_experience_years,
// // // //         custom_relevant_experience_years,
// // // //         custom_current_salary_lpa,
// // // //         custom_expected_salary_lpa,
// // // //         notice_period,
// // // //         position,
// // // //         status,
// // // //         req.params.id,
// // // //       ]
// // // //     );

// // // //     res.json({ message: 'Candidate updated successfully' });
// // // //   } catch (error) {
// // // //     res.status(500).json({ error: error.message });
// // // //   }
// // // // };

// // // // /**
// // // //  * Delete candidate
// // // //  */
// // // // export const deleteCandidate = async (req, res) => {
// // // //   try {
// // // //     await pool.query(
// // // //       'DELETE FROM candidates WHERE id = ?',
// // // //       [req.params.id]
// // // //     );

// // // //     res.json({ message: 'Candidate deleted successfully' });
// // // //   } catch (error) {
// // // //     res.status(500).json({ error: error.message });
// // // //   }
// // // // };
