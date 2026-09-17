const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../middleware/upload');

// POST /api/posts - Create produce or requirement post
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      category,
      cropType,
      quantity,
      pricePerUnit,
      grade,
      imageUrl,
      userType,
      city_or_village,
      district
    } = req.body;

    // Validate essential fields
    if (!userId || !title || !category || !userType) {
      return res.status(400).json({ error: 'Missing required fields: userId, title, category, userType' });
    }

    if (!['produce', 'requirement'].includes(category)) {
      return res.status(400).json({ error: 'Category must be produce or requirement' });
    }

    if (!['farmer', 'buyer'].includes(userType)) {
      return res.status(400).json({ error: 'UserType must be farmer or buyer' });
    }

    // Verify user exists
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const assignedGrade = grade || (category === 'produce' ? 'A' : 'N/A');
    const resolvedCity = city_or_village || user.city_or_village || 'Devanahalli Village Hub';
    const resolvedDistrict = district || user.district || 'Bengaluru';

    const result = await db.query(
      `INSERT INTO posts (user_id, title, description, category, crop_type, quantity, price_per_unit, grade, image_url, user_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        userId,
        title,
        description || '',
        category,
        cropType || 'Vegetables',
        quantity || 0,
        pricePerUnit || 0,
        assignedGrade,
        imageUrl || null,
        userType
      ]
    );

    const post = result.rows[0];
    post.city_or_village = resolvedCity;
    post.district = resolvedDistrict;

    // Also update in embedded db if present
    const embeddedDb = db.getEmbeddedDb();
    if (embeddedDb) {
      const livePost = (embeddedDb.posts || []).find(p => p.id === post.id);
      if (livePost) {
        livePost.city_or_village = resolvedCity;
        livePost.district = resolvedDistrict;
        db.saveEmbeddedDb();
      }
    }

    return res.status(201).json(post);
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/posts/upload-image - Upload produce image via Multer
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: 'Image upload failed' });
  }
});

// GET /api/posts - Fetch feed
router.get('/', async (req, res) => {
  try {
    const { userType, category, cropType, city_or_village, district } = req.query;

    let targetUserType = null;
    if (userType === 'farmer') {
      targetUserType = 'buyer'; // Farmer sees buyer requirement posts
    } else if (userType === 'buyer') {
      targetUserType = 'farmer'; // Buyer sees farmer produce posts
    }

    let queryText = `
      SELECT p.*, u.name as user_name, u.name, u.phone, u.district, u.whatsapp_number
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_active = true
    `;
    const params = [];

    if (targetUserType === 'farmer') {
      queryText += ` AND (p.user_type = 'farmer' OR p.category = 'produce')`;
    } else if (targetUserType === 'buyer') {
      queryText += ` AND (p.user_type = 'buyer' OR p.category = 'requirement')`;
    }

    if (cropType) {
      params.push(cropType.trim());
      queryText += ` AND LOWER(p.crop_type) = LOWER($${params.length})`;
    }

    if (category) {
      params.push(category);
      queryText += ` AND p.category = $${params.length}`;
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT 60`;

    const result = await db.query(queryText, params);
    let posts = result.rows;

    if (city_or_village && city_or_village !== 'all' && city_or_village.trim() !== '') {
      const term = city_or_village.toLowerCase().trim();
      posts = posts.filter(p => {
        const postLoc = (p.city_or_village || '').toLowerCase();
        const postDist = (p.district || '').toLowerCase();
        return postLoc.includes(term) || postDist.includes(term) || term.includes(postLoc);
      });
    }

    if (district && district !== 'all' && district.trim() !== '') {
      const dTerm = district.toLowerCase().trim();
      posts = posts.filter(p => (p.district || '').toLowerCase().includes(dTerm));
    }

    return res.status(200).json(posts);
  } catch (err) {
    console.error('Fetch feed error:', err);
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /api/posts/user/:userId - Get posts created by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT p.*, u.name as user_name, u.phone, u.district, u.whatsapp_number
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1 AND p.is_active = true
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch user posts error:', err);
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// POST /api/posts/:postId/dealing-done - Mark post as dealt
router.post('/:postId/dealing-done', async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await db.query(
      'UPDATE posts SET is_active = false WHERE id = $1 RETURNING *',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({ message: 'Post marked as dealt' });
  } catch (err) {
    console.error('Dealing done error:', err);
    return res.status(500).json({ error: 'Failed to mark post as dealt' });
  }
});

module.exports = router;
