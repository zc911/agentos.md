# Phase 2: Community Template Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a community template gallery where anyone can publish an Agent Manifest, GitHub users get persistent username/slug URLs with full CRUD, and anonymous users get permanent UUID URLs.

**Architecture:** Cloudflare D1 (SQLite) for all data; Pages Functions for API; HMAC-SHA256 JWT (stored in `localStorage`) for stateless auth; new React pages added to the existing Vite SPA via React Router v6.

**Tech Stack:** Cloudflare D1, Cloudflare Pages Functions, Web Crypto API, GitHub OAuth Apps, React 18, React Router v6, Vitest 2.x

---

## File Map

**New — backend:**
- `migrations/0001_initial.sql` — D1 schema (users + templates tables)
- `functions/api/_jwt.js` — `mintJWT` / `verifyJWT` using Web Crypto
- `functions/api/auth/github.js` — redirect to GitHub OAuth
- `functions/api/auth/callback.js` — exchange code → JWT → redirect
- `functions/api/auth/me.js` — return current user from JWT
- `functions/api/templates.js` — GET list + POST create
- `functions/api/templates/[[id]].js` — GET single + PUT update + DELETE
- `functions/api/tags.js` — GET distinct tags

**New — frontend:**
- `src/lib/auth.js` — `getToken`, `setToken`, `clearToken`, `getUser`
- `src/pages/Templates.jsx` — gallery page
- `src/pages/TemplateDetail.jsx` — detail page

**Modified:**
- `wrangler.toml` — add D1 binding
- `src/App.jsx` — add /templates routes
- `src/components/Header.jsx` — add Templates nav link
- `src/pages/Studio.jsx` — token handling, sessionStorage import, pass auth props
- `src/components/studio/ExportPanel.jsx` — publish panel section

---

## Task 1: D1 Schema + Configuration

**Files:**
- Create: `migrations/0001_initial.sql`
- Modify: `wrangler.toml`

- [ ] **Step 1: Create migrations directory and SQL file**

```sql
-- migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  login      TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS templates (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  username    TEXT,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',
  markdown    TEXT NOT NULL,
  downloads   INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_time ON templates(created_at);
```

- [ ] **Step 2: Update wrangler.toml**

Replace the entire file with:

```toml
name = "agentos-md"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "agentos-md"
database_id = "PLACEHOLDER"
```

- [ ] **Step 3: Set up D1 database (run manually in terminal)**

```bash
# Create the database — copy the database_id from the output
npx wrangler d1 create agentos-md
```

Replace `PLACEHOLDER` in `wrangler.toml` with the `database_id` from the output.

- [ ] **Step 4: Apply schema locally**

```bash
npx wrangler d1 execute agentos-md --local --file migrations/0001_initial.sql
```

Expected output: `Executed 1 queries.`

- [ ] **Step 5: Create .dev.vars for local secrets (already gitignored)**

Add to `.dev.vars`:

```
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
JWT_SECRET=YOUR_RANDOM_32_BYTE_HEX
```

To generate a JWT secret: `openssl rand -hex 32`

Create a GitHub OAuth App at https://github.com/settings/developers → "New OAuth App":
- Homepage URL: `http://localhost:8788`
- Authorization callback URL: `http://localhost:8788/api/auth/callback`

- [ ] **Step 6: Commit**

```bash
git add migrations/0001_initial.sql wrangler.toml
git commit -m "feat: add D1 schema and wrangler config for Phase 2"
```

---

## Task 2: JWT Utilities

**Files:**
- Create: `functions/api/_jwt.js`
- Create: `functions/api/_jwt.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// functions/api/_jwt.test.js
import { mintJWT, verifyJWT } from './functions/api/_jwt.js'

const SECRET = 'test-secret-32-bytes-long-xxxxxxx'

test('mintJWT produces a 3-part token', async () => {
  const token = await mintJWT({ sub: '42', login: 'alice', exp: Math.floor(Date.now()/1000) + 3600 }, SECRET)
  expect(token.split('.').length).toBe(3)
})

test('verifyJWT returns payload for valid token', async () => {
  const payload = { sub: '42', login: 'alice', exp: Math.floor(Date.now()/1000) + 3600 }
  const token = await mintJWT(payload, SECRET)
  const result = await verifyJWT(token, SECRET)
  expect(result.sub).toBe('42')
  expect(result.login).toBe('alice')
})

test('verifyJWT returns null for wrong secret', async () => {
  const token = await mintJWT({ sub: '1', exp: Math.floor(Date.now()/1000) + 3600 }, SECRET)
  const result = await verifyJWT(token, 'wrong-secret')
  expect(result).toBeNull()
})

test('verifyJWT returns null for expired token', async () => {
  const token = await mintJWT({ sub: '1', exp: Math.floor(Date.now()/1000) - 1 }, SECRET)
  const result = await verifyJWT(token, SECRET)
  expect(result).toBeNull()
})

test('verifyJWT returns null for malformed token', async () => {
  expect(await verifyJWT('not.a.token', SECRET)).toBeNull()
  expect(await verifyJWT(null, SECRET)).toBeNull()
  expect(await verifyJWT('', SECRET)).toBeNull()
})
```

Note: the import path uses `./functions/api/_jwt.js` — adjust to relative path from root if vitest needs it. If the test file is at `functions/api/_jwt.test.js`, use `'./_jwt.js'` as the import path.

Create the test file at `functions/api/_jwt.test.js` with import `'./_jwt.js'`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: `Cannot find module './_jwt.js'`

- [ ] **Step 3: Implement JWT utilities**

```js
// functions/api/_jwt.js
const ENC = new TextEncoder()
const DEC = new TextDecoder()

function b64url(buf) {
  let str = ''
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf)
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

async function getKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    ENC.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

export async function mintJWT(payload, secret) {
  const header = b64url(ENC.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(ENC.encode(JSON.stringify(payload)))
  const key = await getKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, ENC.encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(sig)}`
}

export async function verifyJWT(token, secret) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  try {
    const key = await getKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      ENC.encode(`${header}.${body}`)
    )
    if (!valid) return null
    const payload = JSON.parse(DEC.decode(b64urlDecode(body)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add functions/api/_jwt.js functions/api/_jwt.test.js
git commit -m "feat: add HMAC-SHA256 JWT mint/verify utilities"
```

---

## Task 3: GitHub OAuth Endpoints

**Files:**
- Create: `functions/api/auth/github.js`
- Create: `functions/api/auth/callback.js`
- Create: `functions/api/auth/me.js`

No unit tests — tested manually via `wrangler pages dev`.

- [ ] **Step 1: Create github.js — redirect to GitHub OAuth**

```js
// functions/api/auth/github.js
export function onRequestGet(context) {
  const { env } = context
  if (!env.GITHUB_CLIENT_ID) {
    return new Response(JSON.stringify({ error: 'GitHub OAuth not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user`
  return Response.redirect(url, 302)
}
```

- [ ] **Step 2: Create callback.js — exchange code, upsert user, mint JWT**

```js
// functions/api/auth/callback.js
import { mintJWT } from '../_jwt.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (!code) {
    return Response.redirect(`${origin}/studio?auth_error=1`, 302)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return Response.redirect(`${origin}/studio?auth_error=1`, 302)
    }

    // Fetch GitHub user
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'agentos.md',
      },
    })
    const ghUser = await userRes.json()
    if (!ghUser.id) {
      return Response.redirect(`${origin}/studio?auth_error=1`, 302)
    }

    // Upsert user into D1
    await env.DB.prepare(
      `INSERT INTO users (id, login, avatar_url)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET login = excluded.login, avatar_url = excluded.avatar_url`
    ).bind(String(ghUser.id), ghUser.login, ghUser.avatar_url || '').run()

    // Mint JWT (7-day expiry)
    const jwt = await mintJWT(
      {
        sub: String(ghUser.id),
        login: ghUser.login,
        avatar: ghUser.avatar_url || '',
        exp: Math.floor(Date.now() / 1000) + 7 * 86400,
      },
      env.JWT_SECRET
    )

    return Response.redirect(`${origin}/studio?token=${jwt}`, 302)
  } catch {
    return Response.redirect(`${origin}/studio?auth_error=1`, 302)
  }
}
```

- [ ] **Step 3: Create me.js — return current user**

```js
// functions/api/auth/me.js
import { verifyJWT } from '../_jwt.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(
    JSON.stringify({ id: payload.sub, login: payload.login, avatar: payload.avatar }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
```

- [ ] **Step 4: Manual smoke test**

Build and start Pages dev server:
```bash
npm run build && npx wrangler pages dev dist --d1=DB --compatibility-date=2024-01-01
```

Open `http://localhost:8788/api/auth/github` — should redirect to GitHub login page.

After OAuth, should redirect back to `http://localhost:8788/studio?token=...`

`GET http://localhost:8788/api/auth/me` with `Authorization: Bearer <token>` — should return `{ id, login, avatar }`.

- [ ] **Step 5: Commit**

```bash
git add functions/api/auth/
git commit -m "feat: add GitHub OAuth endpoints (github, callback, me)"
```

---

## Task 4: Template List + Create API

**Files:**
- Create: `functions/api/templates.js`

- [ ] **Step 1: Implement templates.js**

```js
// functions/api/templates.js
import { verifyJWT } from './_jwt.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return token ? verifyJWT(token, env.JWT_SECRET) : null
}

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'agent'
}

async function uniqueSlug(db, username, base) {
  const result = await db
    .prepare(`SELECT id FROM templates WHERE id LIKE ?`)
    .bind(`${username}/${base}%`)
    .all()
  const ids = new Set(result.results.map(r => r.id))
  if (!ids.has(`${username}/${base}`)) return `${username}/${base}`
  let n = 2
  while (ids.has(`${username}/${base}-${n}`)) n++
  return `${username}/${base}-${n}`
}

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const q = url.searchParams.get('q') || ''
  const tags = url.searchParams.get('tags') || ''
  const cursor = url.searchParams.get('cursor') ? parseInt(url.searchParams.get('cursor')) : null
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '24'), 48)

  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

  let sql = `SELECT id, user_id, username, name, description, tags, downloads, created_at
    FROM templates
    WHERE (? = '' OR name LIKE ? OR description LIKE ?)`
  const params = [q, `%${q}%`, `%${q}%`]

  for (const tag of tagList) {
    sql += ` AND tags LIKE ?`
    params.push(`%"${tag}"%`)
  }

  if (cursor) {
    sql += ` AND created_at < ?`
    params.push(cursor)
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`
  params.push(limit + 1)

  const result = await env.DB.prepare(sql).bind(...params).all()
  const rows = result.results
  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return json({
    templates: rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })),
    nextCursor: hasMore ? rows[rows.length - 1].created_at : null,
  })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const user = await getUser(request, env)

  let body
  try { body = await request.json() } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { name, description, tags, markdown } = body
  if (!name || typeof name !== 'string' || !name.trim()) return json({ error: 'name is required' }, 400)
  if (!markdown || typeof markdown !== 'string' || !markdown.trim()) return json({ error: 'markdown is required' }, 400)

  const tagsArr = Array.isArray(tags) ? tags.filter(t => typeof t === 'string').slice(0, 10) : []
  const tagsJson = JSON.stringify(tagsArr)
  const now = Math.floor(Date.now() / 1000)

  let id
  if (user) {
    id = await uniqueSlug(env.DB, user.login, slugify(name))
    await env.DB.prepare(
      `INSERT INTO templates (id, user_id, username, name, description, tags, markdown, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, user.sub, user.login, name.trim(), description || '', tagsJson, markdown.trim(), now, now).run()
  } else {
    id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO templates (id, user_id, username, name, description, tags, markdown, created_at, updated_at)
       VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?)`
    ).bind(id, name.trim(), description || '', tagsJson, markdown.trim(), now, now).run()
  }

  return json({ id, url: `/templates/${id}` }, 201)
}
```

- [ ] **Step 2: Manual smoke test**

With Pages dev server running:

```bash
# Publish anonymous template
curl -s -X POST http://localhost:8788/api/templates \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Agent","description":"test","tags":["test"],"markdown":"---\nname: Test\nversion: 1.0.0\ndescription: test\n---\n\n## Role\nTest"}' | jq

# Expected: { "id": "<uuid>", "url": "/templates/<uuid>" }

# List templates
curl -s http://localhost:8788/api/templates | jq
# Expected: { "templates": [...], "nextCursor": null }
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/templates.js
git commit -m "feat: add template list and create API"
```

---

## Task 5: Template Get, Update & Delete API

**Files:**
- Create: `functions/api/templates/[[id]].js`

- [ ] **Step 1: Implement catch-all route**

```js
// functions/api/templates/[[id]].js
import { verifyJWT } from '../_jwt.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return token ? verifyJWT(token, env.JWT_SECRET) : null
}

function resolveId(context) {
  const raw = context.params.id
  return Array.isArray(raw) ? raw.join('/') : (raw || '')
}

export async function onRequestGet(context) {
  const { env } = context
  const id = resolveId(context)
  if (!id) return json({ error: 'Not found' }, 404)

  const row = await env.DB.prepare(
    `SELECT * FROM templates WHERE id = ?`
  ).bind(id).first()

  if (!row) return json({ error: 'Not found' }, 404)

  // Increment downloads
  await env.DB.prepare(`UPDATE templates SET downloads = downloads + 1 WHERE id = ?`).bind(id).run()

  return json({ ...row, tags: JSON.parse(row.tags) })
}

export async function onRequestPut(context) {
  const { request, env } = context
  const id = resolveId(context)
  const user = await getUser(request, env)

  if (!user) return json({ error: 'Unauthorized' }, 401)

  const row = await env.DB.prepare(`SELECT user_id FROM templates WHERE id = ?`).bind(id).first()
  if (!row) return json({ error: 'Not found' }, 404)
  if (row.user_id !== user.sub) return json({ error: 'Forbidden' }, 403)

  let body
  try { body = await request.json() } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { name, description, tags, markdown } = body
  if (!name || typeof name !== 'string' || !name.trim()) return json({ error: 'name is required' }, 400)
  if (!markdown || typeof markdown !== 'string' || !markdown.trim()) return json({ error: 'markdown is required' }, 400)

  const tagsArr = Array.isArray(tags) ? tags.filter(t => typeof t === 'string').slice(0, 10) : []

  await env.DB.prepare(
    `UPDATE templates SET name = ?, description = ?, tags = ?, markdown = ?, updated_at = unixepoch()
     WHERE id = ?`
  ).bind(name.trim(), description || '', JSON.stringify(tagsArr), markdown.trim(), id).run()

  return json({ id, url: `/templates/${id}` })
}

export async function onRequestDelete(context) {
  const { request, env } = context
  const id = resolveId(context)
  const user = await getUser(request, env)

  if (!user) return json({ error: 'Unauthorized' }, 401)

  const row = await env.DB.prepare(`SELECT user_id FROM templates WHERE id = ?`).bind(id).first()
  if (!row) return json({ error: 'Not found' }, 404)
  if (row.user_id !== user.sub) return json({ error: 'Forbidden' }, 403)

  await env.DB.prepare(`DELETE FROM templates WHERE id = ?`).bind(id).run()
  return json({ deleted: true })
}
```

- [ ] **Step 2: Manual smoke test**

```bash
# Get a template (use the UUID from Task 4)
curl -s http://localhost:8788/api/templates/<UUID> | jq

# Expected: full template object with tags as array

# Attempt delete without auth
curl -s -X DELETE http://localhost:8788/api/templates/<UUID> | jq
# Expected: { "error": "Unauthorized" }
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/templates/
git commit -m "feat: add template get/update/delete API"
```

---

## Task 6: Tags API

**Files:**
- Create: `functions/api/tags.js`

- [ ] **Step 1: Implement tags endpoint**

```js
// functions/api/tags.js
export async function onRequestGet(context) {
  const { env } = context
  const result = await env.DB.prepare(
    `SELECT DISTINCT je.value as tag
     FROM templates t, json_each(t.tags) je
     WHERE je.value != ''
     ORDER BY je.value`
  ).all()

  const tags = result.results.map(r => r.tag)
  return new Response(JSON.stringify({ tags }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Manual smoke test**

```bash
curl -s http://localhost:8788/api/tags | jq
# Expected: { "tags": ["code-review", "git", "test", ...] }
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/tags.js
git commit -m "feat: add tags list API"
```

---

## Task 7: Frontend Auth Library

**Files:**
- Create: `src/lib/auth.js`
- Create: `src/lib/auth.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/lib/auth.test.js
import { getToken, setToken, clearToken, getUser } from './auth.js'

beforeEach(() => localStorage.clear())

test('setToken/getToken roundtrip', () => {
  setToken('abc')
  expect(getToken()).toBe('abc')
})

test('clearToken removes token', () => {
  setToken('abc')
  clearToken()
  expect(getToken()).toBeNull()
})

test('getUser decodes JWT payload without verifying', () => {
  // header.payload.sig — payload = base64url({ sub: "42", login: "alice" })
  const payload = btoa(JSON.stringify({ sub: '42', login: 'alice', exp: 9999999999 }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const fakeToken = `header.${payload}.sig`
  setToken(fakeToken)
  const user = getUser()
  expect(user.sub).toBe('42')
  expect(user.login).toBe('alice')
})

test('getUser returns null when no token', () => {
  expect(getUser()).toBeNull()
})

test('getUser returns null for malformed token', () => {
  setToken('notavalidtoken')
  expect(getUser()).toBeNull()
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test
```

Expected: `Cannot find module './auth.js'`

- [ ] **Step 3: Implement auth.js**

```js
// src/lib/auth.js
const KEY = 'agentos_token'

export function getToken() {
  return localStorage.getItem(KEY)
}

export function setToken(token) {
  localStorage.setItem(KEY, token)
}

export function clearToken() {
  localStorage.removeItem(KEY)
}

export function getUser() {
  const token = getToken()
  if (!token) return null
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
npm test
```

Expected: all auth tests pass (total suite still green)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.js src/lib/auth.test.js
git commit -m "feat: add frontend auth token helpers"
```

---

## Task 8: Templates Gallery Page + Routing + Nav

**Files:**
- Create: `src/pages/Templates.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Create Templates.jsx**

```jsx
// src/pages/Templates.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function relativeDate(unixSec) {
  const diff = Math.floor(Date.now() / 1000) - unixSec
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Templates() {
  useEffect(() => { document.title = 'Template Gallery — agentos.md' }, [])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tags') || '')
  const [allTags, setAllTags] = useState([])
  const [templates, setTemplates] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load tag list once
  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(d => setAllTags(d.tags || []))
      .catch(() => {})
  }, [])

  const loadTemplates = useCallback(async (reset = true) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (activeTag) params.set('tags', activeTag)
      if (!reset && nextCursor) params.set('cursor', String(nextCursor))
      const res = await fetch(`/api/templates?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setTemplates(prev => reset ? data.templates : [...prev, ...data.templates])
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [q, activeTag, nextCursor])

  // Reload when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(p => {
        q ? p.set('q', q) : p.delete('q')
        activeTag ? p.set('tags', activeTag) : p.delete('tags')
        return p
      }, { replace: true })
      loadTemplates(true)
    }, q ? 300 : 0)
    return () => clearTimeout(timer)
  }, [q, activeTag]) // eslint-disable-line

  function cardHref(t) {
    return `/templates/${t.id}`
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Template Gallery</h1>

          {/* Search */}
          <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search templates..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <button
                onClick={() => setActiveTag('')}
                style={{
                  padding: '0.3rem 0.75rem',
                  background: !activeTag ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: !activeTag ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    background: activeTag === tag ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: activeTag === tag ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ color: '#f87171', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>
          )}

          {/* Card grid */}
          {templates.length === 0 && !loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
              No templates found. <a href="/studio" style={{ color: 'var(--accent)' }}>Create the first one →</a>
            </p>
          ) : (
            <div className="card-grid">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(cardHref(t))}
                >
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{t.name}</h3>
                  {t.description && (
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      marginBottom: '0.75rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {t.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {(Array.isArray(t.tags) ? t.tags : JSON.parse(t.tags || '[]')).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          color: 'var(--accent)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>{t.username ? `@${t.username}` : 'Anonymous'}</span>
                    <span>{relativeDate(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {nextCursor && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => loadTemplates(false)}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
          {loading && templates.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add routes to App.jsx**

Current `src/App.jsx`:
```jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Navigation from './pages/Navigation'
import Blog from './pages/Blog'
import Studio from './pages/Studio'
import Spec from './pages/Spec'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/navigation" element={<Navigation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/spec" element={<Spec />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
```

Replace with:
```jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Navigation from './pages/Navigation'
import Blog from './pages/Blog'
import Studio from './pages/Studio'
import Spec from './pages/Spec'
import Templates from './pages/Templates'
import TemplateDetail from './pages/TemplateDetail'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/navigation" element={<Navigation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/spec" element={<Spec />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/templates/:username/:slug" element={<TemplateDetail />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
```

- [ ] **Step 3: Add Templates link to Header.jsx**

Current nav list in `src/components/Header.jsx`:
```jsx
<ul className="nav-links">
  <li><Link to="/">Home</Link></li>
  <li><Link to="/spec">Spec</Link></li>
  <li><Link to="/studio">Studio</Link></li>
  <li><Link to="/navigation">Resources</Link></li>
  <li><Link to="/blog">Blog</Link></li>
</ul>
```

Replace with:
```jsx
<ul className="nav-links">
  <li><Link to="/">Home</Link></li>
  <li><Link to="/spec">Spec</Link></li>
  <li><Link to="/studio">Studio</Link></li>
  <li><Link to="/templates">Templates</Link></li>
  <li><Link to="/navigation">Resources</Link></li>
  <li><Link to="/blog">Blog</Link></li>
</ul>
```

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:5173/templates` — should show the gallery page with search bar and tag chips (empty until API is connected). Nav should show "Templates" link. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Templates.jsx src/App.jsx src/components/Header.jsx
git commit -m "feat: add template gallery page, routing, and nav link"
```

---

## Task 9: Template Detail Page

**Files:**
- Create: `src/pages/TemplateDetail.jsx`

- [ ] **Step 1: Create TemplateDetail.jsx**

```jsx
// src/pages/TemplateDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUser, getToken } from '../lib/auth.js'

function relativeDate(unixSec) {
  const diff = Math.floor(Date.now() / 1000) - unixSec
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TemplateDetail() {
  const { id, username, slug } = useParams()
  const navigate = useNavigate()
  const templateId = username ? `${username}/${slug}` : id

  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentUser = getUser()
  const isOwner = currentUser && template && template.user_id === currentUser.sub

  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTemplate(data)
        document.title = `${data.name} — agentos.md`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [templateId])

  function handleCopy() {
    navigator.clipboard.writeText(template.markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    const blob = new Blob([template.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleOpenInStudio() {
    sessionStorage.setItem('studio_import', template.markdown)
    navigate('/studio')
  }

  function handleEdit() {
    sessionStorage.setItem('studio_import', template.markdown)
    sessionStorage.setItem('studio_editing_id', template.id)
    navigate('/studio')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Delete failed')
      }
      navigate('/templates')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return (
    <main><div className="container"><section className="section">
      <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </section></div></main>
  )

  if (error) return (
    <main><div className="container"><section className="section">
      <p style={{ color: '#f87171' }}>{error}</p>
      <Link to="/templates" style={{ color: 'var(--accent)' }}>← Back to Gallery</Link>
    </section></div></main>
  )

  const tags = Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]')

  return (
    <main>
      <div className="container">
        <section className="section" style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <Link to="/templates" style={{ color: 'var(--accent)' }}>Templates</Link>
            {' → '}
            <span>{template.name}</span>
          </div>

          {/* Header */}
          <h1 style={{ marginBottom: '0.5rem' }}>{template.name}</h1>
          {template.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.05rem' }}>
              {template.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {template.username
                ? <a href={`https://github.com/${template.username}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>@{template.username}</a>
                : 'Anonymous'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{relativeDate(template.created_at)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{template.downloads} views</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.2rem 0.6rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Markdown'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Download
            </button>
            <button
              onClick={handleOpenInStudio}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Open in Studio →
            </button>
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Edit
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#f87171' }}>Delete? This cannot be undone.</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: '#f87171',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Manifest */}
          <pre style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            overflow: 'auto',
            lineHeight: '1.75',
          }}>
            {template.markdown}
          </pre>
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```

1. Publish a template via `curl` (Task 4 smoke test command)
2. Open `http://localhost:5173/templates/<uuid>` — should show template name, description, markdown
3. Click "Open in Studio" — should navigate to `/studio` with markdown pre-loaded in Edit phase
4. Click "Copy Markdown" — clipboard should contain the markdown

- [ ] **Step 3: Commit**

```bash
git add src/pages/TemplateDetail.jsx
git commit -m "feat: add template detail page"
```

---

## Task 10: Studio Publish Panel + Token Handling

**Files:**
- Modify: `src/pages/Studio.jsx`
- Modify: `src/components/studio/ExportPanel.jsx`

- [ ] **Step 1: Update Studio.jsx**

Replace the full content of `src/pages/Studio.jsx` with:

```jsx
// src/pages/Studio.jsx
import React, { useState, useEffect } from 'react'
import GeneratePanel from '../components/studio/GeneratePanel'
import EditPanel from '../components/studio/EditPanel'
import ValidatePanel from '../components/studio/ValidatePanel'
import ExportPanel from '../components/studio/ExportPanel'
import { getToken, setToken } from '../lib/auth.js'

const PHASES = ['generate', 'edit', 'validate', 'export']
const PHASE_LABELS = ['Generate', 'Edit', 'Validate', 'Export']

export default function Studio() {
  // Lazy init: restore from sessionStorage before first render
  const [markdown, setMarkdown] = useState(() => {
    return sessionStorage.getItem('studio_import') ||
           sessionStorage.getItem('studio_pre_auth_markdown') || ''
  })
  const [phase, setPhase] = useState(() => {
    if (sessionStorage.getItem('studio_import')) return 'edit'
    return sessionStorage.getItem('studio_pre_auth_phase') || 'generate'
  })
  const [editingId, setEditingId] = useState(() => {
    return sessionStorage.getItem('studio_editing_id') || null
  })
  const [authToken, setAuthToken] = useState(() => getToken())
  const [authError, setAuthError] = useState('')

  const currentIdx = PHASES.indexOf(phase)

  useEffect(() => {
    document.title = 'Agent Manifest Studio — agentos.md'

    // Clean up sessionStorage after reading
    sessionStorage.removeItem('studio_import')
    sessionStorage.removeItem('studio_editing_id')
    sessionStorage.removeItem('studio_pre_auth_markdown')
    sessionStorage.removeItem('studio_pre_auth_phase')

    // Handle OAuth return via URL token
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const authErr = params.get('auth_error')

    if (token) {
      setToken(token)
      setAuthToken(token)
      params.delete('token')
      const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
      window.history.replaceState({}, '', clean)
    }

    if (authErr) {
      setAuthError('GitHub sign-in failed. Please try again.')
      params.delete('auth_error')
      const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
      window.history.replaceState({}, '', clean)
    }
  }, [])

  function handleStartOver() {
    setMarkdown('')
    setPhase('generate')
    setEditingId(null)
  }

  function handleAuthNeeded(currentMarkdown) {
    sessionStorage.setItem('studio_pre_auth_markdown', currentMarkdown)
    sessionStorage.setItem('studio_pre_auth_phase', 'export')
    window.location.href = '/api/auth/github'
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0 }}>Agent Manifest Studio</h1>
            {markdown && (
              <button
                onClick={handleStartOver}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '0.25rem 0.5rem',
                }}
              >
                ↺ Start Over
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}>
            {PHASES.map((p, idx) => {
              const isCompleted = markdown && idx < currentIdx
              const isCurrent = idx === currentIdx
              const isReachable = !!(markdown || idx === 0)
              return (
                <React.Fragment key={p}>
                  <button
                    onClick={() => isReachable && setPhase(p)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: isReachable ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--bg-tertiary)',
                      color: 'white',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <span style={{
                      color: isCurrent ? 'var(--text-primary)' : isCompleted ? 'var(--success)' : 'var(--text-secondary)',
                      fontWeight: isCurrent ? '600' : '400',
                      fontSize: '0.9rem',
                    }}>
                      {PHASE_LABELS[idx]}
                    </span>
                  </button>
                  {idx < PHASES.length - 1 && (
                    <span style={{ color: 'var(--border)', fontSize: '0.85rem', userSelect: 'none' }}>──</span>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {phase === 'generate' && (
            <GeneratePanel onGenerated={md => { setMarkdown(md); setPhase('edit') }} />
          )}
          {phase === 'edit' && (
            <EditPanel markdown={markdown} onChange={setMarkdown} />
          )}
          {phase === 'validate' && (
            <ValidatePanel markdown={markdown} />
          )}
          {phase === 'export' && (
            <ExportPanel
              markdown={markdown}
              authToken={authToken}
              editingId={editingId}
              authError={authError}
              onAuthNeeded={handleAuthNeeded}
            />
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Update ExportPanel.jsx — add publish panel**

Add the following imports at the top of `src/components/studio/ExportPanel.jsx`:

```jsx
import { parseManifest } from '../../lib/manifest/parser'
```

(already imported — no change needed for imports)

Replace the full content of `src/components/studio/ExportPanel.jsx` with:

```jsx
// src/components/studio/ExportPanel.jsx
import React, { useState } from 'react'
import { parseManifest } from '../../lib/manifest/parser'
import { validateManifest } from '../../lib/manifest/validator'
import { exportManifest } from '../../lib/manifest/exporter'
import { PLATFORMS } from '../../lib/manifest/schema'

export default function ExportPanel({ markdown, authToken, editingId, authError, onAuthNeeded }) {
  const [selected, setSelected] = useState('claude')
  const manifest = parseManifest(markdown)
  const errors = validateManifest(manifest).filter(i => i.level === 'error')
  const hasErrors = errors.length > 0
  const preview = hasErrors ? '' : exportManifest(manifest, selected)

  // Publish state — pre-fill from frontmatter
  const fm = manifest.frontmatter
  const [pubName, setPubName] = useState(fm.name || '')
  const [pubDesc, setPubDesc] = useState(fm.description || '')
  const [pubTags, setPubTags] = useState(
    Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || '')
  )
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)
  const [publishError, setPublishError] = useState('')

  // Decode user from token payload (no verification — just display)
  let tokenUser = null
  if (authToken) {
    try {
      const part = authToken.split('.')[1]
      const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
      tokenUser = JSON.parse(atob(padded))
    } catch {}
  }

  function handleDownload() {
    const blob = new Blob([preview], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = PLATFORMS[selected].filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePublish(withAuth) {
    setPublishing(true)
    setPublishError('')
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (withAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`

      const isEdit = withAuth && editingId
      const url = isEdit ? `/api/templates/${editingId}` : '/api/templates'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: pubName,
          description: pubDesc,
          tags: pubTags.split(',').map(t => t.trim()).filter(Boolean),
          markdown,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      setPublishResult(data)
    } catch (err) {
      setPublishError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {hasErrors && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid #f87171',
          borderRadius: '8px',
          color: '#f87171',
          marginBottom: '1.5rem',
        }}>
          Fix {errors.length} error{errors.length !== 1 ? 's' : ''} before exporting — go to the Validate tab
        </div>
      )}

      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Export as</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        {Object.entries(PLATFORMS).map(([key, { label, filename, note }]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            style={{
              padding: '0.75rem 1rem',
              background: selected === key ? 'rgba(88,166,255,0.1)' : 'var(--bg-secondary)',
              border: `1px solid ${selected === key ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: selected === key ? '600' : '400', color: 'var(--text-primary)', marginBottom: '0.2rem', fontSize: '0.9rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
              {filename}
            </div>
            {note && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {note}
              </div>
            )}
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Preview</p>
      <pre style={{
        background: 'var(--bg-secondary)',
        padding: '1rem',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '380px',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
      }}>
        {hasErrors ? '(fix errors to see preview)' : preview}
      </pre>

      <button
        onClick={handleDownload}
        disabled={hasErrors}
        style={{
          padding: '0.75rem 2rem',
          background: hasErrors ? 'var(--bg-secondary)' : 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: hasErrors ? 'not-allowed' : 'pointer',
          marginBottom: '2.5rem',
        }}
      >
        Download {PLATFORMS[selected]?.filename}
      </button>

      {/* Publish to Gallery */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '2rem',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Publish to Gallery</h3>

        {publishResult ? (
          <div style={{
            padding: '1rem',
            background: 'rgba(63,185,80,0.1)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
          }}>
            <p style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: '600' }}>
              {editingId ? 'Updated!' : 'Published!'}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {window.location.origin}/templates/{publishResult.id}
            </p>
            <a
              href={`/templates/${publishResult.id}`}
              style={{ color: 'var(--accent)', fontSize: '0.9rem' }}
            >
              View in Gallery →
            </a>
          </div>
        ) : (
          <>
            {authError && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.88rem' }}>{authError}</p>
            )}

            <input
              value={pubName}
              onChange={e => setPubName(e.target.value)}
              placeholder="Agent name"
              style={inputStyle}
            />
            <input
              value={pubDesc}
              onChange={e => setPubDesc(e.target.value)}
              placeholder="Short description"
              style={inputStyle}
            />
            <input
              value={pubTags}
              onChange={e => setPubTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              style={{ ...inputStyle, marginBottom: '1.25rem' }}
            />

            {publishError && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.88rem' }}>{publishError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePublish(false)}
                disabled={publishing || !pubName.trim()}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: publishing || !pubName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {publishing ? 'Publishing...' : 'Publish Anonymously'}
              </button>

              {tokenUser ? (
                <button
                  onClick={() => handlePublish(true)}
                  disabled={publishing || !pubName.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: publishing || !pubName.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {publishing ? 'Publishing...' : (editingId ? `Update as @${tokenUser.login}` : `Publish as @${tokenUser.login}`)}
                </button>
              ) : (
                <button
                  onClick={() => onAuthNeeded(markdown)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Sign in with GitHub →
                </button>
              )}
            </div>

            {!tokenUser && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Anonymous templates cannot be edited after publishing.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Manual end-to-end test**

With `npx wrangler pages dev dist --d1=DB` running (after `npm run build`):

1. Open `/studio`, generate or paste a manifest
2. Navigate to Export phase
3. Click "Publish Anonymously" — should show UUID URL and "View in Gallery" link
4. Click "View in Gallery" — should open the detail page with the manifest
5. From detail page, click "Open in Studio" — should load the manifest into Studio Edit phase
6. Back in Studio Export: click "Sign in with GitHub" — should redirect to GitHub login
7. After GitHub login, return to Studio with token in URL, then publish as GitHub user — should show `username/slug` URL

- [ ] **Step 4: Commit**

```bash
git add src/pages/Studio.jsx src/components/studio/ExportPanel.jsx
git commit -m "feat: add Studio publish panel and OAuth token handling"
```

---

## Final: Deploy to Cloudflare Pages

- [ ] **Step 1: Apply schema to production D1**

```bash
# Create production database (if not already done)
npx wrangler d1 create agentos-md-prod

# Update wrangler.toml with production database_id, then:
npx wrangler d1 execute agentos-md --file migrations/0001_initial.sql
```

- [ ] **Step 2: Set production secrets via Cloudflare dashboard**

In Cloudflare Pages → Settings → Environment Variables, add:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`

Update your GitHub OAuth App callback URL to `https://agentos.md/api/auth/callback`.

- [ ] **Step 3: Build and deploy**

```bash
npm run build
git push
```

Cloudflare Pages auto-deploys on push.

- [ ] **Step 4: Smoke test production**

1. Open `https://agentos.md/templates` — gallery loads
2. Publish an anonymous template from Studio — UUID URL returned
3. Sign in with GitHub from Studio — OAuth flow completes, token stored
4. Publish as GitHub user — `username/slug` URL returned, editable
