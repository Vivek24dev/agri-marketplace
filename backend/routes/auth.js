const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, userType, district, phone } = req.body;

    // Validate inputs
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: 'Name, email, password and user type are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!['farmer', 'buyer', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type. Must be farmer or buyer' });
    }

    // Check if email already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password with bcryptjs (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const insertResult = await db.query(
      'INSERT INTO users (name, email, password, user_type, district, phone, whatsapp_number, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, user_type, district, phone, whatsapp_number, is_verified, created_at',
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        userType,
        district || 'Bengaluru',
        phone || '',
        phone || '',
        false
      ]
    );

    const newUser = insertResult.rows[0];

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.user_type,
        district: newUser.district,
        phone: newUser.phone
      },
      message: 'Signup successful'
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (expires in 7 days)
    const payload = {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      name: user.name,
      district: user.district
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type,
        district: user.district,
        phone: user.phone || user.whatsapp_number || '9876543210'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
