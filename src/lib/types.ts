export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stamps: number;
  createdAt: string;
  lastVisit: string;
  rewards: Reward[];
}

export interface Reward {
  id: string;
  level: number;
  title: string;
  description: string;
  code: string;
  redeemed: boolean;
  redeemedAt?: string;
  unlockedAt: string;
}

export interface LevelConfig {
  level: number;
  title: string;
  icon: string;
}

// An offer is a reward the shop attaches to a level. Offers are editable data
// (managed by the admin, persisted in localStorage) — see lib/storage.ts.
export interface Offer {
  level: number;        // 1–30, unique per offer
  title: string;        // shown in the celebration + rewards list
  description: string;
  icon: string;         // emoji for the golden stamp / progress markers
}

export const DEFAULT_LEVEL_OFFER_ICON = '🎁';

// The four built-in rewards. Used to seed a fresh install so the out-of-the-box
// experience is unchanged. Once seeded, the admin fully owns this list.
export const DEFAULT_OFFERS: Offer[] = [
  {
    level: 8,
    title: 'Free Cookie!',
    description: 'Enjoy a free cookie of your choice with your next visit!',
    icon: '🍪',
  },
  {
    level: 16,
    title: 'Free Pastry!',
    description: 'Pick any pastry on the house! You\'ve earned it.',
    icon: '🥐',
  },
  {
    level: 24,
    title: 'Free Drink!',
    description: 'Any drink on the menu, completely free. You\'re royalty now!',
    icon: '👑',
  },
  {
    level: 30,
    title: 'The Grand Prize!',
    description: 'You\'ve reached the pinnacle! Enjoy a free drink + cookie + pastry combo! Plus, your name goes on our Wall of Legends!',
    icon: '🏆',
  },
];

// Cosmetic ladder: the name + icon shown for each of the 30 levels. Rewards are
// no longer baked in here — they live in Offer data (see DEFAULT_OFFERS above).
export const LEVEL_CONFIGS: LevelConfig[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1;

  let title = '';
  let icon = '';

  if (level <= 3) {
    title = ['First Sip', 'Regular?', 'Bean There'][i];
    icon = ['☕', '☕', '☕'][i];
  } else if (level <= 7) {
    title = ['Warming Up', 'Daily Dose', 'Brew Buddy', 'Almost!'][level - 4];
    icon = ['☕', '🫖', '☕', '✨'][level - 4];
  } else if (level === 8) {
    title = 'Cookie Monster';
    icon = '🍪';
  } else if (level <= 15) {
    const names = ['Caffeine Lover', 'Espresso Shot', 'Foam Artist', 'Bean Counter', 'Drip Drop', 'Pour Perfect', 'Steam Dream'];
    const icons = ['❤️', '⚡', '🎨', '📊', '💧', '👌', '💨'];
    title = names[level - 9];
    icon = icons[level - 9];
  } else if (level === 16) {
    title = 'Pastry Pro';
    icon = '🥐';
  } else if (level <= 23) {
    const names = ['Grinder', 'Barista Buddy', 'Cup Collector', 'Roast Master', 'Blend Boss', 'Aroma King', 'Latte Legend', 'Almost Elite!'];
    const icons = ['🔄', '🤝', '🏆', '🔥', '🌀', '👑', '🥇', '🌟'];
    title = names[level - 17];
    icon = icons[level - 17];
  } else if (level === 24) {
    title = 'Coffee Royalty';
    icon = '👑';
  } else if (level <= 29) {
    const names = ['Legendary', 'Mythical Mug', 'Grand Grinder', 'Supreme Sipper', 'Ultimate Brew'];
    const icons = ['⭐', '🏅', '💎', '🎯', '🚀'];
    title = names[level - 25];
    icon = icons[level - 25];
  } else {
    title = 'Slow Brew Legend';
    icon = '🏆';
  }

  return { level, title, icon };
});
