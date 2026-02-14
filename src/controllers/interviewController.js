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


export const updateStatus = async (req, res) => {
  try {
    const { id: hrId, name: hrName } = req.user;
    const { interviewId } = req.params;
    const { status } = req.body;

    // 1️⃣ Get old status
    const [[oldRow]] = await pool.query(
      `SELECT status, candidate_id FROM interviews WHERE id = ?`,
      [interviewId]
    );

    // 2️⃣ Update interview status
    await pool.query(
      `UPDATE interviews SET status = ? WHERE id = ?`,
      [status, interviewId]
    );

    // 3️⃣ INSERT STATUS ACTIVITY LOG  🔥🔥🔥
    await pool.query(
      `
      INSERT INTO status_activity_logs
      (candidate_id, action, old_data, new_data, performed_by)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
    oldRow.candidate_id,
    newStatus,            // action
    oldRow.status,        // old_data
    newStatus,            // new_data
    req.user.id           // HR id
  ]
    );

    res.json({ message: "Status updated & logged successfully" });

  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

