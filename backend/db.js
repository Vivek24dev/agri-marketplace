const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pgPool = null;
let usePg = false;

// Path for embedded fallback database
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data for embedded engine
const INITIAL_USERS = [
  {
    id: 1,
    name: 'Farmer Demo',
    email: 'farmer@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Bengaluru',
    phone: '9876543210',
    whatsapp_number: '9876543210',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T08:00:00Z').toISOString()
  },
  {
    id: 2,
    name: 'Buyer Demo',
    email: 'buyer@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'buyer',
    district: 'Bengaluru',
    phone: '9876543211',
    whatsapp_number: '9876543211',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-02T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-02T09:00:00Z').toISOString()
  },
  {
    id: 3,
    name: 'Admin',
    email: 'vivek24307@gmail.com',
    password: bcrypt.hashSync('12345678a', 10),
    user_type: 'admin',
    district: 'Bengaluru',
    phone: '9876543212',
    whatsapp_number: '9876543212',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-08-15T10:00:00Z').toISOString(),
    updated_at: new Date('2026-08-15T10:00:00Z').toISOString()
  },
  {
    id: 4,
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Kolar',
    phone: '9988776655',
    whatsapp_number: '9988776655',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-03T11:00:00Z').toISOString(),
    updated_at: new Date('2026-09-03T11:00:00Z').toISOString()
  },
  {
    id: 5,
    name: 'Suresh Gowda',
    email: 'suresh@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Mandya',
    phone: '9988112233',
    whatsapp_number: '9988112233',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-04T12:00:00Z').toISOString(),
    updated_at: new Date('2026-09-04T12:00:00Z').toISOString()
  }
];

const INITIAL_MANDI_PRICES = [
  { id: 1, crop_type: 'Tomato', district: 'Bengaluru', price: 25.0, min_price: 20.0, max_price: 30.0, market_name: 'Yeshwantpur APMC Market', updated_at: new Date().toISOString() },
  { id: 2, crop_type: 'Tomato', district: 'Belagavi', price: 22.0, min_price: 18.0, max_price: 28.0, market_name: 'Belagavi Central Mandi', updated_at: new Date().toISOString() },
  { id: 3, crop_type: 'Tomato', district: 'Kolar', price: 21.0, min_price: 17.0, max_price: 26.0, market_name: 'Kolar Tomato Market Yard', updated_at: new Date().toISOString() },
  { id: 4, crop_type: 'Tomato', district: 'Tumkur', price: 23.5, min_price: 19.0, max_price: 28.0, market_name: 'Tumkur APMC Sub-Yard', updated_at: new Date().toISOString() },
  { id: 5, crop_type: 'Tomato', district: 'Mysuru', price: 26.0, min_price: 21.0, max_price: 31.0, market_name: 'Bandipalya APMC Mysuru', updated_at: new Date().toISOString() },
  { id: 6, crop_type: 'Potato', district: 'Bengaluru', price: 30.0, min_price: 25.0, max_price: 35.0, market_name: 'Binny Mill Market', updated_at: new Date().toISOString() },
  { id: 7, crop_type: 'Potato', district: 'Belagavi', price: 28.0, min_price: 24.0, max_price: 33.0, market_name: 'Belagavi Agri Hub', updated_at: new Date().toISOString() },
  { id: 8, crop_type: 'Potato', district: 'Hassan', price: 27.5, min_price: 22.0, max_price: 32.0, market_name: 'Hassan Potato Trading Yard', updated_at: new Date().toISOString() },
  { id: 9, crop_type: 'Potato', district: 'Mysuru', price: 29.0, min_price: 24.0, max_price: 34.0, market_name: 'Mysuru APMC Mandi', updated_at: new Date().toISOString() },
  { id: 10, crop_type: 'Onion', district: 'Bengaluru', price: 35.0, min_price: 30.0, max_price: 42.0, market_name: 'Yeshwantpur Onion Yard', updated_at: new Date().toISOString() },
  { id: 11, crop_type: 'Onion', district: 'Ballari', price: 31.0, min_price: 26.0, max_price: 38.0, market_name: 'Ballari Onion Market', updated_at: new Date().toISOString() },
  { id: 12, crop_type: 'Onion', district: 'Raichur', price: 32.5, min_price: 27.0, max_price: 39.0, market_name: 'Raichur Central Mandi', updated_at: new Date().toISOString() },
  { id: 13, crop_type: 'Carrot', district: 'Bengaluru', price: 40.0, min_price: 32.0, max_price: 48.0, market_name: 'K.R. Market Bengaluru', updated_at: new Date().toISOString() },
  { id: 14, crop_type: 'Carrot', district: 'Chikmagalur', price: 38.0, min_price: 30.0, max_price: 45.0, market_name: 'Chikmagalur Valley Mandi', updated_at: new Date().toISOString() },
  { id: 15, crop_type: 'Cabbage', district: 'Bengaluru', price: 18.0, min_price: 14.0, max_price: 22.0, market_name: 'Yeshwantpur Market', updated_at: new Date().toISOString() },
  { id: 16, crop_type: 'Cabbage', district: 'Kolar', price: 15.0, min_price: 12.0, max_price: 20.0, market_name: 'Kolar APMC Yard', updated_at: new Date().toISOString() },
  { id: 17, crop_type: 'Cucumber', district: 'Bengaluru', price: 22.0, min_price: 16.0, max_price: 28.0, market_name: 'K.R. Market', updated_at: new Date().toISOString() },
  { id: 18, crop_type: 'Cucumber', district: 'Tumkur', price: 19.0, min_price: 15.0, max_price: 25.0, market_name: 'Tumkur Vegetable Yard', updated_at: new Date().toISOString() },
  { id: 19, crop_type: 'Brinjal', district: 'Bengaluru', price: 28.0, min_price: 22.0, max_price: 35.0, market_name: 'Yeshwantpur Market', updated_at: new Date().toISOString() },
  { id: 20, crop_type: 'Brinjal', district: 'Mandya', price: 24.0, min_price: 19.0, max_price: 30.0, market_name: 'Mandya Farmer Market', updated_at: new Date().toISOString() },
  { id: 21, crop_type: 'Rice', district: 'Raichur', price: 48.0, min_price: 42.0, max_price: 56.0, market_name: 'Raichur Sona Masoori Hub', updated_at: new Date().toISOString() },
  { id: 22, crop_type: 'Rice', district: 'Mandya', price: 45.0, min_price: 39.0, max_price: 52.0, market_name: 'Mandya Rice Market Yard', updated_at: new Date().toISOString() },
  { id: 23, crop_type: 'Wheat', district: 'Belagavi', price: 34.0, min_price: 30.0, max_price: 40.0, market_name: 'Belagavi Grain Mandi', updated_at: new Date().toISOString() },
  { id: 24, crop_type: 'Wheat', district: 'Ballari', price: 36.0, min_price: 31.0, max_price: 42.0, market_name: 'Ballari Grain Exchange', updated_at: new Date().toISOString() },
  { id: 25, crop_type: 'Chilli', district: 'Ballari', price: 120.0, min_price: 100.0, max_price: 145.0, market_name: 'Byadgi Chilli Market Hub', updated_at: new Date().toISOString() },
  { id: 26, crop_type: 'Garlic', district: 'Bengaluru', price: 160.0, min_price: 130.0, max_price: 190.0, market_name: 'Yeshwantpur Spice Yard', updated_at: new Date().toISOString() },
  { id: 27, crop_type: 'Pepper', district: 'Kodagu', price: 450.0, min_price: 400.0, max_price: 510.0, market_name: 'Madikeri Spice Mandi', updated_at: new Date().toISOString() },
  { id: 28, crop_type: 'Pepper', district: 'Chikmagalur', price: 440.0, min_price: 390.0, max_price: 500.0, market_name: 'Chikmagalur Planters Exchange', updated_at: new Date().toISOString() },
  { id: 29, crop_type: 'Sugarcane', district: 'Mandya', price: 3.2, min_price: 2.8, max_price: 3.8, market_name: 'Mandya Sugar Mill Yard', updated_at: new Date().toISOString() },
  { id: 30, crop_type: 'Coconut', district: 'Tumkur', price: 28.0, min_price: 22.0, max_price: 35.0, market_name: 'Tiptur Coconut Market Yard', updated_at: new Date().toISOString() },
  { id: 31, crop_type: 'Coconut', district: 'Hassan', price: 26.0, min_price: 20.0, max_price: 32.0, market_name: 'Arasikere Coconut Exchange', updated_at: new Date().toISOString() },
  { id: 32, crop_type: 'Banana', district: 'Mysuru', price: 30.0, min_price: 24.0, max_price: 38.0, market_name: 'Nanjangud Rasabale Mandi', updated_at: new Date().toISOString() },
  { id: 33, crop_type: 'Mango', district: 'Kolar', price: 65.0, min_price: 50.0, max_price: 85.0, market_name: 'Srinivaspur Mango Yard', updated_at: new Date().toISOString() },
  { id: 34, crop_type: 'Orange', district: 'Kodagu', price: 55.0, min_price: 45.0, max_price: 70.0, market_name: 'Coorg Orange Farmers Market', updated_at: new Date().toISOString() },
  { id: 35, crop_type: 'Milk', district: 'Bengaluru', price: 42.0, min_price: 38.0, max_price: 46.0, market_name: 'Bengaluru Dairy Cooperative', updated_at: new Date().toISOString() },
  { id: 36, crop_type: 'Eggs', district: 'Bengaluru', price: 5.5, min_price: 5.0, max_price: 6.2, market_name: 'Bengaluru Poultry Exchange', updated_at: new Date().toISOString() }
];

const INITIAL_POSTS = [
  {
    id: 1,
    user_id: 1,
    title: 'Fresh Premium Hybrid Tomatoes',
    description: 'Harvested this morning. Grade A quality, uniform red ripeness, firm texture, ready for dispatch.',
    category: 'produce',
    crop_type: 'Tomato',
    quantity: 50.0,
    price_per_unit: 25.0,
    grade: 'A',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-15T09:30:00Z').toISOString(),
    updated_at: new Date('2026-09-15T09:30:00Z').toISOString()
  },
  {
    id: 2,
    user_id: 4,
    title: 'Grade A Seed Potatoes',
    description: 'Crisp and clean stored potatoes, suitable for chips or wholesale supply.',
    category: 'produce',
    crop_type: 'Potato',
    quantity: 120.0,
    price_per_unit: 28.0,
    grade: 'A',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-15T11:20:00Z').toISOString(),
    updated_at: new Date('2026-09-15T11:20:00Z').toISOString()
  },
  {
    id: 3,
    user_id: 2,
    title: 'Need High Quality Tomatoes for Restaurant Chain',
    description: 'Bulk requirement for hotel kitchen supply across Bengaluru. Urgent delivery needed.',
    category: 'requirement',
    crop_type: 'Tomato',
    quantity: 100.0,
    price_per_unit: 24.0,
    grade: 'A',
    image_url: null,
    user_type: 'buyer',
    is_active: true,
    created_at: new Date('2026-09-16T08:15:00Z').toISOString(),
    updated_at: new Date('2026-09-16T08:15:00Z').toISOString()
  },
  {
    id: 4,
    user_id: 2,
    title: 'Urgent: Bulk Potatoes Required',
    description: 'Required for wholesale food processing unit. Looking for Grade A or B potatoes.',
    category: 'requirement',
    crop_type: 'Potato',
    quantity: 250.0,
    price_per_unit: 27.0,
    grade: 'B',
    image_url: null,
    user_type: 'buyer',
    is_active: true,
    created_at: new Date('2026-09-16T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-16T09:00:00Z').toISOString()
  }
];

const INITIAL_FPO = [
  {
    id: 1,
    creator_id: 1,
    crop_type: 'Tomato',
    required_quantity: 200.0,
    current_quantity: 125.0,
    grade: 'A',
    location: 'Devanahalli Farm Cluster, Bengaluru Rural',
    district: 'Bengaluru',
    price: 25.0,
    is_active: true,
    created_at: new Date('2026-09-14T10:00:00Z').toISOString(),
    updated_at: new Date('2026-09-14T10:00:00Z').toISOString()
  },
  {
    id: 2,
    creator_id: 4,
    crop_type: 'Potato',
    required_quantity: 300.0,
    current_quantity: 150.0,
    grade: 'A',
    location: 'Malur Aggregation Center, Kolar',
    district: 'Kolar',
    price: 27.0,
    is_active: true,
    created_at: new Date('2026-09-14T14:30:00Z').toISOString(),
    updated_at: new Date('2026-09-14T14:30:00Z').toISOString()
  }
];

const INITIAL_FPO_JOINS = [
  { id: 1, fpo_id: 1, farmer_id: 1, quantity_contributed: 75.0, created_at: new Date('2026-09-14T10:05:00Z').toISOString() },
  { id: 2, fpo_id: 1, farmer_id: 4, quantity_contributed: 50.0, created_at: new Date('2026-09-14T11:00:00Z').toISOString() },
  { id: 3, fpo_id: 2, farmer_id: 4, quantity_contributed: 150.0, created_at: new Date('2026-09-14T14:35:00Z').toISOString() }
];

let embeddedDb = null;

function loadEmbeddedDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return data;
    } catch (e) {
      console.warn('[DB] Could not parse existing database.json, re-initializing seed.');
    }
  }

  const initialDb = {
    users: INITIAL_USERS,
    posts: INITIAL_POSTS,
    fpo: INITIAL_FPO,
    fpo_joins: INITIAL_FPO_JOINS,
    mandi_prices: INITIAL_MANDI_PRICES,
    cv_grades: []
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function saveEmbeddedDb() {
  if (embeddedDb) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(embeddedDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist database.json:', err.message);
    }
  }
}

// Check PostgreSQL availability
async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      pgPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000
      });
      // Test connection
      const client = await pgPool.connect();
      client.release();
      usePg = true;
      console.log('[DB] Connected successfully to PostgreSQL.');
      return;
    } catch (err) {
      console.log(`[DB] PostgreSQL not reachable (${err.message}). Using seamless local embedded database.`);
      usePg = false;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
  } else {
    console.log('[DB] No DATABASE_URL set. Using seamless local embedded database.');
  }

  embeddedDb = loadEmbeddedDb();
  console.log(`[DB] Embedded database active with ${embeddedDb.users.length} users, ${embeddedDb.mandi_prices.length} mandi prices, ${embeddedDb.posts.length} posts.`);
}

// Embedded query executor that responds with { rows, rowCount }
function queryEmbedded(text, params = []) {
  if (!embeddedDb) {
    embeddedDb = loadEmbeddedDb();
  }

  const sql = text.trim();
  const normalizedSql = sql.replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE email = $1
  if (/^SELECT \* FROM users WHERE email =/i.test(normalizedSql)) {
    const email = (params[0] || '').toLowerCase().trim();
    const user = embeddedDb.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT * FROM users WHERE id = $1
  if (/^SELECT \* FROM users WHERE id =/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const user = embeddedDb.users.find(u => u.id === id);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 3. INSERT INTO users
  if (/^INSERT INTO users/i.test(normalizedSql)) {
    const [name, email, password, user_type, district, phone, whatsapp_number, is_verified] = params;
    const newId = embeddedDb.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      name,
      email: email.toLowerCase().trim(),
      password,
      user_type,
      district: district || 'Bengaluru',
      phone: phone || '',
      whatsapp_number: whatsapp_number || phone || '',
      profile_image_url: null,
      is_verified: is_verified || false,
      created_at: now,
      updated_at: now
    };
    embeddedDb.users.push(newUser);
    saveEmbeddedDb();
    return { rows: [{ ...newUser }], rowCount: 1 };
  }

  // 4. SELECT users FOR ADMIN
  if (/^SELECT id, name, email, user_type, district, phone/i.test(normalizedSql)) {
    let users = [...embeddedDb.users].map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      user_type: u.user_type,
      district: u.district,
      phone: u.phone,
      whatsapp_number: u.whatsapp_number,
      is_verified: u.is_verified,
      created_at: u.created_at
    }));
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: users, rowCount: users.length };
  }

  // 5. POSTS: INSERT INTO posts
  if (/^INSERT INTO posts/i.test(normalizedSql)) {
    const [user_id, title, description, category, crop_type, quantity, price_per_unit, grade, image_url, user_type] = params;
    const newId = embeddedDb.posts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = new Date().toISOString();
    const newPost = {
      id: newId,
      user_id: Number(user_id),
      title,
      description,
      category,
      crop_type,
      quantity: Number(quantity),
      price_per_unit: Number(price_per_unit),
      grade: grade || 'N/A',
      image_url: image_url || null,
      user_type,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    embeddedDb.posts.push(newPost);
    saveEmbeddedDb();
    return { rows: [{ ...newPost }], rowCount: 1 };
  }

  // 6. POSTS: SELECT Feed (with user JOIN)
  if (/^SELECT p\.\*, u\.name/i.test(normalizedSql) || /^SELECT posts\.\*/i.test(normalizedSql)) {
    let posts = [...embeddedDb.posts].filter(p => p.is_active);

    // Check query params if user filtered by target user_type or crop or category
    // In our routes we pass params
    return executePostsQuery(normalizedSql, params);
  }

  // 7. POSTS: User posts (GET /posts/user/:userId)
  if (/FROM posts p JOIN users u ON p\.user_id = u\.id WHERE p\.user_id =/i.test(normalizedSql) || /FROM posts WHERE user_id =/i.test(normalizedSql)) {
    const userId = Number(params[0]);
    const user = embeddedDb.users.find(u => u.id === userId);
    let posts = embeddedDb.posts
      .filter(p => p.user_id === userId && p.is_active)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(p => ({
        ...p,
        user_name: user?.name || '',
        name: user?.name || '',
        phone: user?.phone || '',
        district: user?.district || '',
        whatsapp_number: user?.whatsapp_number || user?.phone || ''
      }));
    return { rows: posts, rowCount: posts.length };
  }

  // 8. POSTS: Dealing Done (UPDATE posts SET is_active = false WHERE id = $1)
  if (/UPDATE posts SET is_active = false/i.test(normalizedSql)) {
    const postId = Number(params[0]);
    const post = embeddedDb.posts.find(p => p.id === postId);
    if (post) {
      post.is_active = false;
      post.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...post }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. FPO: INSERT INTO fpo
  if (/^INSERT INTO fpo/i.test(normalizedSql)) {
    const [creator_id, crop_type, required_quantity, grade, location, district, price] = params;
    const newId = embeddedDb.fpo.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const now = new Date().toISOString();
    const newFpo = {
      id: newId,
      creator_id: Number(creator_id),
      crop_type,
      required_quantity: Number(required_quantity),
      current_quantity: 0,
      grade: grade || 'A',
      location: location || '',
      district: district || 'Bengaluru',
      price: Number(price),
      is_active: true,
      created_at: now,
      updated_at: now
    };
    embeddedDb.fpo.push(newFpo);
    saveEmbeddedDb();
    return { rows: [{ ...newFpo }], rowCount: 1 };
  }

  // 10. FPO: SELECT active FPOs
  if (/FROM fpo f JOIN users u ON f\.creator_id = u\.id/i.test(normalizedSql) && /f\.id =/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const fpo = embeddedDb.fpo.find(f => f.id === fpoId);
    if (!fpo) return { rows: [], rowCount: 0 };
    const creator = embeddedDb.users.find(u => u.id === fpo.creator_id);
    return {
      rows: [{
        ...fpo,
        creator_name: creator?.name || 'Unknown',
        creator_phone: creator?.phone || '',
        creator_whatsapp: creator?.whatsapp_number || creator?.phone || ''
      }],
      rowCount: 1
    };
  }

  if (/FROM fpo f JOIN users u ON f\.creator_id = u\.id/i.test(normalizedSql)) {
    let fpos = embeddedDb.fpo.filter(f => f.is_active);
    if (params.length > 0 && params[0]) {
      const districtFilter = params[0].toLowerCase();
      fpos = fpos.filter(f => f.district.toLowerCase() === districtFilter);
    }
    const result = fpos
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(f => {
        const creator = embeddedDb.users.find(u => u.id === f.creator_id);
        return {
          ...f,
          creator_name: creator?.name || 'Unknown',
          creator_phone: creator?.phone || '',
          creator_whatsapp: creator?.whatsapp_number || creator?.phone || ''
        };
      });
    return { rows: result, rowCount: result.length };
  }

  // 11. FPO_JOINS: INSERT INTO fpo_joins
  if (/^INSERT INTO fpo_joins/i.test(normalizedSql)) {
    const [fpo_id, farmer_id, quantity_contributed] = params;
    const newId = embeddedDb.fpo_joins.reduce((max, j) => Math.max(max, j.id), 0) + 1;
    const now = new Date().toISOString();
    const newJoin = {
      id: newId,
      fpo_id: Number(fpo_id),
      farmer_id: Number(farmer_id),
      quantity_contributed: Number(quantity_contributed),
      created_at: now
    };
    embeddedDb.fpo_joins.push(newJoin);
    saveEmbeddedDb();
    return { rows: [{ ...newJoin }], rowCount: 1 };
  }

  // 12. FPO: UPDATE current_quantity
  if (/UPDATE fpo SET current_quantity = current_quantity \+/i.test(normalizedSql)) {
    const [addedQty, fpoId] = params;
    const fpo = embeddedDb.fpo.find(f => f.id === Number(fpoId));
    if (fpo) {
      fpo.current_quantity = Number((Number(fpo.current_quantity || 0) + Number(addedQty)).toFixed(2));
      fpo.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...fpo }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 13. FPO_JOINS: List joined farmers for FPO
  if (/FROM fpo_joins j JOIN users u ON j\.farmer_id = u\.id WHERE j\.fpo_id =/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const joins = embeddedDb.fpo_joins
      .filter(j => j.fpo_id === fpoId)
      .map(j => {
        const farmer = embeddedDb.users.find(u => u.id === j.farmer_id);
        return {
          id: j.id,
          fpo_id: j.fpo_id,
          farmer_id: j.farmer_id,
          farmer_name: farmer?.name || 'Farmer',
          farmer_phone: farmer?.phone || '',
          farmer_whatsapp: farmer?.whatsapp_number || farmer?.phone || '',
          quantity_contributed: j.quantity_contributed,
          created_at: j.created_at
        };
      });
    return { rows: joins, rowCount: joins.length };
  }

  // 14. FPO: COMPLETE (UPDATE fpo SET is_active = false WHERE id = $1)
  if (/UPDATE fpo SET is_active = false/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const fpo = embeddedDb.fpo.find(f => f.id === fpoId);
    if (fpo) {
      fpo.is_active = false;
      fpo.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...fpo }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 14.5 COUNT queries
  if (/^SELECT COUNT\(\*\)/i.test(normalizedSql)) {
    if (/FROM users/i.test(normalizedSql)) {
      if (/WHERE user_type\s*=\s*'farmer'/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.users.filter(u => u.user_type === 'farmer').length) }], rowCount: 1 };
      }
      if (/WHERE user_type\s*=\s*'buyer'/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.users.filter(u => u.user_type === 'buyer').length) }], rowCount: 1 };
      }
      return { rows: [{ count: String(embeddedDb.users.length) }], rowCount: 1 };
    }
    if (/FROM posts/i.test(normalizedSql)) {
      if (/WHERE is_active\s*=\s*true/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.posts.filter(p => p.is_active).length) }], rowCount: 1 };
      }
      if (/WHERE is_active\s*=\s*false/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.posts.filter(p => !p.is_active).length) }], rowCount: 1 };
      }
      return { rows: [{ count: String(embeddedDb.posts.length) }], rowCount: 1 };
    }
    if (/FROM mandi_prices/i.test(normalizedSql)) {
      return { rows: [{ count: String(embeddedDb.mandi_prices.length) }], rowCount: 1 };
    }
    if (/FROM fpo/i.test(normalizedSql)) {
      return { rows: [{ count: String(embeddedDb.fpo.length) }], rowCount: 1 };
    }
    return { rows: [{ count: '0' }], rowCount: 1 };
  }

  // 15. MANDI_PRICES: SELECT
  if (/FROM mandi_prices/i.test(normalizedSql)) {
    // DISTINCT crop_type
    if (/SELECT DISTINCT crop_type FROM mandi_prices/i.test(normalizedSql)) {
      const crops = [...new Set(embeddedDb.mandi_prices.map(m => m.crop_type))].sort();
      return { rows: crops.map(c => ({ crop_type: c })), rowCount: crops.length };
    }

    // DISTINCT district
    if (/SELECT DISTINCT district FROM mandi_prices/i.test(normalizedSql)) {
      const districts = [...new Set(embeddedDb.mandi_prices.map(m => m.district))].sort();
      return { rows: districts.map(d => ({ district: d })), rowCount: districts.length };
    }

    // Filtered mandi prices
    let list = [...embeddedDb.mandi_prices];
    if (normalizedSql.includes('crop_type =') && normalizedSql.includes('district =')) {
      const [crop, dist] = params;
      if (crop) list = list.filter(m => m.crop_type.toLowerCase() === crop.toLowerCase());
      if (dist) list = list.filter(m => m.district.toLowerCase() === dist.toLowerCase());
    } else if (normalizedSql.includes('crop_type =')) {
      const [crop] = params;
      if (crop) list = list.filter(m => m.crop_type.toLowerCase() === crop.toLowerCase());
    } else if (normalizedSql.includes('district =')) {
      const [dist] = params;
      if (dist) list = list.filter(m => m.district.toLowerCase() === dist.toLowerCase());
    }
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { rows: list, rowCount: list.length };
  }

  // 16. MANDI_PRICES: UPDATE OR INSERT
  if (/UPDATE mandi_prices SET price =/i.test(normalizedSql)) {
    const [price, min_price, max_price, crop_type, district] = params;
    const item = embeddedDb.mandi_prices.find(
      m => m.crop_type.toLowerCase() === crop_type.toLowerCase() && m.district.toLowerCase() === district.toLowerCase()
    );
    if (item) {
      item.price = Number(price);
      item.min_price = Number(min_price);
      item.max_price = Number(max_price);
      item.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...item }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (/INSERT INTO mandi_prices/i.test(normalizedSql)) {
    const [crop_type, district, price, min_price, max_price, market_name] = params;
    const newId = embeddedDb.mandi_prices.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const newItem = {
      id: newId,
      crop_type,
      district,
      price: Number(price),
      min_price: Number(min_price),
      max_price: Number(max_price),
      market_name: market_name || `${district} Mandi Yard`,
      updated_at: new Date().toISOString()
    };
    embeddedDb.mandi_prices.push(newItem);
    saveEmbeddedDb();
    return { rows: [{ ...newItem }], rowCount: 1 };
  }

  // 17. ANALYTICS COUNT(*) QUERIES
  if (/COUNT\(\*\) FROM users/i.test(normalizedSql)) {
    if (/WHERE user_type\s*=\s*'farmer'/i.test(normalizedSql)) {
      const count = embeddedDb.users.filter(u => u.user_type === 'farmer').length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    if (/WHERE user_type\s*=\s*'buyer'/i.test(normalizedSql)) {
      const count = embeddedDb.users.filter(u => u.user_type === 'buyer').length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    const count = embeddedDb.users.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM posts/i.test(normalizedSql)) {
    if (/WHERE is_active\s*=\s*true/i.test(normalizedSql)) {
      const count = embeddedDb.posts.filter(p => p.is_active).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    if (/WHERE is_active\s*=\s*false/i.test(normalizedSql)) {
      const count = embeddedDb.posts.filter(p => !p.is_active).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    const count = embeddedDb.posts.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM mandi_prices/i.test(normalizedSql)) {
    const count = embeddedDb.mandi_prices.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM fpo/i.test(normalizedSql)) {
    const count = embeddedDb.fpo.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  console.warn('[DB] Fallback unhandled query:', normalizedSql);
  return { rows: [], rowCount: 0 };
}

function executePostsQuery(sql, params) {
  let posts = embeddedDb.posts.filter(p => p.is_active);

  // Match compound checks
  if (sql.includes("p.user_type = 'farmer' OR p.category = 'produce'")) {
    posts = posts.filter(p => p.user_type === 'farmer' || p.category === 'produce');
  } else if (sql.includes("p.user_type = 'buyer' OR p.category = 'requirement'")) {
    posts = posts.filter(p => p.user_type === 'buyer' || p.category === 'requirement');
  } else if (/p\.user_type = \$/i.test(sql) && params && params.length > 0) {
    const targetUserType = params[0];
    posts = posts.filter(p => p.user_type === targetUserType);
  }

  // Parse crop_type filter
  if (/crop_type/i.test(sql) && params && params.length > 0) {
    const cropParam = params.find(p => p !== 'farmer' && p !== 'buyer' && p !== 'produce' && p !== 'requirement' && typeof p === 'string');
    if (cropParam) {
      posts = posts.filter(p => p.crop_type && p.crop_type.toLowerCase() === cropParam.toLowerCase());
    }
  }

  // Parse category filter
  if (/p\.category = \$/i.test(sql) && params && params.length > 0) {
    const categoryParam = params.find(p => p === 'produce' || p === 'requirement');
    if (categoryParam) {
      posts = posts.filter(p => p.category === categoryParam);
    }
  }

  const result = posts
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(p => {
      const user = embeddedDb.users.find(u => u.id === p.user_id);
      return {
        ...p,
        user_name: user?.name || 'User',
        name: user?.name || 'User',
        phone: user?.phone || '',
        district: user?.district || '',
        whatsapp_number: user?.whatsapp_number || user?.phone || ''
      };
    });

  return { rows: result, rowCount: result.length };
}

async function query(text, params) {
  if (usePg && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      console.error('[DB] PostgreSQL query failed, attempting embedded query:', err.message);
      return queryEmbedded(text, params);
    }
  }
  return queryEmbedded(text, params);
}

module.exports = {
  initDb,
  query,
  getEmbeddedDb: () => embeddedDb
};
