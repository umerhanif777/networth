import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NewPerson, Person } from './types';
import { seedPeople } from './data/seed';

const STORAGE_KEY = 'networth.people.v1';
const SEED_FLAG = 'networth.seeded.v1';

// --- id generation (no external uuid dep needed for local single-user) ---
function makeId() {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface Store {
  people: Person[];
  loading: boolean;
  addPerson: (p: NewPerson) => Person;
  updatePerson: (id: string, patch: Partial<NewPerson>) => void;
  removePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;
  /** Every distinct skill across the network, with a count, sorted by frequency. */
  allSkills: { name: string; count: number }[];
  clearAll: () => void;
  restoreSample: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Load once on mount; seed sample data the very first time only.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) {
          setPeople(JSON.parse(raw));
        } else {
          const seeded = await AsyncStorage.getItem(SEED_FLAG);
          if (!seeded) {
            setPeople(seedPeople);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedPeople));
            await AsyncStorage.setItem(SEED_FLAG, '1');
          } else {
            setPeople([]);
          }
        }
      } catch (e) {
        console.warn('Networth: failed to load people', e);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(people)).catch((e) =>
      console.warn('Networth: failed to save people', e)
    );
  }, [people, loading]);

  const api = useMemo<Store>(() => {
    const addPerson = (p: NewPerson): Person => {
      const now = Date.now();
      const person: Person = { ...p, id: makeId(), createdAt: now, updatedAt: now };
      setPeople((prev) => [person, ...prev]);
      return person;
    };
    const updatePerson = (id: string, patch: Partial<NewPerson>) =>
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p))
      );
    const removePerson = (id: string) =>
      setPeople((prev) => prev.filter((p) => p.id !== id));
    const getPerson = (id: string) => people.find((p) => p.id === id);

    const skillCounts = new Map<string, number>();
    for (const p of people)
      for (const s of p.skills) {
        const key = s.trim();
        if (!key) continue;
        skillCounts.set(key, (skillCounts.get(key) ?? 0) + 1);
      }
    const allSkills = [...skillCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const clearAll = () => setPeople([]);
    const restoreSample = () => setPeople(seedPeople);

    return {
      people,
      loading,
      addPerson,
      updatePerson,
      removePerson,
      getPerson,
      allSkills,
      clearAll,
      restoreSample,
    };
  }, [people, loading]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// --- Search / matching --------------------------------------------------

const norm = (s: string) => s.toLowerCase().trim();

/** Does a person have a skill matching this query token (substring, case-insensitive)? */
function personHasSkill(person: Person, token: string): boolean {
  const t = norm(token);
  return person.skills.some((s) => norm(s).includes(t));
}

export interface SearchResult {
  person: Person;
  matched: string[]; // which query skills this person matched
}

export interface SearchOutput {
  /** People matching every selected skill. */
  matchesAll: SearchResult[];
  /** People matching some but not all selected skills. */
  matchesSome: SearchResult[];
}

/**
 * Search the network by a set of required expertise tokens plus an optional
 * free-text query (matched against name or skills). Returns people grouped by
 * how completely they match — the core magic of the Find screen.
 */
export function searchNetwork(
  people: Person[],
  skills: string[],
  text: string
): SearchOutput {
  const activeSkills = skills.map(norm).filter(Boolean);
  const q = norm(text);

  const scored = people
    .map((person) => {
      const matched = activeSkills.filter((s) => personHasSkill(person, s));
      const textHit =
        !q ||
        norm(person.name).includes(q) ||
        person.skills.some((s) => norm(s).includes(q)) ||
        norm(person.relationship).includes(q);
      return { person, matched, textHit };
    })
    .filter((r) => r.textHit && (activeSkills.length === 0 || r.matched.length > 0));

  // With no skill filters, everything passing the text filter is a flat list.
  if (activeSkills.length === 0) {
    return {
      matchesAll: scored.map((r) => ({ person: r.person, matched: [] })),
      matchesSome: [],
    };
  }

  const matchesAll: SearchResult[] = [];
  const matchesSome: SearchResult[] = [];
  for (const r of scored) {
    const entry = { person: r.person, matched: r.matched };
    if (r.matched.length === activeSkills.length) matchesAll.push(entry);
    else matchesSome.push(entry);
  }
  // Best matches first within each group.
  matchesSome.sort((a, b) => b.matched.length - a.matched.length);
  return { matchesAll, matchesSome };
}
