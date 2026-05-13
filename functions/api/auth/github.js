// functions/api/auth/github.js
export async function onRequestGet(context) {
  const { env } = context
  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Service misconfigured', { status: 503 })
  }
  const state = crypto.randomUUID()
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user&state=${state}`
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  })
}
