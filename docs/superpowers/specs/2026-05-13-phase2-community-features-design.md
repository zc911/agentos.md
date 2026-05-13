# Phase 2: Community Template Gallery — Design Spec

**Date:** 2026-05-13  
**Status:** Approved

---

## Goal

Add a community template gallery to agentos.md: anyone can publish an Agent Manifest, GitHub users get persistent username URLs and full CRUD, anonymous users get permanent UUID URLs with no management.

---

## Architecture

**Stack:** Cloudflare D1 (SQLite) + Cloudflare Pages Functions + stateless JWT (HMAC-SHA256).

One new infrastructure product: D1. Auth is stateless — no KV, no server-side sessions. JWT minted at login, stored in `localStorage`, deleted on logout. Token lifetime: 7 days.

**Tech:**
- Backend: Cloudflare Pages Functions (`functions/api/`)
- Auth: GitHub OAuth App + HMAC-SHA256 JWT signed with `JWT_SECRET` env var
- Database: Cloudflare D1 (bound as `DB`)
- Frontend: existing React + Vite SPA, new pages added to React Router

---

## Data Model

```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,             -- GitHub numeric user ID (string)
  login      TEXT NOT NULL UNIQUE,         -- GitHub username
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE templates (
  id          TEXT PRIMARY KEY,            -- UUID (anonymous) | slug (GitHub user)
  user_id     TEXT,                        -- NULL for anonymous
  username    TEXT,                        -- NULL for anonymous; GitHub login otherwise
  name        TEXT NOT NULL,
  description TEXT,
  tags        TEXT NOT NULL DEFAULT '[]',  -- JSON array stored as TEXT
  markdown    TEXT NOT NULL,
  downloads   INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_templates_time ON templates(created_at);
```

**URL scheme:**
- Anonymous: `/templates/{uuid}` — `id` in DB = the UUID
- GitHub user: `/templates/{username}/{slug}` — `id` in DB = `"{username}/{slug}"` (e.g., `zack/code-reviewer`), making it globally unique as the primary key

**Slug generation:** lowercase, spaces → hyphens, strip non-alphanumeric except hyphens. Conflicts per user resolved by appending `-2`, `-3`, etc. (check `id LIKE '{username}/{slug}%'`).

---

## Auth Flow

1. User clicks "Sign in with GitHub" → `GET /api/auth/github`
2. Worker redirects to `https://github.com/login/oauth/authorize?client_id=...&scope=read:user`
3. GitHub redirects to `GET /api/auth/callback?code=...`
4. Worker POSTs code to `https://github.com/login/oauth/access_token`, gets `access_token`
5. Worker GETs `https://api.github.com/user` → `{ id, login, avatar_url }`
6. Worker upserts user row into D1 `users` table
7. Worker mints JWT: `{ sub: github_id, login: username, exp: now + 7*86400 }` signed with `JWT_SECRET`
8. Worker redirects to `/studio?token={jwt}` — client reads token from URL, stores in `localStorage`, removes from URL with `history.replaceState`
9. **Logout:** delete `token` from `localStorage` (client-only, no server round-trip)

**JWT verification (middleware helper):** decode header/payload (base64), verify signature with `crypto.subtle.verify`, check `exp`. Return `{ sub, login }` or null.

**Required env vars:**
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET` (random 32-byte hex string)

---

## API Endpoints

All endpoints live under `functions/api/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/github` | — | Redirect to GitHub OAuth authorize URL |
| GET | `/api/auth/callback` | — | Exchange code → JWT, redirect to `/studio?token=` |
| GET | `/api/auth/me` | JWT required | Return `{ id, login, avatar_url }` |
| GET | `/api/templates` | — | List templates; `?q=` full-text, `?tags=` comma-separated, `?cursor=` pagination |
| GET | `/api/tags` | — | Return distinct tag list (for gallery filter chips) |
| POST | `/api/templates` | optional JWT | Publish template; returns `{ id, url }` |
| GET | `/api/templates/:id` | — | Get single template by UUID or `username/slug` |
| PUT | `/api/templates/:id` | JWT + owner | Update `name`, `description`, `tags`, `markdown` |
| DELETE | `/api/templates/:id` | JWT + owner | Delete template |

**`GET /api/templates` query params:**
- `q` — searches `name` and `description` with SQL `LIKE '%q%'`
- `tags` — comma-separated tag names; filter rows where tags JSON contains each tag
- `cursor` — `created_at` timestamp for keyset pagination (next page)
- `limit` — default 24, max 48

**`POST /api/templates` body:**
```json
{
  "name": "Code Reviewer",
  "description": "Reviews PRs...",
  "tags": ["code-review", "git"],
  "markdown": "---\nname: ...\n---\n..."
}
```

**`:id` routing:** The templates function uses a catch-all file `functions/api/templates/[[id]].js` so it handles both `/api/templates/{uuid}` and `/api/templates/{username}/{slug}` (two path segments). If the captured `id` contains `/`, treat as `username/slug`; otherwise treat as UUID.

**Ownership check:** `template.user_id === jwt.sub`. Anonymous templates (`user_id IS NULL`) cannot be modified by anyone.

---

## Frontend Pages

### `/templates` — Gallery

- Search bar at top (controlled input, debounced 300ms before fetch)
- Tag chips row below search (fetched once on mount from a distinct tags query)
- Template card grid (responsive, 1–3 columns)
- Each card: agent name, description (truncated to 2 lines), author badge (`@username` or `Anonymous`), tag pills, relative date
- Clicking a card navigates to detail page
- "Load more" button at bottom (keyset pagination via `cursor`)
- URL reflects active filters: `/templates?q=code+review&tags=git` (via `URLSearchParams`, `history.replaceState`)

### `/templates/:id` and `/templates/:username/:slug` — Detail

- Agent name + description header
- Tag pills
- Author line: `@username` (links to GitHub profile) or `Anonymous`
- Published date
- Manifest markdown in styled `<pre>` block (same style as home page code example)
- Action bar:
  - **Copy** — copies raw markdown to clipboard
  - **Download** — downloads as `{name}.md`
  - **Open in Studio** — stores markdown in `sessionStorage` under key `studio_import`, navigates to `/studio`
- If authenticated JWT user is the author:
  - **Edit** button — same as "Open in Studio" but sets a `studio_editing_id` key in `sessionStorage` so Studio knows to PUT on save
  - **Delete** button — shows inline confirm ("Delete this template? This cannot be undone."), calls DELETE endpoint, redirects to `/templates` on success

### Studio Export Phase — Publish Panel

Added below the platform export grid in `ExportPanel.jsx`:

- Section heading: "Publish to Gallery"
- Pre-fills `name`, `description`, `tags` from parsed manifest frontmatter
- **Anonymous path:** "Publish Anonymously" button → POST → shows UUID URL with copy button + "View in Gallery" link. Note: "Anonymous templates cannot be edited after publishing."
- **GitHub path:** if no JWT: "Sign in with GitHub to publish as @username" button → OAuth flow → returns to `/studio?token=...` → panel re-renders with login state
- After GitHub publish: shows `agentos.md/templates/{username}/{slug}` URL with copy + "View in Gallery"

### Studio Import (GeneratePanel)

On mount, check `sessionStorage` for `studio_import`. If present:
- Load markdown directly into the edit phase (skip generate step, set `phase = 'edit'`)
- Clear the `sessionStorage` key after reading
- If `studio_editing_id` is also present, pass it down so ExportPanel can PUT instead of POST

---

## Navigation

- Add "Templates" link to site nav (between "Studio" and "Spec")
- On detail page, breadcrumb: Templates → {agent name}

---

## Error Handling

- JWT expired/invalid → 401; client clears `localStorage` token and shows "Session expired, please sign in again"
- GitHub OAuth failure (bad code, network error) → redirect to `/studio?auth_error=1`; client shows a toast
- D1 query errors → 500 with `{ error: "Internal error" }` (no DB details leaked)
- Template not found → 404 with `{ error: "Not found" }`
- Ownership violation → 403 with `{ error: "Forbidden" }`

---

## Out of Scope (Phase 2)

- Template ratings / likes
- Comments
- User profile pages (`/u/{username}`)
- Email notifications
- Paid tiers or rate limiting beyond basic Cloudflare defaults
