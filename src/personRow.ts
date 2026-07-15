import type { Person } from './types';

// Maps between the local Person and the Supabase `people` row, and merges a
// remote set into a local set with last-write-wins on updated_at.

export interface PersonRow {
  id: string;
  owner: string;
  name: string;
  relationship: string;
  skills: string[];
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  availability: string;
  referred_by_id: string | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

const stamp = (p: Person) => p.updatedAt ?? p.createdAt ?? 0;

export function personToRow(p: Person, owner: string): PersonRow {
  return {
    id: p.id,
    owner,
    name: p.name,
    relationship: p.relationship ?? '',
    skills: p.skills ?? [],
    phone: p.phone ?? null,
    email: p.email ?? null,
    city: p.city ?? null,
    address: p.address ?? null,
    notes: p.notes ?? null,
    availability: p.availability,
    referred_by_id: p.referredById ?? null,
    created_at: p.createdAt ?? Date.now(),
    updated_at: stamp(p),
    deleted: false,
  };
}

export function rowToPerson(r: PersonRow): Person {
  return {
    id: r.id,
    name: r.name,
    relationship: r.relationship ?? '',
    skills: Array.isArray(r.skills) ? r.skills : [],
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    city: r.city ?? undefined,
    address: r.address ?? undefined,
    notes: r.notes ?? undefined,
    availability: (r.availability as Person['availability']) ?? 'unknown',
    referredById: r.referred_by_id ?? undefined,
    createdAt: r.created_at ?? Date.now(),
    updatedAt: r.updated_at ?? r.created_at ?? Date.now(),
  };
}

/**
 * Merge remote rows into local people, last-write-wins on the timestamp. Remote
 * rows flagged deleted act as tombstones. Local wins on ties/older remote.
 */
export function mergeLocalRemote(local: Person[], remote: PersonRow[]): Person[] {
  const byId = new Map(local.map((p) => [p.id, p]));
  for (const r of remote) {
    const rU = r.updated_at ?? r.created_at ?? 0;
    const localP = byId.get(r.id);
    const lU = localP ? stamp(localP) : -1;
    if (rU > lU) {
      if (r.deleted) byId.delete(r.id);
      else byId.set(r.id, rowToPerson(r));
    }
  }
  return [...byId.values()].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
