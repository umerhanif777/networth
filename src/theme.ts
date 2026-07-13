// Design tokens for Networth. One clean, warm, professional light theme.
// Keep every color/spacing decision here so the whole app stays consistent
// and a future dark theme is a single swap.

export const colors = {
  // Surfaces
  bg: '#F6F5F1', // warm off-white page
  surface: '#FFFFFF', // cards
  surfaceMuted: '#F0EFEA', // subtle fills, chips

  // Text
  textPrimary: '#1C1C1A',
  textSecondary: '#66655F',
  textMuted: '#9B9A93',

  // Lines
  border: '#E6E5DF',
  borderStrong: '#D7D6CF',

  // Accent (indigo — premium, trustworthy)
  accent: '#4F46E5',
  accentText: '#4338CA',
  accentBg: '#EEEDFE',

  // Semantic
  success: '#0F9D6E',
  successBg: '#E1F5EE',
  warning: '#BA7517',
  warningBg: '#FAEEDA',
  danger: '#D3453B',
  dangerBg: '#FBEAE9',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  h1: 24,
  h2: 18,
  h3: 16,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

// A stable palette of avatar background/text pairs, chosen by hashing a name
// so a given person always gets the same color.
export const avatarPalette = [
  { bg: '#EEEDFE', fg: '#4338CA' },
  { bg: '#E1F5EE', fg: '#0F6E56' },
  { bg: '#FAECE7', fg: '#993C1D' },
  { bg: '#FBEAF0', fg: '#993556' },
  { bg: '#E6F1FB', fg: '#185FA5' },
  { bg: '#FAEEDA', fg: '#854F0B' },
] as const;

export function avatarColorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
