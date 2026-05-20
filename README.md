# Journal+

A glass-dark journaling app. Installs as a PWA on iOS, Android, and desktop, and
syncs your entries across every device you sign in on.

## Stack

- **Frontend:** React 18 + JSX, served as static files, transpiled in the browser
  by Babel-standalone. No build step.
- **Sync + auth:** [Supabase](https://supabase.com) — Postgres + auth + realtime.
- **Hosting:** [Render](https://render.com) static site.
- **Install:** Standards-based PWA (manifest + service worker).

## First-time setup

### 1. Create a Supabase project

1. Go to <https://app.supabase.com> and create a new project.
2. In the SQL editor, paste and run [`schema.sql`](./schema.sql). This creates
   one `user_data` table with row-level security so each user only sees their
   own data.
3. In **Authentication → Providers**, make sure **Email** is enabled.
   (Optional: turn off "Confirm email" if you want sign-ups to work without
   verifying email; on by default in Supabase.)
4. In **Settings → API**, copy the **Project URL** and the **anon/public**
   API key.

### 2. Fill in `config.js`

Open [`config.js`](./config.js) and paste the values from the previous step:

```js
window.JOURNAL_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi…',
};
```

Both values are **safe to commit** — the anon key has no admin privileges and
RLS enforces per-user access.

### 3. Deploy on Render

This repo includes a [`render.yaml`](./render.yaml) Blueprint. To deploy:

1. Push the repo to GitHub.
2. In Render, click **New → Blueprint** and point it at your fork.
3. Render auto-detects `render.yaml` and deploys it as a static site.

You'll get a URL like `https://journal-plus.onrender.com`. Open it, sign up
with email + password, and you're in.

### 4. Install as a PWA

- **iOS:** Open the site in Safari → Share → **Add to Home Screen**.
- **Android:** Open in Chrome → **Install app** prompt, or the ⋮ menu →
  **Install app**.
- **Desktop (Chrome/Edge):** address-bar install icon → **Install**.

The app loads from the local cache after first install, so it opens instantly
and works offline. Any entries you create offline will sync next time you're
online (best-effort — the current sync is "last write wins"; conflict handling
is on the roadmap).

## Local development

Because the JSX is transpiled in the browser, you can serve the folder with any
static server:

```sh
python3 -m http.server 8080
# or:
npx serve .
```

Then open <http://localhost:8080>. (Note: PWA installation needs HTTPS, but
everything else — including Supabase auth and sync — works fine over `http://`
on localhost.)

## Project layout

```
index.html         # App shell + all styles + bootstrap
config.js          # Supabase URL / anon key (fill in)
sync.jsx           # Supabase client, auth helpers, useSyncedJournal hook
auth.jsx           # Sign-in / sign-up screen
app.jsx            # <JournalApp> — the main shell
entry-view.jsx     # Entry detail pane
entry-canvas.jsx   # Stickies / photos / pencil canvas inside an entry
map-overlay.jsx    # 3D "journal map"
skins.jsx          # Visual skin (restrained — the only one shipped)
data.jsx           # Icons, themes, date helpers (no seed data)

manifest.webmanifest
sw.js              # App-shell service worker
icons/             # PWA + favicon assets

schema.sql         # Supabase schema (run once in SQL editor)
render.yaml        # Render Blueprint
```

## What syncs, what doesn't

Synced via Supabase (cross-device):
- The full sections tree (journals, semesters, courses, entries — anything you
  create)
- Per-entry photo/sticky/theme overrides
- App theme + accent color override

Local-only (intentionally per-device):
- Which entry is selected, which section is open
- Whether an entry has been unlocked in the current session
