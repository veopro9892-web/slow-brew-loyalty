import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Customer, Reward, Offer, DEFAULT_OFFERS } from './types';
import { v4 as uuidv4 } from 'uuid';

function getDataDir(): string {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getCustomersPath(): string {
  return join(getDataDir(), 'customers.json');
}

function getOffersPath(): string {
  return join(getDataDir(), 'offers.json');
}

// --- Customers ---

function readCustomers(): Customer[] {
  const path = getCustomersPath();
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Customer[];
  } catch {
    return [];
  }
}

function writeCustomers(customers: Customer[]): void {
  writeFileSync(getCustomersPath(), JSON.stringify(customers, null, 2), 'utf-8');
}

export function serverGetAllCustomers(): Customer[] {
  return readCustomers().sort((a, b) => b.stamps - a.stamps);
}

export function serverFindCustomerByEmail(email: string): Customer | null {
  return readCustomers().find(c => c.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function serverFindCustomerById(id: string): Customer | null {
  return readCustomers().find(c => c.id === id) ?? null;
}

export function serverCreateCustomer(name: string, email: string): Customer {
  const customers = readCustomers();
  const existing = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (existing.name !== name) existing.name = name;
    existing.lastVisit = new Date().toISOString();
    writeCustomers(customers);
    return existing;
  }

  const customer: Customer = {
    id: uuidv4(),
    name,
    email,
    stamps: 0,
    createdAt: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    rewards: [],
  };
  customers.push(customer);
  writeCustomers(customers);
  return customer;
}

export function serverUpdateCustomer(customer: Customer): void {
  const customers = readCustomers();
  const idx = customers.findIndex(c => c.id === customer.id);
  if (idx >= 0) {
    customers[idx] = customer;
  } else {
    customers.push(customer);
  }
  writeCustomers(customers);
}

export function serverAdjustStamps(
  customerId: string,
  delta: number,
): { customer: Customer | null; newReward: Reward | null } {
  const customers = readCustomers();
  const idx = customers.findIndex(c => c.id === customerId);
  if (idx < 0) return { customer: null, newReward: null };

  const customer = customers[idx];
  const newStamps = Math.max(0, Math.min(30, customer.stamps + delta));
  if (newStamps === customer.stamps) return { customer, newReward: null };

  let newReward: Reward | null = null;
  if (delta > 0) {
    const offer = serverGetOfferForLevel(newStamps);
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
    }
  }

  customer.stamps = newStamps;
  customer.lastVisit = new Date().toISOString();
  if (newReward) customer.rewards.push(newReward);

  customers[idx] = customer;
  writeCustomers(customers);
  return { customer, newReward };
}

export function serverRedeemReward(
  customerId: string,
  rewardId: string,
): Customer | null {
  const customers = readCustomers();
  const idx = customers.findIndex(c => c.id === customerId);
  if (idx < 0) return null;

  const customer = customers[idx];
  customer.rewards = customer.rewards.map(r =>
    r.id === rewardId ? { ...r, redeemed: true, redeemedAt: new Date().toISOString() } : r,
  );

  customers[idx] = customer;
  writeCustomers(customers);
  return customer;
}

export function serverAddStamp(
  customerId: string,
): { customer: Customer | null; newReward: Reward | null } {
  return serverAdjustStamps(customerId, 1);
}

// --- Offers ---

function readOffers(): Offer[] {
  const path = getOffersPath();
  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify(DEFAULT_OFFERS, null, 2), 'utf-8');
    return DEFAULT_OFFERS;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Offer[];
  } catch {
    return DEFAULT_OFFERS;
  }
}

function writeOffers(offers: Offer[]): void {
  writeFileSync(getOffersPath(), JSON.stringify(offers.sort((a, b) => a.level - b.level), null, 2), 'utf-8');
}

export function serverGetOffers(): Offer[] {
  return readOffers().sort((a, b) => a.level - b.level);
}

export function serverGetOfferForLevel(level: number): Offer | undefined {
  return readOffers().find(o => o.level === level);
}

export function serverUpsertOffer(offer: Offer): Offer[] {
  const offers = readOffers().filter(o => o.level !== offer.level);
  offers.push(offer);
  writeOffers(offers);
  return serverGetOffers();
}

export function serverDeleteOffer(level: number): Offer[] {
  const offers = readOffers().filter(o => o.level !== level);
  writeOffers(offers);
  return serverGetOffers();
}

// --- Helpers ---

function generateSecureCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(6);
  globalThis.crypto.getRandomValues(arr);
  return 'SB-' + Array.from(arr, b => chars[b % chars.length]).join('');
}
