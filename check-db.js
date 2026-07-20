require('dotenv').config();
const { Client } = require('pg');

async function checkDb() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM events LIMIT 1');
    console.log('Events found:', res.rows.length);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
checkDb();
