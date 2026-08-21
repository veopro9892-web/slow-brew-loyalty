import { getSql, ensureSchema } from './db';
import { Customer, Reward, Offer, DEFAULT_OFFERS } from './types';
import { v4 as uuidv4 } from 'uuid';

// --- Helpers ---

function rowToCustomer(row: any, rewards: any[]): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    stamps: row.stamps,
    createdAt: row.created_at,
    lastVisit: row.last_visit,
    rewards: rewards.map((r: any) => ({
      id: r.id,
      level: r.level,
      title: r.title,
      description: r.description,
      code: r.code,
      redeemed: r.redeemed,
      redeemedAt: r.redeemed_at,
      unlockedAt: r.unlocked_at,
    })),
  };
}

function rowToReward(r: any): Reward {
  return {
    id: r.id,
    level: r.level,
    title: r.title,
    description: r.description,
    code: r.code,
    redeemed: r.redeemed,
    redeemedAt: r.redeemed_at,
    unlockedAt: r.unlocked_at,
  };
}

// --- Customers ---

export async function serverGetAllCustomers(): Promise<Customer[]> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM customers ORDER BY stamps DESC`;
  const customers: Customer[] = [];
  for (const row of rows) {
    const rewards: any[] = await sql`SELECT * FROM rewards WHERE customer_id = ${row.id} ORDER BY level`;
    customers.push(rowToCustomer(row, rewards));
  }
  return customers;
}

export async function serverFindCustomerByEmail(email: string): Promise<Customer | null> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM customers WHERE LOWER(email) = LOWER(${email})`;
  if (rows.length === 0) return null;
  const row = rows[0];
  const rewards: any[] = await sql`SELECT * FROM rewards WHERE customer_id = ${row.id} ORDER BY level`;
  return rowToCustomer(row, rewards);
}

export async function serverFindCustomerById(id: string): Promise<Customer | null> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (rows.length === 0) return null;
  const row = rows[0];
  const rewards: any[] = await sql`SELECT * FROM rewards WHERE customer_id = ${row.id} ORDER BY level`;
  return rowToCustomer(row, rewards);
}

export async function serverCreateCustomer(name: string, email: string, preferredId?: string): Promise<Customer> {
  await ensureSchema();
  const sql = getSql();
  const existing = await serverFindCustomerByEmail(email);
  if (existing) {
    if (existing.name !== name) {
      await sql`UPDATE customers SET name = ${name} WHERE id = ${existing.id}`;
      existing.name = name;
    }
    const now = new Date().toISOString();
    await sql`UPDATE customers SET last_visit = ${now} WHERE id = ${existing.id}`;
    existing.lastVisit = now;
    return existing;
  }

  const id = preferredId || uuidv4();
  const now = new Date().toISOString();
  await sql`INSERT INTO customers (id, name, email, stamps, created_at, last_visit) VALUES (${id}, ${name}, ${email}, 0, ${now}, ${now})`;
  return { id, name, email, stamps: 0, createdAt: now, lastVisit: now, rewards: [] };
}

export async function serverUpdateCustomer(customer: Customer): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`UPDATE customers SET name = ${customer.name}, stamps = ${customer.stamps}, last_visit = ${customer.lastVisit} WHERE id = ${customer.id}`;
}

export async function serverAdjustStamps(
  customerId: string,
  delta: number,
): Promise<{ customer: Customer | null; newReward: Reward | null }> {
  await ensureSchema();
  const sql = getSql();
  const customer = await serverFindCustomerById(customerId);
  if (!customer) return { customer: null, newReward: null };

  const newStamps = Math.max(0, Math.min(30, customer.stamps + delta));
  if (newStamps === customer.stamps) return { customer, newReward: null };

  let newReward: Reward | null = null;
  if (delta > 0) {
    const offer = await serverGetOfferForLevel(newStamps);
    if (offer && !customer.rewards.some(r => r.level === newStamps)) {
      newReward = {
        id: uuidv4(),
        level: newStamps,
        title: offer.title,
        description: offer.description,
        code: generateSecureCode(),
        redeemed: false,
        unlockedAt: new Date().toISOString(),
      };
      await sql`INSERT INTO rewards (id, customer_id, level, title, description, code, redeemed, unlocked_at) VALUES (${newReward.id}, ${customerId}, ${newReward.level}, ${newReward.title}, ${newReward.description}, ${newReward.code}, false, ${newReward.unlockedAt})`;
    }
  }

  const now = new Date().toISOString();
  await sql`UPDATE customers SET stamps = ${newStamps}, last_visit = ${now} WHERE id = ${customerId}`;
  customer.stamps = newStamps;
  customer.lastVisit = now;
  if (newReward) customer.rewards.push(newReward);

  return { customer, newReward };
}

export async function serverRedeemReward(
  customerId: string,
  rewardId: string,
): Promise<Customer | null> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`UPDATE rewards SET redeemed = true, redeemed_at = ${now} WHERE id = ${rewardId} AND customer_id = ${customerId}`;
  return serverFindCustomerById(customerId);
}

export async function serverAddStamp(
  customerId: string,
): Promise<{ customer: Customer | null; newReward: Reward | null }> {
  return serverAdjustStamps(customerId, 1);
}

// --- Offers ---

export async function serverGetOffers(): Promise<Offer[]> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM offers ORDER BY level`;
  if (rows.length === 0) {
    for (const o of DEFAULT_OFFERS) {
      await sql`INSERT INTO offers (level, title, description, icon) VALUES (${o.level}, ${o.title}, ${o.description}, ${o.icon}) ON CONFLICT (level) DO NOTHING`;
    }
    return DEFAULT_OFFERS;
  }
  return rows.map((r: any) => ({ level: r.level, title: r.title, description: r.description, icon: r.icon }));
}

export async function serverGetOfferForLevel(level: number): Promise<Offer | undefined> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM offers WHERE level = ${level}`;
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return { level: r.level, title: r.title, description: r.description, icon: r.icon };
}

export async function serverUpsertOffer(offer: Offer): Promise<Offer[]> {
  await ensureSchema();
  const sql = getSql();
  await sql`INSERT INTO offers (level, title, description, icon) VALUES (${offer.level}, ${offer.title}, ${offer.description}, ${offer.icon}) ON CONFLICT (level) DO UPDATE SET title = ${offer.title}, description = ${offer.description}, icon = ${offer.icon}`;
  return serverGetOffers();
}

export async function serverDeleteOffer(level: number): Promise<Offer[]> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM offers WHERE level = ${level}`;
  return serverGetOffers();
}

// --- Helpers ---

function generateSecureCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(6);
  globalThis.crypto.getRandomValues(arr);
  return 'SB-' + Array.from(arr, b => chars[b % chars.length]).join('');
}
