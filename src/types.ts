// Core data model for Networth Phase 1 (local-first, single user).
// The whole app is three ideas: people, the skills they have, and how you
// reach them. Everything else is derived from these.

export type Availability = 'available' | 'busy' | 'unknown';

export interface Person {
  id: string;
  name: string;
  /** How you know them, e.g. "uncle", "college friend", "neighbour". */
  relationship: string;
  /** Free-form skill/expertise tags. Display-cased; matched case-insensitively. */
  skills: string[];
  phone?: string;
  email?: string;
  /** Anything you want to remember about them. */
  notes?: string;
  /** Your note on whether they can help right now (Phase 1 is your own read). */
  availability: Availability;
  /** Optional: the person who introduced you to them — seed of referral chains. */
  referredById?: string;
  createdAt: number;
}

export type NewPerson = Omit<Person, 'id' | 'createdAt'>;
