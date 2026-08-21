import { neon } from '@neondatabase/serverless';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Please add it to your environment variables.');
    _sql = neon(url);
  }
  return _sql;
}

// Initialize tables on first import
let initialized = false;

export async function ensureSchema() {
  if (initialized) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      stamps INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_visit TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      level INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      code TEXT NOT NULL,
      redeemed BOOLEAN NOT NULL DEFAULT false,
      redeemed_at TEXT,
      unlocked_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS offers (
      level INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stamp_requests (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT
    )
  `;

  initialized = true;
}
