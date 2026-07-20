const { Client } = require('pg');

async function checkDb() {
  const url = 'postgresql://postgres:Saksham7%28%29%7B%7D@db.xkgzswerjnhbsokxesbf.supabase.co:6543/postgres';
  console.log('Testing port 6543...');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as connected');
    console.log('Connection successful!', res.rows);
  } catch (e) {
    console.error('Connection Failed:', e.message);
  } finally {
    await client.end();
  }
}
checkDb();
