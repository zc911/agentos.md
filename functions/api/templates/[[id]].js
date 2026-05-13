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
  if (!raw) return ''
  return Array.isArray(raw) ? raw.join('/') : raw
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

// GET /api/templates        → list
// GET /api/templates/:id    → single template
export async function onRequestGet(context) {
  const { request, env } = context
  const id = resolveId(context)

  if (!id) {
    // List templates
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    const tags = url.searchParams.get('tags') || ''
    const cursorRaw = parseInt(url.searchParams.get('cursor') || '0')
    const cursor = cursorRaw > 0 ? cursorRaw : null
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '24') || 24, 48))
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

    let sql = `SELECT id, user_id, username, name, description, tags, downloads, created_at
      FROM templates t
      WHERE (? = '' OR name LIKE ? OR description LIKE ?)`
    const params = [q, `%${q}%`, `%${q}%`]

    for (const tag of tagList) {
      sql += ` AND EXISTS (SELECT 1 FROM json_each(t.tags) je WHERE je.value = ?)`
      params.push(tag)
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
      templates: rows.map(r => {
        let parsedTags = []
        try { parsedTags = JSON.parse(r.tags) } catch {}
        return { ...r, tags: parsedTags }
      }),
      nextCursor: hasMore ? rows[rows.length - 1].created_at : null,
    })
  }

  // Single template
  const row = await env.DB.prepare(
    `SELECT * FROM templates WHERE id = ?`
  ).bind(id).first()

  if (!row) return json({ error: 'Not found' }, 404)

  let tags = []
  try { tags = JSON.parse(row.tags) } catch {}
  return json({ ...row, tags })
}

// POST /api/templates       → create template
// POST /api/templates/:id   → increment download counter
export async function onRequestPost(context) {
  const { request, env } = context
  const id = resolveId(context)

  if (!id) {
    // Create template
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

    try {
      let newId
      if (user) {
        newId = await uniqueSlug(env.DB, user.login, slugify(name))
        await env.DB.prepare(
          `INSERT INTO templates (id, user_id, username, name, description, tags, markdown, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(newId, user.sub, user.login, name.trim(), description || '', tagsJson, markdown.trim(), now, now).run()
      } else {
        newId = crypto.randomUUID()
        await env.DB.prepare(
          `INSERT INTO templates (id, user_id, username, name, description, tags, markdown, created_at, updated_at)
           VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?)`
        ).bind(newId, name.trim(), description || '', tagsJson, markdown.trim(), now, now).run()
      }
      return json({ id: newId, url: `/templates/${newId}` }, 201)
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return json({ error: 'A template with this name already exists' }, 409)
      }
      return json({ error: 'Internal error' }, 500)
    }
  }

  // Increment download counter
  try {
    await env.DB.prepare(`UPDATE templates SET downloads = downloads + 1 WHERE id = ?`).bind(id).run()
    return new Response(null, { status: 204 })
  } catch {
    return json({ error: 'Internal error' }, 500)
  }
}

// PUT /api/templates/:id → update template
export async function onRequestPut(context) {
  const { request, env } = context
  const id = resolveId(context)
  if (!id) return json({ error: 'Not found' }, 404)

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

  try {
    await env.DB.prepare(
      `UPDATE templates SET name = ?, description = ?, tags = ?, markdown = ?, updated_at = unixepoch()
       WHERE id = ?`
    ).bind(name.trim(), description || '', JSON.stringify(tagsArr), markdown.trim(), id).run()
    return json({ id, url: `/templates/${id}` })
  } catch {
    return json({ error: 'Failed to update template' }, 500)
  }
}

// DELETE /api/templates/:id → delete template
export async function onRequestDelete(context) {
  const { request, env } = context
  const id = resolveId(context)
  if (!id) return json({ error: 'Not found' }, 404)

  const user = await getUser(request, env)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const row = await env.DB.prepare(`SELECT user_id FROM templates WHERE id = ?`).bind(id).first()
  if (!row) return json({ error: 'Not found' }, 404)
  if (row.user_id !== user.sub) return json({ error: 'Forbidden' }, 403)

  try {
    await env.DB.prepare(`DELETE FROM templates WHERE id = ?`).bind(id).run()
    return json({ deleted: true })
  } catch {
    return json({ error: 'Failed to delete template' }, 500)
  }
}
