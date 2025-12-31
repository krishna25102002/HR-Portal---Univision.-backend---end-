import pool from '../config/database.js';

/* ================= CREATE INTERVIEW ================= */
export const createInterview = async (req, res) => {
  try {
    const {
      candidate_id,
      scheduled_date,
      interview_type,
      interviewer_name,
      interviewer_email,
      interviewer_role,
      interviewer_department
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO interviews
       (candidate_id, scheduled_date, interview_type,
        interviewer_name, interviewer_email,
        interviewer_role, interviewer_department, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        candidate_id,
        scheduled_date,
        interview_type,
        interviewer_name,
        interviewer_email || null,
        interviewer_role || null,
        interviewer_department
      ]
    );

    // 🔥 AUTO STATUS UPDATE
    await pool.query(
      `UPDATE candidates SET status = 'invitation_sent' WHERE id = ?`,
      [candidate_id]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Interview scheduled & invitation sent'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const interviewId = req.params.id;

    await pool.query(
      'UPDATE interviews SET status = ? WHERE id = ?',
      [status, interviewId]
    );

    const [[interview]] = await pool.query(
      'SELECT candidate_id FROM interviews WHERE id = ?',
      [interviewId]
    );

    const map = {
      scheduled: 'invitation_sent',
      completed: 'interview',
      cancelled: 'applied'
    };

    if (map[status]) {
      await pool.query(
        'UPDATE candidates SET status = ? WHERE id = ?',
        [map[status], interview.candidate_id]
      );
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL INTERVIEWS ================= */

export const getAllInterviews = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          i.id,
          i.candidate_id,
          i.scheduled_date,
          i.interview_type,
          i.interviewer_name,
          i.interviewer_email,
          i.interviewer_role,
          i.interviewer_department,
          i.status,
          i.created_at,
          CONCAT(c.custom_first_name, ' ', c.custom_last_name) AS candidate_name,
          c.email_id AS candidate_email,
          c.position,
          c.status AS candidate_status
       FROM interviews i
       INNER JOIN candidates c ON i.candidate_id = c.id
       ORDER BY i.scheduled_date DESC
       LIMIT 5000`
    );

    res.json(rows);
  } catch (error) {
    console.error('❌ getAllInterviews error:', error);
    res.status(500).json({ error: error.message });
  }
};
/* ================= GET INTERVIEWS BY CANDIDATE ================= */

export const getByCandidate = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM interviews WHERE candidate_id = ?',
    [req.params.id]
  );
  res.json(rows);
};
/* ================= UPDATE INTERVIEW ================= */

export const updateInterview = async (req, res) => {
  const {
    scheduled_date,
    interview_type,
    interviewer_id,
    status,
    feedback
  } = req.body;

  await pool.query(
    `UPDATE interviews SET
      scheduled_date = ?,
      interview_type = ?,
      interviewer_id = ?,
      status = ?,
      feedback = ?
     WHERE id = ?`,
    [
      scheduled_date,
      interview_type,
      interviewer_id,
      status,
      feedback,
      req.params.id
    ]
  );

  res.json({ message: 'Interview updated successfully' });
};

// /* ================= UPDATE INTERVIEW STATUS (🔥 FIX HERE) ================= */

// export const updateInterviewStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const interviewId = req.params.id;

//     if (!status) {
//       return res.status(400).json({ message: 'Status is required' });
//     }

//     // 1️⃣ Update interview status
//     await pool.query(
//       'UPDATE interviews SET status = ? WHERE id = ?',
//       [status, interviewId]
//     );

//     // 2️⃣ Fetch candidate_id from interview
//     const [[interview]] = await pool.query(
//       'SELECT candidate_id FROM interviews WHERE id = ?',
//       [interviewId]
//     );

//     if (interview?.candidate_id) {
//       // 3️⃣ Update candidate status (🔥 THIS FIXES UI)
//       await pool.query(
//         'UPDATE candidates SET status = ? WHERE id = ?',
//         [status, interview.candidate_id]
//       );
//     }

//     res.json({ message: 'Interview & candidate status updated' });

//   } catch (err) {
//     console.error('❌ Update status error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };


// import pool from '../config/database.js';

// /* ================= CREATE INTERVIEW ================= */

// export const createInterview = async (req, res) => {
//   try {
//     const {
//       candidate_id,
//       scheduled_date,
//       interview_type,
//       interviewer_name,
//       interviewer_email,
//       interviewer_role,
//       interviewer_department
//     } = req.body;

//     if (
//       !candidate_id ||
//       !scheduled_date ||
//       !interviewer_name ||
//       !interviewer_department

//     ) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const [result] = await pool.query(
//       `INSERT INTO interviews
//        (candidate_id, scheduled_date, interview_type,
//         interviewer_name, interviewer_email,
//         interviewer_role, interviewer_department, status)
//        VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
//       [
//         candidate_id,
//         scheduled_date,
//         interview_type,
//         interviewer_name,
//         interviewer_email || null,
//         interviewer_role || null,
//         interviewer_department
//       ]
//     );

//     res.status(201).json({
//       id: result.insertId,
//       message: 'Interview scheduled successfully'
//     });

//   } catch (err) {
//     console.error('❌ Create interview error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* ================= GET INTERVIEWS BY CANDIDATE ================= */

// export const getByCandidate = async (req, res) => {
//   const [rows] = await pool.query(
//     'SELECT * FROM interviews WHERE candidate_id = ?',
//     [req.params.id]
//   );
//   res.json(rows);
// };

// /* ================= UPDATE INTERVIEW ================= */

// export const updateInterview = async (req, res) => {
//   const {
//     scheduled_date,
//     interview_type,
//     interviewer_id,
//     status,
//     feedback
//   } = req.body;

//   await pool.query(
//     `UPDATE interviews SET
//       scheduled_date = ?,
//       interview_type = ?,
//       interviewer_id = ?,
//       status = ?,
//       feedback = ?
//      WHERE id = ?`,
//     [
//       scheduled_date,
//       interview_type,
//       interviewer_id,
//       status,
//       feedback,
//       req.params.id
//     ]
//   );

//   res.json({ message: 'Interview updated successfully' });
// };

// /* ================= GET ALL INTERVIEWS ================= */

// export const getAllInterviews = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT 
//           i.id,
//           i.candidate_id,
//           i.scheduled_date,
//           i.interview_type,
//           i.interviewer_name,
//           i.interviewer_email,
//           i.interviewer_role,
//           i.interviewer_department,
//           i.status,
//           i.created_at,
//           CONCAT(c.custom_first_name, ' ', c.custom_last_name) AS candidate_name,
//           c.email_id AS candidate_email,
//           c.position,
//           c.status AS candidate_status
//        FROM interviews i
//        INNER JOIN candidates c ON i.candidate_id = c.id
//        ORDER BY i.scheduled_date DESC
//        LIMIT 5000`
//     );

//     res.json(rows);
//   } catch (error) {
//     console.error('❌ getAllInterviews error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// /* ================= UPDATE INTERVIEW STATUS (🔥 FIX HERE) ================= */

// export const updateInterviewStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const interviewId = req.params.id;

//     if (!status) {
//       return res.status(400).json({ message: 'Status is required' });
//     }

//     // 1️⃣ Update interview status
//     await pool.query(
//       'UPDATE interviews SET status = ? WHERE id = ?',
//       [status, interviewId]
//     );

//     // 2️⃣ Fetch candidate_id from interview
//     const [[interview]] = await pool.query(
//       'SELECT candidate_id FROM interviews WHERE id = ?',
//       [interviewId]
//     );

//     if (interview?.candidate_id) {
//       // 3️⃣ Update candidate status (🔥 THIS FIXES UI)
//       await pool.query(
//         'UPDATE candidates SET status = ? WHERE id = ?',
//         [status, interview.candidate_id]
//       );
//     }

//     res.json({ message: 'Interview & candidate status updated' });

//   } catch (err) {
//     console.error('❌ Update status error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // import pool from '../config/database.js';

// // /* CREATE INTERVIEW */
// // // export const createInterview = async (req, res) => {
// // //   try {
// // //     const {
// // //       candidate_id,
// // //       scheduled_date,
// // //       interview_type,
// // //       interviewer_id
// // //     } = req.body;

// // //     console.log('📦 Interview payload:', req.body);

// // //     if (!candidate_id || !scheduled_date || !interviewer_id) {
// // //       return res.status(400).json({ message: 'Missing required fields' });
// // //     }

// // //     const [result] = await pool.query(
// // //       `INSERT INTO interviews
// // //        (candidate_id, scheduled_date, interview_type, interviewer_id, status)
// // //        VALUES (?, ?, ?, ?, 'scheduled')`,
// // //       [candidate_id, scheduled_date, interview_type, interviewer_id]
// // //     );

// // //     res.status(201).json({
// // //       id: result.insertId,
// // //       message: 'Interview scheduled successfully'
// // //     });
// // //   } catch (error) {
// // //     console.error('❌ Create interview error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };


// // export const createInterview = async (req, res) => {
// //   try {
// //     const {
// //       candidate_id,
// //       scheduled_date,
// //       interview_type,
// //       interviewer_name,
// //       interviewer_email,
// //       interviewer_role,
// //       interviewer_department
// //     } = req.body;

// //     if (
// //       !candidate_id ||
// //       !scheduled_date ||
// //       !interviewer_name ||
// //       !interviewer_department
// //     ) {
// //       return res.status(400).json({ message: 'Missing required fields' });
// //     }

// //     const [result] = await pool.query(
// //       `INSERT INTO interviews
// //        (candidate_id, scheduled_date, interview_type,
// //         interviewer_name, interviewer_email,
// //         interviewer_role, interviewer_department, status)
// //        VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
// //       [
// //         candidate_id,
// //         scheduled_date,
// //         interview_type,
// //         interviewer_name,
// //         interviewer_email || null,
// //         interviewer_role || null,
// //         interviewer_department
// //       ]
// //     );

// //     res.status(201).json({
// //       id: result.insertId,
// //       message: 'Interview scheduled successfully'
// //     });

// //   } catch (err) {
// //     console.error('❌ Create interview error:', err);
// //     res.status(500).json({ message: err.message });
// //   }
// // };


// // /* GET INTERVIEWS BY CANDIDATE */
// // export const getByCandidate = async (req, res) => {
// //   const [rows] = await pool.query(
// //     'SELECT * FROM interviews WHERE candidate_id = ?',
// //     [req.params.id]
// //   );
// //   res.json(rows);
// // };

// // /* UPDATE INTERVIEW */
// // export const updateInterview = async (req, res) => {
// //   const {
// //     scheduled_date,
// //     interview_type,
// //     interviewer_id,
// //     status,
// //     feedback
// //   } = req.body;

// //   await pool.query(
// //     `UPDATE interviews SET
// //       scheduled_date = ?,
// //       interview_type = ?,
// //       interviewer_id = ?,
// //       status = ?,
// //       feedback = ?
// //      WHERE id = ?`,
// //     [
// //       scheduled_date,
// //       interview_type,
// //       interviewer_id,
// //       status,
// //       feedback,
// //       req.params.id
// //     ]
// //   );

// //   res.json({ message: 'Interview updated successfully' });
// // };

// // /* GET ALL INTERVIEWS */
// // // export const getAllInterviews = async (req, res) => {
// // //   const [rows] = await pool.query(
// // //     `SELECT i.*, 
// // //             c.first_name, c.last_name, c.email_id,
// // //             iv.name AS interviewer_name
// // //      FROM interviews i
// // //      JOIN candidates c ON i.candidate_id = c.id
// // //      LEFT JOIN interviewers iv ON i.interviewer_id = iv.id
// // //      ORDER BY i.scheduled_date`
// // //   );

// // //   res.json(rows);
// // // };

// // // import pool from '../config/database.js';

// // // /**
// // //  * Create interview
// // //  */
// // // export const createInterview = async (req, res) => {
// // //   try {
// // //     const {
// // //       candidate_id,
// // //       scheduled_date,
// // //       interview_type,
// // //       interviewer_name,
// // //     } = req.body;

// // //     console.log('📦 Interview payload:', req.body);

// // //     const [result] = await pool.query(
// // //       `INSERT INTO interviews
// // //        (candidate_id, scheduled_date, interview_type, interviewer_name, status)
// // //        VALUES (?, ?, ?, ?, ?)`,
// // //       [
// // //         candidate_id,
// // //         scheduled_date,
// // //         interview_type,
// // //         interviewer_name,
// // //         'scheduled',
// // //       ]
// // //     );

// // //     res.status(201).json({
// // //       message: 'Interview created successfully',
// // //       id: result.insertId,
// // //     });
// // //   } catch (error) {
// // //     console.error('❌ Create interview error:', error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };


// // // /**
// // //  * Get interviews by candidate
// // //  */
// // // export const getByCandidate = async (req, res) => {
// // //   try {
// // //     const [interviews] = await pool.query(
// // //       `SELECT * FROM interviews
// // //        WHERE candidate_id = ?
// // //        ORDER BY scheduled_date`,
// // //       [req.params.id]
// // //     );

// // //     res.json(interviews);
// // //   } catch (error) {
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // /**
// // //  * Update interview
// // //  */
// // // export const updateInterview = async (req, res) => {
// // //   try {
// // //     const {
// // //       scheduled_date,
// // //       interview_type,
// // //       interviewer_name,
// // //       // notes,
// // //       status,
// // //       feedback,
// // //     } = req.body;

// // //     await pool.query(
// // //       `UPDATE interviews SET
// // //         scheduled_date = ?,
// // //         interview_type = ?,
// // //         interviewer_name = ?,
// // //         // notes = ?,
// // //         status = ?,
// // //         feedback = ?
// // //       WHERE id = ?`,
// // //       [
// // //         scheduled_date,
// // //         interview_type,
// // //         interviewer_name,
// // //         // notes,
// // //         status,
// // //         feedback,
// // //         req.params.id,
// // //       ]
// // //     );

// // //     res.json({ message: 'Interview updated successfully' });
// // //   } catch (error) {
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // /**
// // //  * Get all interviews (admin view)
// // //  */
// // // export const getAllInterviews = async (req, res) => {
// // //   try {
// // //     const [interviews] = await pool.query(
// // //       `SELECT i.*,
// // //               CONCAT(c.custom_first_name, ' ', c.custom_last_name) AS candidate_name,
// // //               c.email_id AS candidate_email
// // //        FROM interviews i
// // //        JOIN candidates c ON i.candidate_id = c.id
// // //        ORDER BY i.scheduled_date`
// // //     );

// // //     res.json(interviews);
// // //   } catch (error) {
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };



// // // /* GET all interviewers */
// // // export const getInterviewers = async (req, res) => {
// // //   try {
// // //     const [rows] = await db.query(
// // //       'SELECT * FROM interviewers WHERE is_active = true'
// // //     );
// // //     res.json(rows);
// // //   } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ message: 'Failed to fetch interviewers' });
// // //   }
// // // };

// // // /* ADD interviewer */
// // // export const createInterviewer = async (req, res) => {
// // //   try {
// // //     const { name } = req.body;

// // //     await db.query(
// // //       'INSERT INTO interviewers (name) VALUES (?)',
// // //       [name]
// // //     );

// // //     res.json({ message: 'Interviewer added' });
// // //   } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ message: 'Failed to add interviewer' });
// // //   }
// // // };

// // // /* DELETE interviewer (soft delete) */
// // // export const deleteInterviewer = async (req, res) => {
// // //   try {
// // //     const { id } = req.params;

// // //     await db.query(
// // //       'UPDATE interviewers SET is_active = false WHERE id = ?',
// // //       [id]
// // //     );

// // //     res.json({ message: 'Interviewer removed' });
// // //   } catch (err) {
// // //     console.error(err);
// // //     res.status(500).json({ message: 'Failed to delete interviewer' });
// // //   }
// // // };
// // export const getAllInterviews = async (req, res) => {
// //   try {
// //     const [rows] = await pool.query(
// //       `SELECT 
// //           i.*,
// //           CONCAT(c.custom_first_name, ' ', c.custom_last_name) AS candidate_name,
// //           c.email_id AS candidate_email
// //        FROM interviews i
// //        JOIN candidates c ON i.candidate_id = c.id
// //        ORDER BY i.scheduled_date`
// //     );

// //     res.json(rows);
// //   } catch (error) {
// //     console.error('❌ getAllInterviews error:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // export const updateInterviewStatus = async (req, res) => {
// //   try {
// //     const { status } = req.body;

// //     if (!status) {
// //       return res.status(400).json({ message: 'Status is required' });
// //     }

// //     await pool.query(
// //       'UPDATE interviews SET status = ? WHERE id = ?',
// //       [status, req.params.id]
// //     );

// //     res.json({ message: 'Interview status updated' });
// //   } catch (err) {
// //     console.error('❌ Update status error:', err);
// //     res.status(500).json({ message: err.message });
// //   }
// // };
