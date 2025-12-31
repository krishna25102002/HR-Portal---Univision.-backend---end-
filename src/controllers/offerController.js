import pool from '../config/database.js';

/**
 * Create offer
 */
export const createOffer = async (req, res) => {
  try {
    const {
      candidate_id,
      position,
      salary,
      start_date,
      department,
      terms_conditions,
    } = req.body;

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `INSERT INTO offers
       (candidate_id, position, salary, start_date, department, terms_conditions, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        candidate_id,
        position,
        salary,
        start_date,
        department,
        terms_conditions,
      ]
    );

    connection.release();

    res.json({
      message: 'Offer created successfully',
      offer_id: result.insertId,
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single offer
 */
export const getOffer = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [offers] = await connection.query(
      'SELECT * FROM offers WHERE id = ?',
      [req.params.id]
    );

    connection.release();

    if (!offers.length) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offers[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get offers by candidate
 */
export const getOffersByCandidate = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [offers] = await connection.query(
      'SELECT * FROM offers WHERE candidate_id = ?',
      [req.params.candidateId]
    );

    connection.release();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update offer
 */
export const updateOffer = async (req, res) => {
  try {
    const {
      position,
      salary,
      start_date,
      department,
      terms_conditions,
      status,
    } = req.body;

    const connection = await pool.getConnection();

    await connection.query(
      `UPDATE offers
       SET position = ?, salary = ?, start_date = ?, department = ?,
           terms_conditions = ?, status = ?
       WHERE id = ?`,
      [
        position,
        salary,
        start_date,
        department,
        terms_conditions,
        status,
        req.params.id,
      ]
    );

    connection.release();

    res.json({ message: 'Offer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Candidate responds to offer
 */
export const respondToOffer = async (req, res) => {
  try {
    const { response } = req.body; // accepted / rejected

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE offers SET status = ? WHERE id = ?',
      [response, req.params.id]
    );

    connection.release();

    res.json({ message: `Offer ${response}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
