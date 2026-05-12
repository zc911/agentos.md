const SYSTEM_PROMPT = `You are an expert at writing Agent Manifest files following the agentos.md v0.1 specification.

Generate a complete Agent Manifest in markdown based on the user's description. Return ONLY the manifest markdown with no explanation or code fences. The manifest MUST follow this exact structure:

---
name: [Agent Name]
version: 1.0.0
description: [One-line description]
author: unknown
tags: [tag1, tag2]
license: MIT
---

## Role

[Clear description of the agent's role and persona]

## Capabilities

- [capability 1]
- [capability 2]

## Constraints

- [constraint 1]
- [constraint 2]

## Memory

- [memory configuration, or omit this section if not applicable]

## Tools

- [tool name]: [read-only | write | all]

## Workflow

1. [step 1]
2. [step 2]`

export async function onRequestPost(context) {
  const { request, env } = context
  const apiKey = env.VOLCENGINE_API_KEY
  const model = env.VOLCENGINE_MODEL

  if (!apiKey || !model) {
    return new Response(JSON.stringify({ error: 'LLM not configured on server' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { description } = body
  if (!description || typeof description !== 'string' || !description.trim()) {
    return new Response(JSON.stringify({ error: 'description is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 28000)

  let llmResponse
  try {
    llmResponse = await fetch('https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'LLM request timed out or failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!llmResponse.ok) {
    const detail = await llmResponse.text()
    return new Response(JSON.stringify({ error: 'LLM upstream error', detail }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await llmResponse.json()
  const markdown = data.choices?.[0]?.message?.content ?? ''

  return new Response(JSON.stringify({ markdown }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
