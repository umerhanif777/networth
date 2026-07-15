import type { NewPerson, Person } from './types';

// Importing people from the phone's contact list. On the web/PWA (Android
// Chrome) this uses the Contact Picker API: the user picks contacts, and we keep
// only those whose name reveals an expertise keyword — e.g. "Imran Mechanic" —
// auto-filling name, skill, phone, email, and city/address.

// Common expertise words people append to a contact name.
export const SKILL_KEYWORDS = [
  'mechanic', 'electrician', 'plumber', 'carpenter', 'painter', 'welder', 'mason',
  'driver', 'tailor', 'barber', 'chef', 'cook', 'caterer', 'catering', 'photographer',
  'videographer', 'doctor', 'dentist', 'nurse', 'pharmacist', 'lawyer', 'accountant',
  'marketing', 'developer', 'programmer', 'designer', 'architect', 'engineer',
  'teacher', 'tutor', 'professor', 'electrical', 'plumbing', 'hvac', 'technician',
  'mobile', 'laptop', 'computer', 'network', 'builder', 'contractor', 'tiler',
  'gardener', 'farmer', 'vet', 'veterinarian', 'realtor', 'agent', 'broker', 'dealer',
  'wholesaler', 'supplier', 'printer', 'baker', 'butcher', 'fabricator', 'blacksmith',
  'locksmith', 'tractor', 'cattle', 'dairy', 'poultry', 'solar', 'cctv', 'security',
  'cleaner', 'cleaning', 'mover', 'courier', 'logistics', 'travel', 'tour', 'event',
  'decorator', 'florist', 'makeup', 'salon', 'stylist', 'trainer', 'coach',
  'consultant', 'finance', 'insurance', 'tax', 'audit', 'legal', 'translator',
  'plumber', 'electric', 'ac', 'it',
];
const KEYWORD_SET = new Set(SKILL_KEYWORDS);

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const cleanSkill = (s: string) =>
  s.trim().replace(/\s+/g, ' ').split(' ').map(titleCase).join(' ');

export interface ParsedName {
  name: string;
  skill?: string;
}

/**
 * Pull an expertise keyword out of a stored contact name.
 *  - Explicit separators win: "Imran - Mechanic", "Imran (Mechanic)", "Imran / Mechanic".
 *  - Otherwise a word matching the keyword dictionary is used and stripped:
 *    "Imran Mechanic" -> { name: "Imran", skill: "Mechanic" }.
 * Returns just { name } when nothing recognisable is found.
 */
export function parseContactName(raw: string): ParsedName {
  const full = (raw || '').trim().replace(/\s+/g, ' ');
  if (!full) return { name: '' };

  const paren = full.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) return { name: paren[1].trim() || paren[2].trim(), skill: cleanSkill(paren[2]) };

  const sep = full.match(/^(.+?)\s*[-–:/|]\s*(.+)$/);
  if (sep) return { name: sep[1].trim(), skill: cleanSkill(sep[2]) };

  const words = full.split(' ');
  const idx = words.findIndex((w) => KEYWORD_SET.has(w.toLowerCase().replace(/[^a-z]/gi, '')));
  if (idx >= 0) {
    const rest = words.filter((_, i) => i !== idx).join(' ').trim();
    return { name: rest || full, skill: cleanSkill(words[idx]) };
  }

  return { name: full };
}

export interface ImportResult {
  added: number;
  skipped: number;
  addedNames: string[];
}

/** True when the Contact Picker API is available (Android Chrome, secure ctx). */
export function contactsSupported(): boolean {
  const nav: any = typeof navigator !== 'undefined' ? navigator : null;
  return !!(nav && nav.contacts && typeof nav.contacts.select === 'function');
}

/** Structured-address → { city, address } best-effort. */
function readAddress(addr: any): { city?: string; address?: string } {
  if (!addr) return {};
  const city = addr.city || undefined;
  const line = Array.isArray(addr.addressLine) ? addr.addressLine.join(' ') : addr.addressLine;
  const address = [line, addr.region, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ') || undefined;
  return { city, address };
}

/**
 * Open the system contact picker, then import the selected contacts that carry
 * an expertise keyword. Throws AbortError if the user cancels.
 */
export async function importContactsWeb(addPerson: (p: NewPerson) => Person): Promise<ImportResult> {
  const nav: any = navigator;
  const available: string[] = (await nav.contacts.getProperties?.()) ?? ['name', 'tel', 'email'];
  const want = ['name', 'tel', 'email'].filter((p) => available.includes(p));
  if (available.includes('address')) want.push('address');

  const picked: any[] = await nav.contacts.select(want, { multiple: true });

  const result: ImportResult = { added: 0, skipped: 0, addedNames: [] };
  for (const c of picked) {
    const rawName = (c.name && c.name[0]) || '';
    const { name, skill } = parseContactName(rawName);
    if (!skill || !name) {
      result.skipped++;
      continue;
    }
    const { city, address } = readAddress(c.address && c.address[0]);
    addPerson({
      name,
      relationship: 'from contacts',
      skills: [skill],
      phone: c.tel && c.tel[0] ? String(c.tel[0]).trim() : undefined,
      email: c.email && c.email[0] ? String(c.email[0]).trim() : undefined,
      city,
      address,
      availability: 'unknown',
    });
    result.added++;
    result.addedNames.push(name);
  }
  return result;
}
