# Networth

Your net worth isn't your bank balance — it's who you can call. **Networth** makes
your personal network *searchable by expertise*. Remember who's good at what, find the
right person (or combination of people) in seconds, and reach out.

One codebase → web, Android, and iOS (via Expo + React Native Web).

## Status: Phase 1 + Phase 3 — searchable network with a visual tree

Still **local-first**: all data lives on the device (no accounts, no server, nothing
leaves the phone). Useful on day one, with zero privacy surface. (Phase 2 — accounts and
sync — is intentionally deferred; the app is single-user for now.)

Working today:

- **Find** — search people by a skill or a name, or tap expertise chips to *combine*
  skills (e.g. catering + marketing) and see who covers all of them vs. some.
- **Network** *(Phase 3)* — an interactive tree of You → your direct contacts → the
  people they introduced you to (2nd degree and deeper). Tap anyone to focus their
  sub-network ("see their network") and see how many people they connect you to.
- **People** — your full network, searchable, with quick-add.
- **Add / edit person** — name, how you know them, skill tags, availability, contact,
  and **who introduced them** (builds the network tree).
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
  network.ts                Tree layout (referral chains → positioned nodes/edges)
  data/seed.ts              Sample network shown on first launch
  components/PersonCard.tsx  Person row used by Find + People
  screens/
    FindScreen.tsx          Expertise search — the hero screen
    NetworkScreen.tsx       Visual network tree (Phase 3) — SVG edges + node overlay
    PeopleScreen.tsx        Full network list
    PersonForm.tsx          Add / edit (incl. "who introduced them")
    PortfolioScreen.tsx     Person detail + reach-out + referral chain
    MeScreen.tsx            Stats + data controls
```

The entire model is three ideas: **people**, the **skills** they have, and how you
**reach** them. Search groups matches by completeness (covers-all vs. covers-some) and
highlights *why* each person surfaced.

## Roadmap

- **Phase 3 — the network tree:** ✅ done (built ahead of Phase 2). Visual tree, browse
  2nd-degree+ connections, "see their network."
- **Phase 2 — social:** deferred. Real accounts + sync (Supabase/Postgres), in-app "ask"
  as live chat, invites, availability that people set themselves, cross-user referrals.
- **Phase 4:** iOS release, push notifications, polish.

Navigation is intentionally a tiny hand-rolled stack (no router dependency) to keep the
app lean; swap in Expo Router when the screen count grows.
