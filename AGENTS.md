# Networth — agent notes

Expo SDK 57 + React Native 0.86, TypeScript. One codebase → web, Android, iOS.
Read the versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before changing
native config.

## Run / verify

- Web: `npm run web` (serves on http://localhost:8081). Typecheck: `npx tsc --noEmit`.
- Node.js is at `C:\Program Files\nodejs` on this machine — a fresh shell may not have it
  on PATH.

## Architecture (Phase 1 — local-first, single user)

- Data lives on-device via AsyncStorage; no backend yet. See README.md for the file map.
- `src/store.tsx` holds persistence, CRUD, and `searchNetwork()` (the expertise-match
  grouping). Data model is in `src/types.ts` — Person = name + relationship + skills +
  contact + availability + optional `referredById` (referral chain seed).
- Navigation is a small hand-rolled tab + overlay stack in `App.tsx` (no router dep on
  purpose). Add Expo Router only when screen count justifies it.
- All design tokens are in `src/theme.ts` — don't hardcode colors/spacing in components.

## Conventions

- `outlineStyle: 'none'` is not in RN's TextStyle types — outlines are stripped globally
  on web via an injected `<style>` in `App.tsx`, not per-input.
- Keep the model to the three core ideas: people, their skills, how to reach them.
