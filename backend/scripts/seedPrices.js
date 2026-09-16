require('dotenv').config();
const db = require('../db');

async function seed() {
  console.log('[SEED] Initializing seed data for mandi prices and users...');
  await db.initDb();

  const crops = await db.query('SELECT COUNT(*) FROM mandi_prices');
  const users = await db.query('SELECT COUNT(*) FROM users');

  console.log(`[SEED] Success! Mandi prices count: ${crops.rows[0]?.count}, Users count: ${users.rows[0]?.count}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
