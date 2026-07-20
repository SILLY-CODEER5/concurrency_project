require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSQL() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing init.sql...');
    await client.query(sql);

    console.log('Successfully created tables and seeded data!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
  }
}

runSQL();
