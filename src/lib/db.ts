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
      phone TEXT DEFAULT '',
      stamps INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_visit TEXT NOT NULL
    )
  `;

  // Add phone column if missing (migration for existing DBs)
  try {
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`;
  } catch { /* column already exists */ }


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

  // Seed default offers if table is empty
  const offerCount: any[] = await sql`SELECT COUNT(*)::int as cnt FROM offers`;
  if (offerCount[0].cnt === 0) {
    await sql`INSERT INTO offers (level, title, description, icon) VALUES (8, 'Free Cookie!', 'Enjoy a free cookie of your choice with your next visit!', '🍪')`;
    await sql`INSERT INTO offers (level, title, description, icon) VALUES (16, 'Free Pastry!', 'Pick any pastry on the house! You''ve earned it.', '🥐')`;
    await sql`INSERT INTO offers (level, title, description, icon) VALUES (24, 'Free Drink!', 'Any drink on the menu, completely free. You''re royalty now!', '👑')`;
    await sql`INSERT INTO offers (level, title, description, icon) VALUES (30, 'The Grand Prize!', 'You''ve reached the pinnacle! Enjoy a free drink + cookie + pastry combo! Plus, your name goes on our Wall of Legends!', '🏆')`;
  }

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
