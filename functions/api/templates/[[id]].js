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

  let tags = []
  try { tags = JSON.parse(row.tags) } catch {}
  return json({ ...row, tags })
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

export async function onRequestDelete(context) {
  const { request, env } = context
  const id = resolveId(context)
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
