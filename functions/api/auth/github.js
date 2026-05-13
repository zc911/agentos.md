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
