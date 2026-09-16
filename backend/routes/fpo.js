const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/fpo - Create new FPO
router.post('/', async (req, res) => {
  try {
    const { userId, cropType, requiredQuantity, grade, location, price, district } = req.body;

    if (!userId || !cropType || !requiredQuantity || !price) {
      return res.status(400).json({ error: 'Missing required fields: userId, cropType, requiredQuantity, price' });
    }

    // Verify user is farmer
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    if (user.user_type !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can create an FPO aggregation' });
    }

    const targetDistrict = district || user.district || 'Bengaluru';

    const insertResult = await db.query(
      `INSERT INTO fpo (creator_id, crop_type, required_quantity, grade, location, district, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        cropType,
        Number(requiredQuantity),
        grade || 'A',
        location || `${targetDistrict} Aggregation Hub`,
        targetDistrict,
        Number(price)
      ]
    );

    const fpo = insertResult.rows[0];
    return res.status(201).json(fpo);
  } catch (err) {
    console.error('Create FPO error:', err);
    return res.status(500).json({ error: 'Failed to create FPO' });
  }
});

// GET /api/fpo - List active FPOs
router.get('/', async (req, res) => {
  try {
    const { district } = req.query;

    let queryText = `
      SELECT f.*, u.name as creator_name, u.phone as creator_phone, u.whatsapp_number as creator_whatsapp
      FROM fpo f
      JOIN users u ON f.creator_id = u.id
      WHERE f.is_active = true
    `;
    const params = [];

    if (district) {
      params.push(district);
      queryText += ` AND f.district = $1`;
    }

    queryText += ` ORDER BY f.created_at DESC`;

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch FPOs error:', err);
    return res.status(500).json({ error: 'Failed to fetch FPOs' });
  }
});

// POST /api/fpo/:fpoId/join - Farmer joins existing FPO
router.post('/:fpoId/join', async (req, res) => {
  try {
    const { fpoId } = req.params;
    const { userId, quantity } = req.body;

    if (!userId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Valid userId and contribution quantity are required' });
    }

    // Check if FPO exists and is active
    const fpoResult = await db.query('SELECT * FROM fpo WHERE id = $1', [fpoId]);
    if (fpoResult.rows.length === 0) {
      return res.status(404).json({ error: 'FPO not found' });
    }

    const fpo = fpoResult.rows[0];
    if (!fpo.is_active) {
      return res.status(400).json({ error: 'This FPO is no longer active' });
    }

    const contribQty = Number(quantity);

    // Insert join record
    await db.query(
      'INSERT INTO fpo_joins (fpo_id, farmer_id, quantity_contributed) VALUES ($1, $2, $3)',
      [fpoId, userId, contribQty]
    );

    // Update FPO current_quantity
    const updatedResult = await db.query(
      'UPDATE fpo SET current_quantity = current_quantity + $1 WHERE id = $2 RETURNING *',
      [contribQty, fpoId]
    );

    const updatedFpo = updatedResult.rows[0] || fpo;

    return res.status(200).json({
      id: updatedFpo.id,
      crop_type: updatedFpo.crop_type,
      required_quantity: updatedFpo.required_quantity,
      current_quantity: updatedFpo.current_quantity,
      message: 'Joined FPO successfully'
    });
  } catch (err) {
    console.error('Join FPO error:', err);
    return res.status(500).json({ error: 'Failed to join FPO' });
  }
});

// GET /api/fpo/:fpoId - Get FPO details with joined farmers
router.get('/:fpoId', async (req, res) => {
  try {
    const { fpoId } = req.params;

    const fpoResult = await db.query(
      `SELECT f.*, u.name as creator_name, u.phone as creator_phone
       FROM fpo f
       JOIN users u ON f.creator_id = u.id
       WHERE f.id = $1`,
      [fpoId]
    );

    if (fpoResult.rows.length === 0) {
      return res.status(404).json({ error: 'FPO not found' });
    }

    const fpo = fpoResult.rows[0];

    const joinsResult = await db.query(
      `SELECT j.*, u.name as farmer_name, u.phone as farmer_phone, u.whatsapp_number as farmer_whatsapp
       FROM fpo_joins j
       JOIN users u ON j.farmer_id = u.id
       WHERE j.fpo_id = $1
       ORDER BY j.created_at ASC`,
      [fpoId]
    );

    return res.status(200).json({
      fpo,
      joinedFarmers: joinsResult.rows
    });
  } catch (err) {
    console.error('Fetch FPO details error:', err);
    return res.status(500).json({ error: 'Failed to fetch FPO details' });
  }
});

// POST /api/fpo/:fpoId/complete - Mark FPO as complete
router.post('/:fpoId/complete', async (req, res) => {
  try {
    const { fpoId } = req.params;

    const result = await db.query(
      'UPDATE fpo SET is_active = false WHERE id = $1 RETURNING *',
      [fpoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FPO not found' });
    }

    return res.status(200).json({ message: 'FPO marked as complete' });
  } catch (err) {
    console.error('Complete FPO error:', err);
    return res.status(500).json({ error: 'Failed to complete FPO' });
  }
});

module.exports = router;
