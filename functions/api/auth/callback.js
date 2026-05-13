// functions/api/auth/callback.js
import { mintJWT } from '../_jwt.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.JWT_SECRET) {
    return Response.redirect(`${origin}/studio?auth_error=1`, 302)
  }

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
    if (!ghUser.id || !ghUser.login) {
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
