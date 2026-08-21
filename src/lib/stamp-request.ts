import { getSql, ensureSchema } from './db';
import { serverFindCustomerById } from './server-db';

export interface StampRequest {
  id: string;
  customerId: string;
  customerName: string;
  token: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  resolvedAt?: string;
}

function rowToRequest(r: any): StampRequest {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    token: r.token,
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  };
}

export async function createRequest(
  customerId: string,
): Promise<StampRequest | null> {
  await ensureSchema();
  const sql = getSql();
  const customer = await serverFindCustomerById(customerId);
  if (!customer) return null;

  const pending: any[] = await sql`SELECT COUNT(*)::int as cnt FROM stamp_requests WHERE customer_id = ${customerId} AND status = 'pending'`;
  if (pending[0].cnt >= 3) return null;

  const existing: any[] = await sql`SELECT token FROM stamp_requests`;
  const allTokens = new Set(existing.map((r: any) => r.token));
  const token = generateToken(allTokens);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await sql`INSERT INTO stamp_requests (id, customer_id, customer_name, token, status, created_at) VALUES (${id}, ${customerId}, ${customer.name}, ${token}, 'pending', ${now})`;

  return { id, customerId, customerName: customer.name, token, status: 'pending', createdAt: now };
}

export async function getPendingRequests(): Promise<StampRequest[]> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM stamp_requests WHERE status = 'pending' ORDER BY created_at DESC`;
  return rows.map(rowToRequest);
}

export async function approveRequest(token: string): Promise<StampRequest | null> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM stamp_requests WHERE token = ${token} AND status = 'pending'`;
  if (rows.length === 0) return null;
  const now = new Date().toISOString();
  await sql`UPDATE stamp_requests SET status = 'approved', resolved_at = ${now} WHERE token = ${token} AND status = 'pending'`;
  return rowToRequest({ ...rows[0], status: 'approved', resolved_at: now });
}

export async function denyRequest(token: string): Promise<StampRequest | null> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM stamp_requests WHERE token = ${token} AND status = 'pending'`;
  if (rows.length === 0) return null;
  const now = new Date().toISOString();
  await sql`UPDATE stamp_requests SET status = 'denied', resolved_at = ${now} WHERE token = ${token} AND status = 'pending'`;
  return rowToRequest({ ...rows[0], status: 'denied', resolved_at: now });
}

export async function getRequestByCustomerId(customerId: string): Promise<StampRequest | null> {
  await ensureSchema();
  const sql = getSql();
  const rows: any[] = await sql`SELECT * FROM stamp_requests WHERE customer_id = ${customerId} AND status = 'pending' ORDER BY created_at DESC LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToRequest(rows[0]);
}

function generateToken(existingTokens: Set<string>): string {
  const arr = new Uint8Array(2);
  let token: string;
  do {
    globalThis.crypto.getRandomValues(arr);
    const num = (arr[0] * 256 + arr[1]) % 10000;
    token = String(num).padStart(4, '0');
  } while (existingTokens.has(token));
  return token;
}
