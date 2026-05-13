export async function onRequestGet(context) {
  const { env } = context
  try {
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
  } catch {
    return new Response(JSON.stringify({ tags: [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
