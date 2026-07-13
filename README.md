# Networth

Your net worth isn't your bank balance — it's who you can call. **Networth** makes
your personal network *searchable by expertise*. Remember who's good at what, find the
right person (or combination of people) in seconds, and reach out.

One codebase → web, Android, and iOS (via Expo + React Native Web).

## Status: Phase 1 — your private, searchable network

Phase 1 is **local-first**: all data lives on the device (no accounts, no server,
nothing leaves the phone). This makes it useful on day one, with zero privacy surface.

Working today:

- **Find** — search people by a skill or a name, or tap expertise chips to *combine*
  skills (e.g. catering + marketing) and see who covers all of them vs. some.
- **People** — your full network, searchable, with quick-add.
- **Add / edit person** — name, how you know them, skill tags, availability, contact,
  notes.
- **Portfolio** — a person's page with their skills, contact actions ("Ask for help"
  drafts a message; "Call"), notes, and their **referral chain** (who introduced them
  to you, and who they introduced you to).
- **Me** — network stats, top expertise, and data controls (restore sample / clear).

## Run it

Node.js is required (installed via `winget install OpenJS.NodeJS.LTS`).

```bash
npm install          # first time only
npm run web          # open in browser  (http://localhost:8081)
npm run android      # Android device/emulator (needs Android SDK or Expo Go app)
npm run ios          # iOS — macOS only, or use the Expo Go app
```

The easiest way to try it on a real phone: run `npm start`, install **Expo Go** on your
phone, and scan the QR code.

> Note: on this Windows machine Node lives at `C:\Program Files\nodejs`. If `npm` isn't
> found in a fresh shell, add that folder to PATH or open a new terminal after install.

## Architecture

```
App.tsx                     Root: StoreProvider + tab/stack navigation shell
src/
  theme.ts                  Design tokens (colors, spacing, avatar colors)
  types.ts                  Person data model
  store.tsx                 AsyncStorage persistence + CRUD + search logic
  ui.tsx                    Shared components (Avatar, Tag, Button, Card, pills)
  data/seed.ts              Sample network shown on first launch
  components/PersonCard.tsx  Person row used by Find + People
  screens/
    FindScreen.tsx          Expertise search — the hero screen
    PeopleScreen.tsx        Full network list
    PersonForm.tsx          Add / edit
    PortfolioScreen.tsx     Person detail + reach-out + referral chain
    MeScreen.tsx            Stats + data controls
```

The entire model is three ideas: **people**, the **skills** they have, and how you
**reach** them. Search groups matches by completeness (covers-all vs. covers-some) and
highlights *why* each person surfaced.

## Roadmap

- **Phase 2 — social:** real accounts + sync (Supabase/Postgres), in-app "ask" as live
  chat, invites, availability that people set themselves.
- **Phase 3 — the network tree:** visual graph, browse 2nd-degree connections, "see
  their network."
- **Phase 4:** iOS release, push notifications, polish.

Navigation is intentionally a tiny hand-rolled stack (no router dependency) to keep
Phase 1 lean; swap in Expo Router when the screen count grows.
