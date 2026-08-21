import { Customer, Reward, Offer, DEFAULT_OFFERS } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'slowbrew_customer';
const ALL_CUSTOMERS_KEY = 'slowbrew_all_customers';
const OFFERS_KEY = 'slowbrew_offers';

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getCustomer(): Customer | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Customer;
  } catch {
    return null;
  }
}

export function findCustomerByEmail(email: string): Customer | null {
  const all = getAllCustomers();
  return all.find(c => c.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function createCustomer(name: string, email: string): Customer {
  // If a customer with this email already exists, return them instead of creating a duplicate
  const existing = findCustomerByEmail(email);
  if (existing) {
    // Update name if it changed (e.g. user corrected a typo)
    if (existing.name !== name) {
      existing.name = name;
      updateInAllCustomers(existing);
    }
    existing.lastVisit = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
  addToAllCustomers(customer);
  return customer;
}

export function addStamp(customer: Customer): { customer: Customer; newReward: Reward | null } {
  const newStamps = customer.stamps + 1;
  const offer = getOfferForLevel(newStamps);
  let newReward: Reward | null = null;

  if (offer) {
    newReward = {
      id: uuidv4(),
      level: newStamps,
      title: offer.title,
      description: offer.description,
      code: generateVoucherCode(),
      redeemed: false,
      unlockedAt: new Date().toISOString(),
    };
  }

  const updated: Customer = {
    ...customer,
    stamps: newStamps,
    lastVisit: new Date().toISOString(),
    rewards: newReward ? [...customer.rewards, newReward] : customer.rewards,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  updateInAllCustomers(updated);
  return { customer: updated, newReward };
}

/**
 * Admin: directly add or remove stamps (delta can be negative).
 * Clamps stamps to 0–30 and generates a reward if a milestone is crossed upward.
 */
export function adjustStamps(
  customer: Customer,
  delta: number,
): { customer: Customer; newReward: Reward | null } {
  const newStamps = Math.max(0, Math.min(30, customer.stamps + delta));
  if (newStamps === customer.stamps) return { customer, newReward: null };

  let newReward: Reward | null = null;

  // Only generate a reward when stamping UP past a milestone
  if (delta > 0) {
    const offer = getOfferForLevel(newStamps);
    if (offer) {
      // Only grant if the customer didn't already have this reward
      const alreadyHas = customer.rewards.some(r => r.level === newStamps);
      if (!alreadyHas) {
        newReward = {
          id: uuidv4(),
          level: newStamps,
          title: offer.title,
          description: offer.description,
          code: generateVoucherCode(),
          redeemed: false,
          unlockedAt: new Date().toISOString(),
        };
      }
    }
  }

  const updated: Customer = {
    ...customer,
    stamps: newStamps,
    lastVisit: new Date().toISOString(),
    rewards: newReward ? [...customer.rewards, newReward] : customer.rewards,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  updateInAllCustomers(updated);
  return { customer: updated, newReward };
}

export function redeemReward(customer: Customer, rewardId: string): Customer {
  const updated: Customer = {
    ...customer,
    rewards: customer.rewards.map(r =>
      r.id === rewardId ? { ...r, redeemed: true, redeemedAt: new Date().toISOString() } : r
    ),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  updateInAllCustomers(updated);
  return updated;
}

// --- All customers (for admin) ---

function addToAllCustomers(customer: Customer): void {
  const all = getAllCustomers();
  all.push(customer);
  localStorage.setItem(ALL_CUSTOMERS_KEY, JSON.stringify(all));
}

function updateInAllCustomers(customer: Customer): void {
  const all = getAllCustomers();
  const idx = all.findIndex(c => c.id === customer.id);
  if (idx >= 0) {
    all[idx] = customer;
  } else {
    all.push(customer);
  }
  localStorage.setItem(ALL_CUSTOMERS_KEY, JSON.stringify(all));
}

export function getAllCustomers(): Customer[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ALL_CUSTOMERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as Customer[];
  } catch {
    return [];
  }
}

// --- Offers (admin-managed rewards, one per level) ---

function sortByLevel(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => a.level - b.level);
}

export function getOffers(): Offer[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(OFFERS_KEY);
  if (!data) {
    // First run: seed with the built-in rewards so the default experience is preserved.
    saveOffers(DEFAULT_OFFERS);
    return sortByLevel(DEFAULT_OFFERS);
  }
  try {
    return sortByLevel(JSON.parse(data) as Offer[]);
  } catch {
    return [];
  }
}

export function saveOffers(offers: Offer[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OFFERS_KEY, JSON.stringify(sortByLevel(offers)));
}

export function getOfferForLevel(level: number): Offer | undefined {
  return getOffers().find(o => o.level === level);
}

// Insert the offer, or replace an existing offer at the same level (one per level).
export function upsertOffer(offer: Offer): Offer[] {
  const offers = getOffers().filter(o => o.level !== offer.level);
  offers.push(offer);
  const sorted = sortByLevel(offers);
  saveOffers(sorted);
  return sorted;
}

export function deleteOffer(level: number): Offer[] {
  const offers = getOffers().filter(o => o.level !== level);
  saveOffers(offers);
  return offers;
}
