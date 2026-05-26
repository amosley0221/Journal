# Journal+

A glass-dark, PWA-installable journaling app that syncs across devices.

## Stack & architecture

- **No build step.** JSX is transpiled in-browser at runtime by Babel-standalone. Files are served as-is from the repo root.
- **React 18 + Supabase + Render static hosting.** React/ReactDOM/Babel/Supabase load via UMD CDN; everything else is in this repo.
- **Module pattern**: every `.jsx` file is an IIFE that attaches its public exports to `window`. There are no imports/exports.
- **Script order matters** (see `index.html` `<body>`): `data → sync → auth → skins → entry-canvas → entry-view → map-overlay → app → bootstrap`. New modules must be added to that list and must register with `Object.assign(window, { ... })`.

## Data model

State lives in a single per-user JSONB row in Supabase (`public.user_data.data`) with shape:

```
{
  sections: [{ id, name, glyph, hue, children?: [...], entries?: [...] }],
  appTheme: 'dark' | 'light',
  accentOverride: { id, accent, accentSoft } | null,
  photoState:   { [entryKey]: photos[] },   // per-entry overrides
  stickyState:  { [entryKey]: stickies[] }, // per-entry overrides
  themeState:   { [entryKey]: themeId },    // per-entry overrides
  displayName:  string,
  skinId:       'restrained' | 'skeuomorphic' | ...
}
```

- `sync.jsx` owns the read/write/realtime via `useSyncedJournal`.
- Writes are debounced **600ms** then upserted; realtime subscriptions hydrate other devices.
- Last-write-wins. There is no conflict resolution.

## Conventions

- **Entries** are stored in the deepest leaf of a section. `path` is an array of section ids from root. `entryKey = path.join('/') + ':' + entryId` keys per-entry override state.
- **Photos & voice** are stored as **base64 data URLs** in the row. Cheap to ship, expensive in size — a future move is Supabase Storage + URLs.
- **Stroke data** (compose/draw mode) records canvas dims so it scales back on view. See `InkSurface` (compose) and `StrokesLayer` (entry-view).
- **Skins** live in `skins.jsx`. Each skin has `{ id, name, accent, accentSoft, background }`. Adding one means: register it, add `.skin-<id>` CSS overrides in `index.html`, and add a card to the Settings → Appearance → Style picker in `app.jsx`.
- **Layouts**: `'phone' | 'mobile' | 'desktop'` chosen by viewport in `index.html`'s `useLayout()` (≥1100 = desktop, ≥680 = mobile/tablet, else phone).
- **Auth gating**: `<AuthScreen />` renders when `useAuth()` reports no session. `<JournalApp>` only mounts behind a valid session.

## Running & deploying

- **Local**: `python3 -m http.server 8080` then open `http://localhost:8080`. Auth and sync work over `http://localhost` but PWA install needs HTTPS.
- **Deploy**: pushes to `main` (or the working branch) trigger a Render rebuild via `render.yaml`. After deploy, hard-refresh once so the service worker picks up the new shell.
- **Branch policy**: develop on `claude/implement-design-index-EBmDD` (or whatever feature branch the user is on). Don't push directly to `main` without permission.

## Config / secrets

- `config.js` holds `SUPABASE_URL` + `SUPABASE_ANON_KEY` (the *publishable* key). **Both are safe in client code** — RLS enforces per-user access. The user maintains this file; don't revert their edits.
- The Supabase service_role / secret key must **never** appear in client code.
- Supabase schema and RLS policies live in `schema.sql`.

## Gotchas to avoid

- **Don't add a build step / bundler** without explicit go-ahead. The whole point of the current setup is zero-build deploys.
- **Don't drop `Object.assign(window, ...)`** at the end of a new `.jsx` file — other modules read its exports off `window`.
- **Touch handlers must use native `addEventListener`** when they need to win over inner-element scroll cancellation (see the swipe gesture in `JournalApp`). React's synthetic touch events get killed by `touchcancel`.
- **Per-entry overrides** (`photoState` / `stickyState`) live separately from the canonical entry on the section tree. When changing an entry's content, decide whether it's an "edit" (write through to the section tree, like `onChangeVoice` / `onDeleteEntry`) or a "view-time tweak" (write to the override map, like photo position).
- The Skeuomorphic skin uses Playfair Display (loaded via Google Fonts).

## File map

```
index.html           App shell, every <style>, bootstrap script, useLayout, auth gate
config.js            Supabase URL + anon key  (user-edited)
sync.jsx             Supabase client, useAuth, useSyncedJournal, signIn/Up/Out/Reset
auth.jsx             Sign-in / sign-up / reset screen
app.jsx              <JournalApp>, slider, body router, compose, settings, sections manager
entry-view.jsx       Entry detail view, paper themes, stroke playback, voice/photo/sticky add
entry-canvas.jsx     FloatBox, PhotoSlot, StickySlot, legacy InkCanvas
map-overlay.jsx      3D journal map
skins.jsx            Background components + SKINS registry
data.jsx             Icons, THEMES (paper themes), fmtDate, relDate

manifest.webmanifest PWA manifest
sw.js                App-shell service worker (network-first for Supabase, cache-first elsewhere)
icons/               PWA icons (192, 512, maskable, apple-touch, favicon)

schema.sql           Supabase schema + RLS policies
render.yaml          Render Blueprint (static site)
README.md            User-facing setup instructions
```
