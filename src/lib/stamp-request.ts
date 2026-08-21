import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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

function getDataDir(): string {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getDbPath(): string {
  return join(getDataDir(), 'stamp-requests.json');
}

function ensureDb(): StampRequest[] {
  const path = getDbPath();
  if (!existsSync(path)) {
    writeFileSync(path, '[]', 'utf-8');
    return [];
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as StampRequest[];
  } catch {
    return [];
  }
}

function saveDb(requests: StampRequest[]): void {
  writeFileSync(getDbPath(), JSON.stringify(requests, null, 2), 'utf-8');
}

export function createRequest(
  customerId: string,
): StampRequest | null {
  // Validate that this customer exists on the server
  const customer = serverFindCustomerById(customerId);
  if (!customer) return null;

  const requests = ensureDb();

  // Rate limit: max 3 pending requests per customer at a time
  const pendingCount = requests.filter(
    r => r.customerId === customerId && r.status === 'pending',
  ).length;
  if (pendingCount >= 3) return null;

  // Collect all existing tokens (pending + resolved) to guarantee uniqueness
  const allTokens = new Set(requests.map(r => r.token));
  const token = generateToken(allTokens);
  const req: StampRequest = {
    id: crypto.randomUUID(),
    customerId,
    customerName: customer.name, // Use server-side name, not client-supplied
    token,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  saveDb(requests);
  return req;
}

export function getPendingRequests(): StampRequest[] {
  return ensureDb().filter(r => r.status === 'pending');
}

export function approveRequest(token: string): StampRequest | null {
  const requests = ensureDb();
  const req = requests.find(r => r.token === token && r.status === 'pending');
  if (!req) return null;
  req.status = 'approved';
  req.resolvedAt = new Date().toISOString();
  saveDb(requests);
  return req;
}

export function denyRequest(token: string): StampRequest | null {
  const requests = ensureDb();
  const req = requests.find(r => r.token === token && r.status === 'pending');
  if (!req) return null;
  req.status = 'denied';
  req.resolvedAt = new Date().toISOString();
  saveDb(requests);
  return req;
}

export function getRequestByCustomerId(customerId: string): StampRequest | null {
  const requests = ensureDb();
  const pending = requests
    .filter(r => r.customerId === customerId && r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return pending[0] ?? null;
}

// Generate a unique 4-digit numeric token (0000–9999)
function generateToken(existingTokens: Set<string>): string {
  const arr = new Uint8Array(2);
  let token: string;

  // Regenerate if collision (max 10,000 possible — should never loop more than a few times)
  do {
    globalThis.crypto.getRandomValues(arr);
    // Map to 0000–9999
    const num = (arr[0] * 256 + arr[1]) % 10000;
    token = String(num).padStart(4, '0');
  } while (existingTokens.has(token));

  return token;
}
