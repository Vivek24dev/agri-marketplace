const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/prices - Fetch mandi prices by crop and/or district
router.get('/prices', async (req, res) => {
  try {
    const { cropType, district } = req.query;

    let queryText = 'SELECT * FROM mandi_prices WHERE 1=1';
    const params = [];

    if (cropType) {
      params.push(cropType);
      queryText += ` AND crop_type = $${params.length}`;
    }

    if (district) {
      params.push(district);
      queryText += ` AND district = $${params.length}`;
    }

    queryText += ' ORDER BY updated_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch prices error:', err);
    return res.status(500).json({ error: 'Failed to fetch mandi prices' });
  }
});

// GET /api/crops - Get all crop types available
router.get('/crops', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT crop_type FROM mandi_prices ORDER BY crop_type ASC');
    const crops = result.rows.map(r => r.crop_type);
    return res.status(200).json(crops);
  } catch (err) {
    console.error('Fetch crops error:', err);
    return res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// GET /api/districts - Get all districts available
router.get('/districts', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT district FROM mandi_prices ORDER BY district ASC');
    const districts = result.rows.map(r => r.district);
    return res.status(200).json(districts);
  } catch (err) {
    console.error('Fetch districts error:', err);
    return res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

module.exports = router;
