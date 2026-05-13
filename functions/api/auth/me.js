// functions/api/auth/me.js
import { verifyJWT } from '../_jwt.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(
    JSON.stringify({ id: payload.sub, login: payload.login, avatar: payload.avatar }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
