import type { Person } from '../types';

// A tiny sample network so the app is alive on first launch instead of an empty
// void. Marked so we can tell "example" data apart; the user can wipe it from
// the Me tab with one tap. IDs are stable strings so referral links resolve.
export const seedPeople: Person[] = [
  {
    id: 'seed-rashid',
    name: 'Rashid',
    relationship: 'uncle',
    skills: ['Marketing', 'Catering', 'Cattle'],
    phone: '',
    notes: 'Runs his own marketing shop. Knows caterers and a few cattle owners.',
    availability: 'available',
    createdAt: 1,
  },
  {
    id: 'seed-salman',
    name: 'Salman',
    relationship: 'caterer',
    skills: ['Catering', 'Event food'],
    notes: 'Wedding and event catering. Introduced by Rashid.',
    availability: 'unknown',
    referredById: 'seed-rashid',
    createdAt: 2,
  },
  {
    id: 'seed-imran',
    name: 'Imran',
    relationship: 'photographer',
    skills: ['Photography', 'Events'],
    notes: 'Event photographer. Salman works with him at weddings.',
    availability: 'available',
    referredById: 'seed-salman',
    createdAt: 3,
  },
  {
    id: 'seed-nadia',
    name: 'Nadia',
    relationship: 'friend',
    skills: ['Catering', 'Baking'],
    notes: 'Home-based event food and desserts. Introduced by Rashid.',
    availability: 'available',
    referredById: 'seed-rashid',
    createdAt: 4,
  },
  {
    id: 'seed-bilal',
    name: 'Bilal',
    relationship: 'school friend',
    skills: ['Cars', 'Mechanics'],
    notes: 'Knows used cars and a trustworthy workshop.',
    availability: 'busy',
    createdAt: 5,
  },
  {
    id: 'seed-omar',
    name: 'Omar',
    relationship: 'cousin',
    skills: ['Mobiles', 'Electronics', 'Repairs'],
    notes: 'Great with phones and gadgets, wholesale contacts.',
    availability: 'available',
    createdAt: 6,
  },
];
