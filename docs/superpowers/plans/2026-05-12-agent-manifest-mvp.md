# Agent Manifest Standard + Tool Site (Phase 1 MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Agent Manifest v0.1 spec page and /studio tool (Generate → Edit → Validate → Export) on agentos.md, with a Cloudflare Pages Function proxying LLM requests to 火山引擎豆包 API.

**Architecture:** The manifest library (parser, exporter, validator) runs entirely in the browser with no backend dependency. The only server-side piece is a Cloudflare Pages Function that forwards generation requests to 火山引擎 and keeps the API key secret. Monaco Editor is the single source of truth for manifest state; the structured form derives its display by parsing the markdown on every render and writes back to markdown on every change.

**Tech Stack:** React 18 + Vite, @monaco-editor/react, Vitest, Cloudflare Pages Functions (Workers runtime), 火山引擎豆包 API (OpenAI-compatible endpoint)

**Scope:** Phase 1 only — no auth, no database, no template library. Those are Phase 2.

---

## File Map

**Create:**
- `src/lib/manifest/schema.js` — section names, required fields, platform definitions
- `src/lib/manifest/parser.js` — markdown string → `{ frontmatter, sections }` object
- `src/lib/manifest/exporter.js` — manifest object + platform → platform-specific markdown string
- `src/lib/manifest/validator.js` — manifest object → `[{ level, field, message }]` issues array
- `src/lib/manifest/parser.test.js`
- `src/lib/manifest/exporter.test.js`
- `src/lib/manifest/validator.test.js`
- `src/components/studio/GeneratePanel.jsx` — description textarea + generate button, owns loading state
- `src/components/studio/ManifestForm.jsx` — structured form fields per section, writes back to markdown
- `src/components/studio/EditPanel.jsx` — Monaco Editor (source of truth) + ManifestForm side by side
- `src/components/studio/ValidatePanel.jsx` — Error/Warning/Suggestion issue list
- `src/components/studio/ExportPanel.jsx` — platform selector, preview, download button
- `src/pages/Studio.jsx` — /studio page, phase tabs, orchestrates all panels
- `src/pages/Spec.jsx` — /spec page with Agent Manifest v0.1 documentation
- `functions/api/generate.js` — Cloudflare Pages Function, LLM proxy
- `.dev.vars` — local secrets (not committed)

**Modify:**
- `src/App.jsx` — add /studio and /spec routes
- `src/components/Header.jsx` — translate nav links to English, add Studio and Spec links
- `src/pages/Home.jsx` — translate "访问项目 →" to "Visit project →"
- `src/pages/Navigation.jsx` — translate category names and UI strings to English
- `src/pages/Blog.jsx` — translate "阅读全文 →" and submission section to English
- `package.json` — add @monaco-editor/react, vitest, dev:pages script
- `vite.config.js` — add vitest config
- `.gitignore` — add .dev.vars

---

## Task 1: Project setup — test runner + Monaco Editor dependency

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `.gitignore`
- Create: `functions/api/generate.js` (stub)
- Create: `.dev.vars` (not committed)

- [ ] **Step 1: Install dependencies**

```bash
npm install @monaco-editor/react
npm install -D vitest @vitest/ui jsdom
```

- [ ] **Step 2: Add vitest config to vite.config.js**

Replace the full contents of `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Add scripts to package.json**

Update the `scripts` section in `package.json`:

```json
"scripts": {
  "dev": "vite",
  "dev:pages": "wrangler pages dev dist --compatibility-date=2024-01-01",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Add .dev.vars to .gitignore**

Append to `.gitignore` (create it if it doesn't exist):

```
.dev.vars
```

- [ ] **Step 5: Create .dev.vars with placeholder values**

```
VOLCENGINE_API_KEY=replace-with-your-key
VOLCENGINE_MODEL=replace-with-your-endpoint-id
```

- [ ] **Step 6: Create stub Pages Function**

Create `functions/api/generate.js`:

```js
export async function onRequestPost(context) {
  return new Response(JSON.stringify({ error: 'not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 7: Verify test runner works**

```bash
npm test
```

Expected output contains "No test files found" or "0 tests" — no error exit code.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore functions/api/generate.js
git commit -m "chore: add vitest, Monaco Editor, Cloudflare Pages Function stub"
```

---

## Task 2: Manifest schema constants

**Files:**
- Create: `src/lib/manifest/schema.js`

- [ ] **Step 1: Create schema.js**

```js
export const REQUIRED_FRONTMATTER = ['name', 'version', 'description']

export const SECTIONS = ['Role', 'Capabilities', 'Constraints', 'Memory', 'Tools', 'Workflow']
export const REQUIRED_SECTIONS = ['Role']

export const PLATFORMS = {
  claude: { label: 'CLAUDE.md', filename: 'CLAUDE.md' },
  openai: { label: 'AGENTS.md', filename: 'AGENTS.md' },
  gemini: { label: 'GEMINI.md', filename: 'GEMINI.md' },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/manifest/schema.js
git commit -m "feat: add manifest schema constants"
```

---

## Task 3: Manifest parser (TDD)

**Files:**
- Create: `src/lib/manifest/parser.test.js`
- Create: `src/lib/manifest/parser.js`

The parser converts a raw markdown string to:
```js
{ frontmatter: { name, version, ... }, sections: { Role: '...', Capabilities: '...', ... } }
```
Missing sections return `''`. Missing frontmatter returns `{}`.

- [ ] **Step 1: Write failing tests**

Create `src/lib/manifest/parser.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { parseManifest } from './parser'

const SAMPLE = `---
name: Test Agent
version: 1.0.0
description: A test agent
author: testuser
tags: [testing, vitest]
license: MIT
---

## Role

You are a test agent.

## Capabilities

- Do testing
- Assert results

## Constraints

- No side effects

## Tools

- bash: read-only
`

describe('parseManifest', () => {
  it('parses string frontmatter fields', () => {
    const result = parseManifest(SAMPLE)
    expect(result.frontmatter.name).toBe('Test Agent')
    expect(result.frontmatter.version).toBe('1.0.0')
    expect(result.frontmatter.description).toBe('A test agent')
    expect(result.frontmatter.author).toBe('testuser')
    expect(result.frontmatter.license).toBe('MIT')
  })

  it('parses tags as array', () => {
    const result = parseManifest(SAMPLE)
    expect(result.frontmatter.tags).toEqual(['testing', 'vitest'])
  })

  it('parses Role section content', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Role).toContain('You are a test agent.')
  })

  it('parses Capabilities section content', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Capabilities).toContain('Do testing')
  })

  it('returns empty string for missing sections', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Memory).toBe('')
    expect(result.sections.Workflow).toBe('')
  })

  it('returns empty object when no frontmatter present', () => {
    const result = parseManifest('## Role\n\nYou are an agent.')
    expect(result.frontmatter).toEqual({})
    expect(result.sections.Role).toContain('You are an agent.')
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```

Expected: FAIL with "Cannot find module './parser'"

- [ ] **Step 3: Implement parser.js**

Create `src/lib/manifest/parser.js`:

```js
import { SECTIONS } from './schema.js'

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const raw = line.slice(colonIdx + 1).trim()
    if (raw.startsWith('[') && raw.endsWith(']')) {
      result[key] = raw.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
    } else {
      result[key] = raw
    }
  }
  return result
}

function parseBody(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '')
  const sectionMap = Object.fromEntries(SECTIONS.map(name => [name, '']))
  for (const part of body.split(/\n## /)) {
    const newline = part.indexOf('\n')
    if (newline === -1) continue
    const heading = part.slice(0, newline).trim()
    const content = part.slice(newline + 1).trim()
    if (SECTIONS.includes(heading)) {
      sectionMap[heading] = content
    }
  }
  return sectionMap
}

export function parseManifest(markdown) {
  return {
    frontmatter: parseFrontmatter(markdown),
    sections: parseBody(markdown),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/manifest/parser.js src/lib/manifest/parser.test.js
git commit -m "feat: implement manifest parser with tests"
```

---

## Task 4: Export engine (TDD)

**Files:**
- Create: `src/lib/manifest/exporter.test.js`
- Create: `src/lib/manifest/exporter.js`

Input: `{ frontmatter, sections }` object + platform key (`'claude'` | `'openai'` | `'gemini'`).
Output: platform-specific markdown string.

- [ ] **Step 1: Write failing tests**

Create `src/lib/manifest/exporter.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { exportManifest } from './exporter'

const MANIFEST = {
  frontmatter: { name: 'Test Agent', version: '1.0.0', description: 'A test agent' },
  sections: {
    Role: 'You are a test agent.',
    Capabilities: '- Do testing\n- Assert results',
    Constraints: '- No side effects',
    Memory: '',
    Tools: '- bash: read-only',
    Workflow: '1. Think\n2. Act',
  },
}

describe('exportManifest — claude', () => {
  it('contains role content', () => {
    expect(exportManifest(MANIFEST, 'claude')).toContain('You are a test agent.')
  })
  it('contains constraints', () => {
    expect(exportManifest(MANIFEST, 'claude')).toContain('No side effects')
  })
  it('contains tools', () => {
    expect(exportManifest(MANIFEST, 'claude')).toContain('bash: read-only')
  })
  it('includes generated-by comment', () => {
    expect(exportManifest(MANIFEST, 'claude')).toContain('Generated by agentos.md')
  })
  it('skips empty Memory section', () => {
    const output = exportManifest(MANIFEST, 'claude')
    const lines = output.split('\n')
    const memIdx = lines.findIndex(l => l.trim() === '## Memory Configuration')
    if (memIdx !== -1) {
      expect(lines[memIdx + 1].trim()).not.toBe('')
    }
  })
})

describe('exportManifest — openai', () => {
  it('contains role content', () => {
    expect(exportManifest(MANIFEST, 'openai')).toContain('You are a test agent.')
  })
  it('contains constraints', () => {
    expect(exportManifest(MANIFEST, 'openai')).toContain('No side effects')
  })
})

describe('exportManifest — gemini', () => {
  it('contains role content', () => {
    expect(exportManifest(MANIFEST, 'gemini')).toContain('You are a test agent.')
  })
})

describe('exportManifest — edge cases', () => {
  it('throws on unknown platform', () => {
    expect(() => exportManifest(MANIFEST, 'unknown')).toThrow('Unknown platform')
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```

Expected: FAIL with "Cannot find module './exporter'"

- [ ] **Step 3: Implement exporter.js**

Create `src/lib/manifest/exporter.js`:

```js
const HEADER = '<!-- Generated by agentos.md — Agent Manifest Standard v0.1 -->\n\n'

function section(title, content) {
  if (!content || !content.trim()) return ''
  return `## ${title}\n\n${content.trim()}\n\n`
}

function agentMeta(frontmatter) {
  return `<!-- Agent: ${frontmatter.name || 'Unnamed'} v${frontmatter.version || '0.0.0'} -->\n\n`
}

export function exportManifest(manifest, platform) {
  const { frontmatter, sections } = manifest
  const meta = agentMeta(frontmatter)

  if (platform === 'claude') {
    return (
      HEADER + meta +
      section('Role', sections.Role) +
      section('Capabilities', sections.Capabilities) +
      section('Constraints', sections.Constraints) +
      section('Memory Configuration', sections.Memory) +
      section('Allowed Tools', sections.Tools) +
      section('Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  if (platform === 'openai') {
    return (
      HEADER + meta +
      section('System Instructions', sections.Role) +
      section('Capabilities', sections.Capabilities) +
      section('Constraints', sections.Constraints) +
      section('Tools', sections.Tools) +
      section('Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  if (platform === 'gemini') {
    return (
      HEADER + meta +
      section('Role', sections.Role) +
      section('Capabilities', sections.Capabilities) +
      section('Constraints', sections.Constraints) +
      section('Tools', sections.Tools) +
      section('Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  throw new Error(`Unknown platform: ${platform}`)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/manifest/exporter.js src/lib/manifest/exporter.test.js
git commit -m "feat: implement manifest exporter with tests"
```

---

## Task 5: Validator (TDD)

**Files:**
- Create: `src/lib/manifest/validator.test.js`
- Create: `src/lib/manifest/validator.js`

Input: `{ frontmatter, sections }` object.
Output: `[{ level: 'error'|'warning'|'suggestion', field: string, message: string }]`

- [ ] **Step 1: Write failing tests**

Create `src/lib/manifest/validator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { validateManifest } from './validator'

const VALID = {
  frontmatter: { name: 'Test Agent', version: '1.0.0', description: 'A test agent' },
  sections: {
    Role: 'You are a test agent.',
    Capabilities: '- Do testing',
    Constraints: '- No side effects',
    Memory: '',
    Tools: '- bash: read-only',
    Workflow: '1. Do it',
  },
}

describe('errors', () => {
  it('errors when name is missing', () => {
    const m = { ...VALID, frontmatter: { version: '1.0.0', description: 'x' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'name')).toBe(true)
  })

  it('errors when version is missing', () => {
    const m = { ...VALID, frontmatter: { name: 'x', description: 'x' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'version')).toBe(true)
  })

  it('errors when Role section is empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Role: '' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'Role')).toBe(true)
  })

  it('returns no errors for a valid manifest', () => {
    expect(validateManifest(VALID).filter(i => i.level === 'error')).toHaveLength(0)
  })
})

describe('warnings', () => {
  it('warns when Tools contains broad permissions', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Tools: '- bash: all' } }
    expect(validateManifest(m).some(i => i.level === 'warning' && i.field === 'Tools')).toBe(true)
  })
})

describe('suggestions', () => {
  it('suggests adding Constraints when empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Constraints: '' } }
    expect(validateManifest(m).some(i => i.level === 'suggestion' && i.field === 'Constraints')).toBe(true)
  })

  it('suggests adding Workflow when empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Workflow: '' } }
    expect(validateManifest(m).some(i => i.level === 'suggestion' && i.field === 'Workflow')).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```

Expected: FAIL with "Cannot find module './validator'"

- [ ] **Step 3: Implement validator.js**

Create `src/lib/manifest/validator.js`:

```js
import { REQUIRED_FRONTMATTER, REQUIRED_SECTIONS } from './schema.js'

export function validateManifest(manifest) {
  const issues = []
  const { frontmatter, sections } = manifest

  for (const field of REQUIRED_FRONTMATTER) {
    if (!frontmatter[field] || !String(frontmatter[field]).trim()) {
      issues.push({ level: 'error', field, message: `"${field}" is required in frontmatter` })
    }
  }

  for (const name of REQUIRED_SECTIONS) {
    if (!sections[name] || !sections[name].trim()) {
      issues.push({ level: 'error', field: name, message: `"${name}" section is required` })
    }
  }

  if (sections.Tools && /:\s*(all|write|\*)/i.test(sections.Tools)) {
    issues.push({
      level: 'warning',
      field: 'Tools',
      message: 'Broad tool permissions detected — consider restricting to read-only',
    })
  }

  if (!sections.Constraints || !sections.Constraints.trim()) {
    issues.push({
      level: 'suggestion',
      field: 'Constraints',
      message: 'Adding a Constraints section improves agent safety and predictability',
    })
  }

  if (!sections.Workflow || !sections.Workflow.trim()) {
    issues.push({
      level: 'suggestion',
      field: 'Workflow',
      message: 'A Workflow section helps the agent follow a consistent process',
    })
  }

  return issues
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/manifest/validator.js src/lib/manifest/validator.test.js
git commit -m "feat: implement manifest validator with tests"
```

---

## Task 6: Cloudflare Pages Function — LLM proxy

**Files:**
- Modify: `functions/api/generate.js`

Receives `POST { description: string }`, calls 火山引擎豆包 API, returns `{ markdown: string }`.
API key stored as Cloudflare Pages Secret `VOLCENGINE_API_KEY`.
Model endpoint stored as `VOLCENGINE_MODEL`.

**Before starting:** Fill in real values in `.dev.vars`:
```
VOLCENGINE_API_KEY=your-actual-key
VOLCENGINE_MODEL=your-actual-endpoint-id
```

- [ ] **Step 1: Implement functions/api/generate.js**

```js
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

  let llmResponse
  try {
    llmResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
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
      signal: AbortSignal.timeout(28000),
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'LLM request timed out or failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
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
```

- [ ] **Step 2: Test locally with wrangler**

```bash
npm run build
npm run dev:pages
```

In a second terminal:
```bash
curl -X POST http://localhost:8788/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "A simple code review agent for GitHub PRs"}'
```

Expected: `{ "markdown": "---\nname: ..." }` with a complete manifest

- [ ] **Step 3: Commit**

```bash
git add functions/api/generate.js
git commit -m "feat: implement LLM proxy Pages Function using 火山引擎豆包 API"
```

---

## Task 7: Studio page — Generate panel

**Files:**
- Create: `src/components/studio/GeneratePanel.jsx`
- Create: `src/pages/Studio.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Create GeneratePanel.jsx**

Create `src/components/studio/GeneratePanel.jsx`:

```jsx
import React, { useState } from 'react'

export default function GeneratePanel({ onGenerated }) {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!description.trim()) return
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      onGenerated(data.markdown)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Describe your agent</h2>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="e.g. An agent that reviews GitHub pull requests and gives structured feedback on code quality, security, and style..."
        rows={5}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ color: '#f87171', marginTop: '0.5rem' }}>{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !description.trim()}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: isLoading || !description.trim() ? 'var(--bg-secondary)' : 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: isLoading || !description.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Generating...' : 'Generate Manifest →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create Studio.jsx (generate phase + phase tab shell)**

Create `src/pages/Studio.jsx`:

```jsx
import React, { useState } from 'react'
import GeneratePanel from '../components/studio/GeneratePanel'

const PHASES = ['generate', 'edit', 'validate', 'export']

export default function Studio() {
  const [markdown, setMarkdown] = useState('')
  const [phase, setPhase] = useState('generate')

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Agent Manifest Studio</h1>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            {PHASES.map(p => (
              <button
                key={p}
                onClick={() => (markdown || p === 'generate') && setPhase(p)}
                style={{
                  background: phase === p ? 'var(--accent)' : 'transparent',
                  color: phase === p ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.25rem',
                  cursor: markdown || p === 'generate' ? 'pointer' : 'not-allowed',
                  textTransform: 'capitalize',
                  fontWeight: phase === p ? '600' : '400',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {phase === 'generate' && (
            <GeneratePanel onGenerated={md => { setMarkdown(md); setPhase('edit') }} />
          )}

          {phase === 'edit' && (
            <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
              {markdown}
            </pre>
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Add /studio route to App.jsx**

In `src/App.jsx`, add import and route:

```jsx
import Studio from './pages/Studio'
// inside <Routes>:
<Route path="/studio" element={<Studio />} />
```

- [ ] **Step 4: Update Header.jsx — translate nav links and add Studio + Spec**

Replace the full contents of `src/components/Header.jsx`:

```jsx
import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="logo">Agent OS</Link>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/spec">Spec</Link></li>
            <li><Link to="/studio">Studio</Link></li>
            <li><Link to="/navigation">Resources</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
```

- [ ] **Step 5: Test in browser**

```bash
npm run build && npm run dev:pages
```

Open http://localhost:8788/studio. Enter a description and click Generate. Verify:
- The markdown output appears in the edit tab
- The phase tabs are rendered
- Edit/Validate/Export tabs are inert until generation completes

- [ ] **Step 6: Commit**

```bash
git add src/components/studio/GeneratePanel.jsx src/pages/Studio.jsx src/App.jsx src/components/Header.jsx
git commit -m "feat: add /studio page with generate phase and phase tabs"
```

---

## Task 8: Studio — Edit panel (Monaco + structured form)

**Files:**
- Create: `src/components/studio/ManifestForm.jsx`
- Create: `src/components/studio/EditPanel.jsx`
- Modify: `src/pages/Studio.jsx`

- [ ] **Step 1: Create ManifestForm.jsx**

Create `src/components/studio/ManifestForm.jsx`:

```jsx
import React from 'react'
import { SECTIONS } from '../../lib/manifest/schema'

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  marginBottom: '0.75rem',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
}

export default function ManifestForm({ frontmatter, sections, onChange }) {
  function updateFrontmatter(key, value) {
    onChange({ frontmatter: { ...frontmatter, [key]: value }, sections })
  }

  function updateSection(key, value) {
    onChange({ frontmatter, sections: { ...sections, [key]: value } })
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingRight: '0.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Metadata
      </p>
      {['name', 'version', 'description', 'author', 'license'].map(field => (
        <div key={field}>
          <label style={labelStyle}>{field}</label>
          <input
            type="text"
            value={frontmatter[field] || ''}
            onChange={e => updateFrontmatter(field, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '1rem 0' }}>
        Sections
      </p>
      {SECTIONS.map(name => (
        <div key={name}>
          <label style={labelStyle}>{name}</label>
          <textarea
            value={sections[name] || ''}
            onChange={e => updateSection(name, e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create EditPanel.jsx**

Create `src/components/studio/EditPanel.jsx`:

```jsx
import React, { useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { parseManifest } from '../../lib/manifest/parser'
import ManifestForm from './ManifestForm'

function buildMarkdown(frontmatter, sections) {
  const fmLines = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`)
    .join('\n')

  const body = Object.entries(sections)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `## ${k}\n\n${v.trim()}`)
    .join('\n\n')

  return fmLines ? `---\n${fmLines}\n---\n\n${body}` : body
}

export default function EditPanel({ markdown, onChange }) {
  const parsed = parseManifest(markdown)

  const handleFormChange = useCallback(({ frontmatter, sections }) => {
    onChange(buildMarkdown(frontmatter, sections))
  }, [onChange])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '70vh' }}>
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Form editor
        </p>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ManifestForm
            frontmatter={parsed.frontmatter}
            sections={parsed.sections}
            onChange={handleFormChange}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Markdown (source of truth)
        </p>
        <Editor
          height="calc(70vh - 2rem)"
          defaultLanguage="markdown"
          value={markdown}
          onChange={value => onChange(value ?? '')}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 13 }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add EditPanel to Studio.jsx**

In `src/pages/Studio.jsx`, add the import and replace the edit phase stub:

```jsx
import EditPanel from '../components/studio/EditPanel'
// Replace the existing edit phase JSX:
{phase === 'edit' && (
  <EditPanel markdown={markdown} onChange={setMarkdown} />
)}
```

- [ ] **Step 4: Test in browser**

```bash
npm run build && npm run dev:pages
```

Generate a manifest, switch to Edit. Verify:
- Monaco Editor shows the generated markdown
- Form fields reflect the parsed content
- Typing in Monaco updates form on next render
- Changing a form field rewrites the markdown in Monaco

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/EditPanel.jsx src/components/studio/ManifestForm.jsx src/pages/Studio.jsx
git commit -m "feat: add edit panel with Monaco Editor and structured form"
```

---

## Task 9: Studio — Validate panel

**Files:**
- Create: `src/components/studio/ValidatePanel.jsx`
- Modify: `src/pages/Studio.jsx`

- [ ] **Step 1: Create ValidatePanel.jsx**

Create `src/components/studio/ValidatePanel.jsx`:

```jsx
import React from 'react'
import { parseManifest } from '../../lib/manifest/parser'
import { validateManifest } from '../../lib/manifest/validator'

const LEVEL = {
  error:      { color: '#f87171', icon: '✕', label: 'Error' },
  warning:    { color: '#fbbf24', icon: '⚠', label: 'Warning' },
  suggestion: { color: '#60a5fa', icon: '→', label: 'Suggestion' },
}

export default function ValidatePanel({ markdown }) {
  const issues = validateManifest(parseManifest(markdown))
  const counts = { error: 0, warning: 0, suggestion: 0 }
  issues.forEach(i => counts[i.level]++)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        {Object.entries(counts).map(([level, count]) => (
          <span key={level} style={{ color: LEVEL[level].color }}>
            {count} {level}{count !== 1 ? 's' : ''}
          </span>
        ))}
      </div>

      {issues.length === 0 && (
        <div style={{ color: '#4ade80', fontSize: '1.1rem' }}>
          ✓ Manifest looks good — no issues found
        </div>
      )}

      {issues.map((issue, i) => {
        const { color, icon } = LEVEL[issue.level]
        return (
          <div key={i} style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            borderLeft: `3px solid ${color}`,
          }}>
            <span style={{ color, fontWeight: 'bold', flexShrink: 0 }}>{icon}</span>
            <div>
              <span style={{ color, fontWeight: '600', marginRight: '0.5rem' }}>{issue.field}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{issue.message}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add ValidatePanel to Studio.jsx**

In `src/pages/Studio.jsx`, add import and validate phase:

```jsx
import ValidatePanel from '../components/studio/ValidatePanel'
// Add inside the phase rendering:
{phase === 'validate' && (
  <ValidatePanel markdown={markdown} />
)}
```

- [ ] **Step 3: Test in browser**

Generate a manifest. On the Validate tab, verify:
- Valid manifest shows the green "✓ no issues" message
- Delete the `name:` line from Monaco → switch to Validate → red error appears

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/ValidatePanel.jsx src/pages/Studio.jsx
git commit -m "feat: add validate panel with Error/Warning/Suggestion display"
```

---

## Task 10: Studio — Export panel

**Files:**
- Create: `src/components/studio/ExportPanel.jsx`
- Modify: `src/pages/Studio.jsx`

- [ ] **Step 1: Create ExportPanel.jsx**

Create `src/components/studio/ExportPanel.jsx`:

```jsx
import React, { useState } from 'react'
import { parseManifest } from '../../lib/manifest/parser'
import { validateManifest } from '../../lib/manifest/validator'
import { exportManifest } from '../../lib/manifest/exporter'
import { PLATFORMS } from '../../lib/manifest/schema'

export default function ExportPanel({ markdown }) {
  const [selected, setSelected] = useState('claude')
  const manifest = parseManifest(markdown)
  const errors = validateManifest(manifest).filter(i => i.level === 'error')
  const hasErrors = errors.length > 0
  const preview = hasErrors ? '' : exportManifest(manifest, selected)

  function handleDownload() {
    const blob = new Blob([preview], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = PLATFORMS[selected].filename
    a.click()
    URL.revokeObjectURL(url)
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
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        {Object.entries(PLATFORMS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            style={{
              padding: '0.6rem 1.25rem',
              background: selected === key ? 'var(--accent)' : 'var(--bg-secondary)',
              color: selected === key ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: selected === key ? '600' : '400',
            }}
          >
            {label}
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
        }}
      >
        Download {PLATFORMS[selected]?.filename}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add ExportPanel to Studio.jsx**

In `src/pages/Studio.jsx`, add import and export phase:

```jsx
import ExportPanel from '../components/studio/ExportPanel'
// Add inside the phase rendering:
{phase === 'export' && (
  <ExportPanel markdown={markdown} />
)}
```

- [ ] **Step 3: Test in browser**

Go through the full flow: Generate → Edit → Validate → Export. Verify:
- Platform buttons switch the preview between CLAUDE.md / AGENTS.md / GEMINI.md formats
- Download button produces the correct file
- With a validation error present, download button is disabled and a message points to Validate tab

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/ExportPanel.jsx src/pages/Studio.jsx
git commit -m "feat: add export panel with platform selector, preview, and download"
```

---

## Task 11: Spec documentation page

**Files:**
- Create: `src/pages/Spec.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create Spec.jsx**

Create `src/pages/Spec.jsx`:

```jsx
import React from 'react'

const EXAMPLE = `---
name: Code Review Agent
version: 1.0.0
description: Reviews PRs and provides actionable feedback
author: your-github-username
tags: [code-review, git, development]
license: MIT
---

## Role

You are a senior software engineer. Your responsibility is to review
code changes and provide constructive, actionable feedback.

## Capabilities

- Analyze code for bugs, security issues, and performance problems
- Suggest improvements following best practices
- Explain technical concepts clearly

## Constraints

- Do not modify files unless explicitly asked
- Never approve PRs with security vulnerabilities
- Always be constructive, focus on code not the author

## Memory

- Store review patterns in \`.agent/memory/\`
- Remember recurring issues for consistent feedback

## Tools

- bash: read-only
- git: read-only

## Workflow

1. Read PR description and understand context
2. Review changed files systematically
3. Output: Critical Issues / Suggestions / Praise`

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }
const thStyle = { textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }

export default function Spec() {
  return (
    <main>
      <div className="container">
        <section className="section" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Agent Manifest</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
            Open specification v0.1 — A platform-agnostic format for AI agent configuration
          </p>

          <h2>Overview</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '2rem' }}>
            An Agent Manifest is a structured markdown file that fully describes an AI agent's role,
            capabilities, constraints, and workflow. It is platform-agnostic and can be exported to{' '}
            <code>CLAUDE.md</code>, <code>AGENTS.md</code>, <code>GEMINI.md</code>, and other formats.
          </p>

          <h2>Example</h2>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1.5rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
          }}>
            {EXAMPLE}
          </pre>

          <h2>Frontmatter Fields</h2>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Field</th><th style={thStyle}>Required</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['name', true, 'Human-readable name for the agent'],
                ['version', true, 'Semantic version (e.g. 1.0.0)'],
                ['description', true, 'One-line summary of what the agent does'],
                ['author', false, 'GitHub username or display name'],
                ['tags', false, 'Array of keywords for discovery'],
                ['license', false, 'SPDX license identifier (e.g. MIT)'],
              ].map(([field, req, desc]) => (
                <tr key={field}>
                  <td style={tdStyle}><code>{field}</code></td>
                  <td style={{ ...tdStyle, color: req ? '#f87171' : 'var(--text-secondary)' }}>{req ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Sections</h2>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Section</th><th style={thStyle}>Required</th><th style={thStyle}>Purpose</th></tr>
            </thead>
            <tbody>
              {[
                ['Role', true, "Defines the agent's persona and primary responsibility"],
                ['Capabilities', false, 'Lists what the agent can do'],
                ['Constraints', false, 'Defines safety rules and behavioral boundaries'],
                ['Memory', false, 'Describes how the agent stores and retrieves context'],
                ['Tools', false, 'Lists tools and their permission levels'],
                ['Workflow', false, 'Step-by-step process the agent follows'],
              ].map(([name, req, purpose]) => (
                <tr key={name}>
                  <td style={tdStyle}><code>{'## ' + name}</code></td>
                  <td style={{ ...tdStyle, color: req ? '#f87171' : 'var(--text-secondary)' }}>{req ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Platform Export Map</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Section</th>
                <th style={thStyle}>CLAUDE.md</th>
                <th style={thStyle}>AGENTS.md</th>
                <th style={thStyle}>GEMINI.md</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Role', 'Role', 'System Instructions', 'Role'],
                ['Capabilities', 'Capabilities', 'Capabilities', 'Capabilities'],
                ['Constraints', 'Constraints', 'Constraints', 'Constraints'],
                ['Memory', 'Memory Configuration', '(omitted)', '(omitted)'],
                ['Tools', 'Allowed Tools', 'Tools', 'Tools'],
                ['Workflow', 'Workflow', 'Workflow', 'Workflow'],
              ].map(([s, c, o, g]) => (
                <tr key={s}>
                  <td style={tdStyle}><code>{s}</code></td>
                  <td style={tdStyle}>{c}</td>
                  <td style={tdStyle}>{o}</td>
                  <td style={tdStyle}>{g}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a
              href="/studio"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Try the Studio →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add /spec route to App.jsx**

In `src/App.jsx`, add import and route:

```jsx
import Spec from './pages/Spec'
// inside <Routes>:
<Route path="/spec" element={<Spec />} />
```

- [ ] **Step 3: Test in browser**

Open http://localhost:8788/spec. Verify:
- Tables render correctly with Required column highlighted in red for required fields
- Code example displays correctly
- "Try the Studio →" link navigates to /studio

- [ ] **Step 4: Commit**

```bash
git add src/pages/Spec.jsx src/App.jsx
git commit -m "feat: add Agent Manifest v0.1 spec documentation page"
```

---

## Task 12: Translate remaining Chinese text to English

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Navigation.jsx`
- Modify: `src/pages/Blog.jsx`

- [ ] **Step 1: Fix Home.jsx**

In `src/pages/Home.jsx`, change line 57:
- Old: `访问项目 →`
- New: `Visit project →`

- [ ] **Step 2: Fix Navigation.jsx**

In `src/pages/Navigation.jsx`, replace the `resources` object keys and UI strings:

- Key `教程文档` → `'Tutorials & Docs'`
- Key `开源项目` → `'Open Source'`
- Key `社区资源` → `'Community'`
- Key `开发工具` → `'Dev Tools'`

Replace the submission CTA block (lines 101–107) with:

```jsx
<div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', borderRadius: '12px', color: 'white', textAlign: 'center', marginTop: '3rem' }}>
  <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Submit a Resource</h3>
  <p style={{ marginBottom: '1rem' }}>Know a great Agent OS resource that should be listed here? Send it our way.</p>
  <a href="mailto:zack.mm.chen@gmail.com" style={{ color: 'white', fontWeight: '600', textDecoration: 'underline' }}>
    Submit a resource →
  </a>
</div>
```

Also translate the page title on line 79:
- Old: `Agent OS 资源导航`
- New: `Agent OS Resources`

- [ ] **Step 3: Fix Blog.jsx**

In `src/pages/Blog.jsx`:
- Line 57: `阅读全文 →` → `Read more →`
- Line 63: `投稿指南` (the h3 in the CTA) → `Write for Us`
- Lines 65–66: Replace Chinese submission text with:
  ```
  We welcome technical articles on Agent OS, agent tooling, and real-world agent deployments.
  High-quality submissions are published with attribution.
  ```
- Line 69: `查看投稿详情 →` → `Get in touch →`
- Line 47: `Agent OS 技术博客` → `Agent OS Blog`

- [ ] **Step 4: Run full test suite and verify no regressions**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/pages/Navigation.jsx src/pages/Blog.jsx
git commit -m "fix: translate remaining Chinese UI text to English"
```

---

## Task 13: Production deploy

- [ ] **Step 1: Final build**

```bash
npm run build
```

Expected: build completes with no errors, `dist/` populated

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Set secrets in Cloudflare Pages dashboard**

In Cloudflare Pages → your project → Settings → Environment Variables, add:
- `VOLCENGINE_API_KEY` — your 火山引擎 API key (set as Secret, not plaintext)
- `VOLCENGINE_MODEL` — your 豆包 endpoint ID (e.g. `ep-xxxxxxxx-xxxxxx`)

- [ ] **Step 4: Push to trigger deployment**

```bash
git push origin master
```

Monitor the build log in Cloudflare Pages dashboard. Expected: build and deploy succeed.

- [ ] **Step 5: Smoke test production**

Open https://agentos.md/studio. Run the full flow:
1. Enter a description → Generate
2. Edit a field in the form → verify Monaco updates
3. Go to Validate → verify no errors on a well-formed manifest
4. Go to Export → select CLAUDE.md → Download → verify file content is correct

Open https://agentos.md/spec. Verify all tables and the code example render correctly.
