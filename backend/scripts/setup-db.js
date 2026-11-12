/**
 * Creates the `green_corner` role and database on the local PostgreSQL
 * server. Run with: node scripts/setup-db.js
 *
 * The superuser password is read from PGPASSWORD / SUPERUSER_PASSWORD.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPERUSER = process.env.SUPERUSER || 'postgres';
const SUPERUSER_PASSWORD =
  process.env.SUPERUSER_PASSWORD ||
  process.env.PGPASSWORD ||
  'green_corner';
const DB_NAME = process.env.DB_NAME || 'green_corner';
const DB_USER = process.env.DB_USER || 'green_corner';
const DB_PASSWORD = process.env.DB_PASSWORD || 'green_corner';
const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '5432';

async function main() {
  const client = new Client({
    host: HOST,
    port: Number(PORT),
    user: SUPERUSER,
    password: SUPERUSER_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  console.log(`Connected to ${HOST}:${PORT} as ${SUPERUSER}`);

  const roleResult = await client.query(
    `SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'`,
  );

  if (roleResult.rowCount === 0) {
    await client.query(
      `CREATE ROLE "${DB_USER}" WITH LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB`,
    );
    console.log(`Created role "${DB_USER}"`);
  } else {
    await client.query(
      `ALTER ROLE "${DB_USER}" WITH LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB`,
    );
    console.log(`Role "${DB_USER}" already exists — password reset`);
  }

  const dbResult = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`,
  );

  if (dbResult.rowCount === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}"`);
    console.log(`Created database "${DB_NAME}"`);
  } else {
    console.log(`Database "${DB_NAME}" already exists`);
  }

  await client.end();
  console.log('\nDone. DATABASE_URL is ready in backend/.env');
}

main().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
