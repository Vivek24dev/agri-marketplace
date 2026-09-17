const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, userType, district, city_or_village, lat, lng, phone } = req.body;

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
      'INSERT INTO users (name, email, password, user_type, district, phone, whatsapp_number, is_verified, city_or_village, lat, lng) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        userType,
        district || 'Bengaluru',
        phone || '',
        phone || '',
        false,
        city_or_village || 'Devanahalli Village Hub',
        lat ? Number(lat) : 13.2483,
        lng ? Number(lng) : 77.7126
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
        city_or_village: newUser.city_or_village || 'Devanahalli Village Hub',
        lat: newUser.lat || 13.2483,
        lng: newUser.lng || 77.7126,
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
      district: user.district,
      city_or_village: user.city_or_village,
      lat: user.lat,
      lng: user.lng
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type,
        district: user.district || 'Bengaluru',
        city_or_village: user.city_or_village || (user.user_type === 'farmer' ? 'Devanahalli Village Hub' : 'Yeshwantpur Mandi City'),
        lat: user.lat || (user.user_type === 'farmer' ? 13.2483 : 13.0234),
        lng: user.lng || (user.user_type === 'farmer' ? 77.7126 : 77.5456),
        phone: user.phone || user.whatsapp_number || '9876543210'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// PUT /api/auth/profile - Update user location (city or village, district, coordinates)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { city_or_village, district, lat, lng, phone, name } = req.body;

    const updates = {};
    if (city_or_village) updates.city_or_village = city_or_village;
    if (district) updates.district = district;
    if (lat) updates.lat = Number(lat);
    if (lng) updates.lng = Number(lng);
    if (phone) updates.phone = phone;
    if (name) updates.name = name;

    const updatedUser = db.updateUserProfile(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'Location updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        userType: updatedUser.user_type,
        district: updatedUser.district,
        city_or_village: updatedUser.city_or_village,
        lat: updatedUser.lat,
        lng: updatedUser.lng,
        phone: updatedUser.phone
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
