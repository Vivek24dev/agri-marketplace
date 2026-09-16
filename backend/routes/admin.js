const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vivek24307@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678a';

// POST /api/admin/login - Admin authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Direct check against admin credentials or users table
    const isDirectAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;

    let adminUser = null;
    if (isDirectAdmin) {
      // Fetch or synthesize admin user
      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [ADMIN_EMAIL.toLowerCase()]);
      if (userRes.rows.length > 0) {
        adminUser = userRes.rows[0];
      } else {
        adminUser = {
          id: 3,
          name: 'Admin',
          email: ADMIN_EMAIL,
          user_type: 'admin',
          district: 'Bengaluru'
        };
      }
    } else {
      // Check in users table
      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const user = userRes.rows[0];
      if (user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Not an administrator' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      adminUser = user;
    }

    const payload = {
      id: adminUser.id,
      email: adminUser.email,
      userType: 'admin',
      name: adminUser.name || 'Admin',
      district: adminUser.district || 'Bengaluru'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name || 'Admin',
        email: adminUser.email,
        userType: 'admin',
        district: adminUser.district || 'Bengaluru'
      },
      message: 'Admin login successful'
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Admin login failed' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, user_type, district, phone, whatsapp_number, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/analytics - Platform statistics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsersRes = await db.query('SELECT COUNT(*) FROM users');
    const farmersRes = await db.query("SELECT COUNT(*) FROM users WHERE user_type = 'farmer'");
    const buyersRes = await db.query("SELECT COUNT(*) FROM users WHERE user_type = 'buyer'");
    const activePostsRes = await db.query('SELECT COUNT(*) FROM posts WHERE is_active = true');
    const completedDealsRes = await db.query('SELECT COUNT(*) FROM posts WHERE is_active = false');

    const totalUsers = parseInt(totalUsersRes.rows[0]?.count || 0, 10);
    const farmers = parseInt(farmersRes.rows[0]?.count || 0, 10);
    const buyers = parseInt(buyersRes.rows[0]?.count || 0, 10);
    const activePosts = parseInt(activePostsRes.rows[0]?.count || 0, 10);
    const completedDeals = parseInt(completedDealsRes.rows[0]?.count || 0, 10);

    return res.status(200).json({
      totalUsers,
      farmers,
      buyers,
      activePosts,
      completedDeals
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/admin/prices/update - Update mandi price
router.post('/prices/update', async (req, res) => {
  try {
    const { cropType, district, price, minPrice, maxPrice } = req.body;

    if (!cropType || !district || price === undefined) {
      return res.status(400).json({ error: 'cropType, district, and price are required' });
    }

    const calculatedMin = minPrice !== undefined ? Number(minPrice) : Number(price) * 0.8;
    const calculatedMax = maxPrice !== undefined ? Number(maxPrice) : Number(price) * 1.2;

    // Check if entry exists
    const existing = await db.query(
      'SELECT * FROM mandi_prices WHERE LOWER(crop_type) = LOWER($1) AND LOWER(district) = LOWER($2)',
      [cropType, district]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE mandi_prices SET price = $1, min_price = $2, max_price = $3, updated_at = NOW() WHERE crop_type = $4 AND district = $5',
        [Number(price), calculatedMin, calculatedMax, cropType, district]
      );
    } else {
      await db.query(
        'INSERT INTO mandi_prices (crop_type, district, price, min_price, max_price, market_name) VALUES ($1, $2, $3, $4, $5, $6)',
        [cropType, district, Number(price), calculatedMin, calculatedMax, `${district} APMC Yard`]
      );
    }

    return res.status(200).json({ message: 'Price updated successfully' });
  } catch (err) {
    console.error('Update price error:', err);
    return res.status(500).json({ error: 'Failed to update mandi price' });
  }
});

module.exports = router;
