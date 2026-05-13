# UX Polish + Platform Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the homepage to reflect the Agent Manifest mission, polish the Studio UX with a step indicator and collapsible layout, and expand the export panel from 3 platforms to 6 (adding Hermes/OpenClaw SOUL.md, Cursor agent.mdc, Windsurf .windsurfrules).

**Architecture:** All changes are frontend-only (React + Vite). Export logic lives in `src/lib/manifest/` (pure functions, tested with vitest). UI components are in `src/components/studio/` and `src/pages/`. No backend changes needed.

**Tech Stack:** React 18, Vite 5, vitest 2, Monaco Editor (`@monaco-editor/react`), react-router-dom v6, Cloudflare Pages

---

## File Map

| File | Change |
|------|--------|
| `src/lib/manifest/schema.js` | Add 3 new platforms with `note` field |
| `src/lib/manifest/exporter.js` | Add `hermes`, `cursor`, `windsurf` export branches |
| `src/lib/manifest/exporter.test.js` | Add tests for 3 new platforms |
| `src/components/studio/ExportPanel.jsx` | Replace button row with 2×3 card grid |
| `src/pages/Studio.jsx` | Add numbered step indicator + Start Over button |
| `src/components/studio/GeneratePanel.jsx` | Add 4 example prompt chips |
| `src/components/studio/EditPanel.jsx` | Collapsible form sidebar (fixed 300px) |
| `src/pages/Home.jsx` | Full rewrite — manifest mission, dual CTA, platform row, how-it-works, code example |

---

## Task 1: Expand PLATFORMS in schema.js

**Context:** `schema.js` is the single source of truth for platform constants used by both `exporter.js` and `ExportPanel.jsx`. The existing `PLATFORMS` object has no `note` field. Adding it here unblocks all downstream tasks.

**Files:**
- Modify: `src/lib/manifest/schema.js`

- [ ] **Step 1: Replace the PLATFORMS export**

Open `src/lib/manifest/schema.js`. The file currently reads:

```js
export const PLATFORMS = {
  claude: { label: 'CLAUDE.md', filename: 'CLAUDE.md' },
  openai: { label: 'AGENTS.md', filename: 'AGENTS.md' },
  gemini: { label: 'GEMINI.md', filename: 'GEMINI.md' },
}
```

Replace the entire `PLATFORMS` export with:

```js
export const PLATFORMS = {
  claude:   { label: 'Claude',          filename: 'CLAUDE.md',      note: null },
  openai:   { label: 'AGENTS.md',       filename: 'AGENTS.md',      note: null },
  gemini:   { label: 'Gemini',          filename: 'GEMINI.md',      note: null },
  hermes:   { label: 'Hermes/OpenClaw', filename: 'SOUL.md',        note: null },
  cursor:   { label: 'Cursor',          filename: 'agent.mdc',      note: 'Place in .cursor/rules/' },
  windsurf: { label: 'Windsurf',        filename: '.windsurfrules', note: 'Place in project root' },
}
```

The top two lines (`REQUIRED_FRONTMATTER`, `SECTIONS`, `REQUIRED_SECTIONS`) remain unchanged.

- [ ] **Step 2: Verify no import errors**

Run:
```bash
npm run build 2>&1 | head -30
```
Expected: build succeeds (or only pre-existing warnings). The existing `ExportPanel.jsx` only iterates `Object.entries(PLATFORMS)` so the new shape is backward-compatible.

- [ ] **Step 3: Commit**

```bash
git add src/lib/manifest/schema.js
git commit -m "feat: add hermes, cursor, windsurf to PLATFORMS schema"
```

---

## Task 2: Add hermes, cursor, windsurf export logic (TDD)

**Context:** `exporter.js` exports `exportManifest(manifest, platform)`. It uses a `section(title, content)` helper that returns `''` when content is empty. The `hermes` platform remaps section headings. Both `cursor` and `windsurf` put Role content as an opening paragraph (no `##` heading). The test file uses a shared `MANIFEST` fixture.

**Files:**
- Modify: `src/lib/manifest/exporter.test.js`
- Modify: `src/lib/manifest/exporter.js`

- [ ] **Step 1: Add failing tests for hermes**

Append to `src/lib/manifest/exporter.test.js`:

```js
describe('exportManifest — hermes', () => {
  it('uses Identity heading for role', () => {
    expect(exportManifest(MANIFEST, 'hermes')).toContain('## Identity')
  })
  it('contains role content', () => {
    expect(exportManifest(MANIFEST, 'hermes')).toContain('You are a test agent.')
  })
  it('uses Behavioral Boundaries heading for constraints', () => {
    expect(exportManifest(MANIFEST, 'hermes')).toContain('## Behavioral Boundaries')
  })
  it('uses Operational Workflow heading for workflow', () => {
    expect(exportManifest(MANIFEST, 'hermes')).toContain('## Operational Workflow')
  })
  it('does not include Memory section', () => {
    expect(exportManifest(MANIFEST, 'hermes')).not.toContain('Memory')
  })
})

describe('exportManifest — cursor', () => {
  it('starts with YAML frontmatter', () => {
    expect(exportManifest(MANIFEST, 'cursor')).toMatch(/^---\n/)
  })
  it('includes agent name in description field', () => {
    expect(exportManifest(MANIFEST, 'cursor')).toContain('Test Agent')
  })
  it('role content appears without a ## heading on its line', () => {
    const output = exportManifest(MANIFEST, 'cursor')
    const lines = output.split('\n')
    const roleIdx = lines.findIndex(l => l.includes('You are a test agent.'))
    expect(roleIdx).toBeGreaterThan(-1)
    expect(lines[roleIdx]).not.toMatch(/^##/)
  })
  it('contains capabilities section', () => {
    expect(exportManifest(MANIFEST, 'cursor')).toContain('## Capabilities')
  })
  it('contains constraints', () => {
    expect(exportManifest(MANIFEST, 'cursor')).toContain('No side effects')
  })
})

describe('exportManifest — windsurf', () => {
  it('contains generated-by comment', () => {
    expect(exportManifest(MANIFEST, 'windsurf')).toContain('Generated by agentos.md')
  })
  it('role content appears without a ## heading on its line', () => {
    const output = exportManifest(MANIFEST, 'windsurf')
    const lines = output.split('\n')
    const roleIdx = lines.findIndex(l => l.includes('You are a test agent.'))
    expect(roleIdx).toBeGreaterThan(-1)
    expect(lines[roleIdx]).not.toMatch(/^##/)
  })
  it('contains capabilities section', () => {
    expect(exportManifest(MANIFEST, 'windsurf')).toContain('## Capabilities')
  })
  it('contains constraints', () => {
    expect(exportManifest(MANIFEST, 'windsurf')).toContain('No side effects')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test 2>&1 | tail -20
```
Expected: 14 new test failures with `Unknown platform: hermes`, `Unknown platform: cursor`, `Unknown platform: windsurf`.

- [ ] **Step 3: Add the three new branches to exporter.js**

In `src/lib/manifest/exporter.js`, add three new `if` blocks before the final `throw`. The full updated `exportManifest` function (replace it entirely):

```js
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

  if (platform === 'hermes') {
    return (
      HEADER + meta +
      section('Identity', sections.Role) +
      section('Capabilities', sections.Capabilities) +
      section('Behavioral Boundaries', sections.Constraints) +
      section('Tools', sections.Tools) +
      section('Operational Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  if (platform === 'cursor') {
    const { name, description } = frontmatter
    const fmDesc = [name, description].filter(Boolean).join(' — ')
    const fm = `---\ndescription: ${fmDesc}\nglobs: **/*\n---\n\n`
    const roleText = sections.Role ? sections.Role.trim() + '\n\n' : ''
    return (
      fm + roleText +
      section('Capabilities', sections.Capabilities) +
      section('Constraints', sections.Constraints) +
      section('Tools', sections.Tools) +
      section('Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  if (platform === 'windsurf') {
    const roleText = sections.Role ? sections.Role.trim() + '\n\n' : ''
    return (
      HEADER + meta + roleText +
      section('Capabilities', sections.Capabilities) +
      section('Constraints', sections.Constraints) +
      section('Tools', sections.Tools) +
      section('Workflow', sections.Workflow)
    ).trimEnd() + '\n'
  }

  throw new Error(`Unknown platform: ${platform}`)
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npm test 2>&1 | tail -20
```
Expected: all tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/manifest/exporter.js src/lib/manifest/exporter.test.js
git commit -m "feat: add hermes, cursor, windsurf export formats"
```

---

## Task 3: ExportPanel — 2×3 platform card grid

**Context:** `ExportPanel.jsx` currently shows a horizontal row of 3 buttons. The new `PLATFORMS` has 6 entries. Replace the button row with a 2×3 card grid. Each card shows the platform label (bold), filename (monospace accent), and placement note (small, only for cursor/windsurf). The download button and preview `<pre>` block are unchanged.

**Files:**
- Modify: `src/components/studio/ExportPanel.jsx`

- [ ] **Step 1: Replace the file**

Write the full new content of `src/components/studio/ExportPanel.jsx`:

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
            <div style={{
              fontWeight: selected === key ? '600' : '400',
              color: 'var(--text-primary)',
              marginBottom: '0.2rem',
              fontSize: '0.9rem',
            }}>
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
        }}
      >
        Download {PLATFORMS[selected]?.filename}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify in dev server**

```bash
npm run dev
```
Navigate to `http://localhost:5173/studio`, generate any manifest, click "Export" tab. Confirm: 6 cards in a 3-column grid, Cursor card shows "Place in .cursor/rules/", Windsurf shows "Place in project root". Clicking each card updates the preview. Download works.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/ExportPanel.jsx
git commit -m "feat: export panel 2x3 card grid with 6 platforms"
```

---

## Task 4: Studio.jsx — step indicator + Start Over

**Context:** `Studio.jsx` is the page-level component that owns `markdown` state and renders the four panels. Replace the bare tab buttons with a numbered step indicator showing ①②③④, green ✓ for completed steps, accent color for current, muted for unreached. Add a "↺ Start Over" button (top-right, only when markdown is non-empty) that resets state to generate phase. Once `markdown` is non-empty, all steps are clickable.

**Files:**
- Modify: `src/pages/Studio.jsx`

- [ ] **Step 1: Replace the file**

Write the full new content of `src/pages/Studio.jsx`:

```jsx
import React, { useState } from 'react'
import GeneratePanel from '../components/studio/GeneratePanel'
import EditPanel from '../components/studio/EditPanel'
import ValidatePanel from '../components/studio/ValidatePanel'
import ExportPanel from '../components/studio/ExportPanel'

const PHASES = ['generate', 'edit', 'validate', 'export']
const PHASE_LABELS = ['Generate', 'Edit', 'Validate', 'Export']

export default function Studio() {
  const [markdown, setMarkdown] = useState('')
  const [phase, setPhase] = useState('generate')

  const currentIdx = PHASES.indexOf(phase)

  function handleStartOver() {
    setMarkdown('')
    setPhase('generate')
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
                      background: isCurrent
                        ? 'var(--accent)'
                        : isCompleted
                          ? 'var(--success)'
                          : 'var(--bg-tertiary)',
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
                      color: isCurrent
                        ? 'var(--text-primary)'
                        : isCompleted
                          ? 'var(--success)'
                          : 'var(--text-secondary)',
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
            <ExportPanel markdown={markdown} />
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify step indicator behavior**

```bash
npm run dev
```
Go to `http://localhost:5173/studio`. Verify:
- Only "① Generate" is clickable at start (others muted)
- After generating a manifest, step 1 shows green ✓, step 2 is highlighted in accent color
- All 4 steps become clickable once markdown exists
- "↺ Start Over" button appears top-right after generation; clicking it resets to Generate with cleared state

- [ ] **Step 3: Commit**

```bash
git add src/pages/Studio.jsx
git commit -m "feat: studio step indicator with start over button"
```

---

## Task 5: GeneratePanel — example prompt chips

**Context:** `GeneratePanel.jsx` shows a textarea and a Generate button. Add 4 example chips below the textarea. Clicking a chip fills the textarea with that description text (but does NOT auto-submit — user still clicks Generate manually).

**Files:**
- Modify: `src/components/studio/GeneratePanel.jsx`

- [ ] **Step 1: Replace the file**

Write the full new content of `src/components/studio/GeneratePanel.jsx`:

```jsx
import React, { useState } from 'react'

const EXAMPLES = [
  'Code reviewer for GitHub PRs — gives structured feedback on bugs, security, and style',
  'Customer support agent for a SaaS product — handles questions, routes escalations',
  'Data analysis agent that reads CSV files and produces summary reports',
  'API documentation writer — reads source code and writes clear developer docs',
]

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
      if (!data.markdown || !data.markdown.trim()) {
        throw new Error('Generation returned empty result — please try a different description')
      }
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setDescription(ex)}
            style={{
              padding: '0.3rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {ex.split(' — ')[0]}
          </button>
        ))}
      </div>
      {error && <p style={{ color: '#f87171', marginTop: '0.75rem' }}>{error}</p>}
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

Note: chips display the short label (`ex.split(' — ')[0]`) but fill the full description into the textarea.

- [ ] **Step 2: Verify chips work**

```bash
npm run dev
```
Go to `http://localhost:5173/studio`. Verify: 4 chips appear below the textarea, clicking any chip fills the textarea with the full example text.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/GeneratePanel.jsx
git commit -m "feat: add example prompt chips to generate panel"
```

---

## Task 6: EditPanel — collapsible form sidebar

**Context:** `EditPanel.jsx` currently uses a `display: grid; grid-template-columns: 1fr 1fr` layout. Replace it with a flexbox layout where the form sidebar is fixed 300px wide and collapsible via a `⟨`/`⟩` toggle. Monaco fills the remaining space. The `buildMarkdown` function and `handleFormChange` logic are unchanged.

**Files:**
- Modify: `src/components/studio/EditPanel.jsx`

- [ ] **Step 1: Replace the file**

Write the full new content of `src/components/studio/EditPanel.jsx`:

```jsx
import React, { useState, useCallback } from 'react'
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
  const [formOpen, setFormOpen] = useState(true)
  const parsed = parseManifest(markdown)

  const handleFormChange = useCallback(({ frontmatter, sections }) => {
    onChange(buildMarkdown(frontmatter, sections))
  }, [onChange])

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '70vh' }}>
      {formOpen && (
        <div style={{ width: '300px', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Form editor</p>
            <button
              onClick={() => setFormOpen(false)}
              title="Collapse form"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}
            >
              ⟨
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ManifestForm
              frontmatter={parsed.frontmatter}
              sections={parsed.sections}
              onChange={handleFormChange}
            />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Markdown (source of truth)</p>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              title="Expand form"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}
            >
              ⟩
            </button>
          )}
        </div>
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

- [ ] **Step 2: Verify sidebar toggle**

```bash
npm run dev
```
Generate a manifest, go to Edit tab. Verify: form sidebar (300px) is on the left, Monaco fills the rest. Clicking `⟨` collapses the form — Monaco goes full width. Clicking `⟩` brings it back. Form edits still update Monaco and vice versa.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/EditPanel.jsx
git commit -m "feat: collapsible form sidebar in edit panel"
```

---

## Task 7: Home.jsx — full rewrite

**Context:** The current homepage promotes "Agent OS Landscape" (old positioning). Replace entirely with: hero with dual CTA → platform compatibility badge row → 3-step how-it-works cards → manifest code example. Use plain `<a>` tags for navigation (consistent with the rest of the codebase). No CSS file changes — all styling is inline or reuses existing classes (`hero`, `container`, `section`, `card-grid`, `card`, `cta-button`).

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Replace the file**

Write the full new content of `src/pages/Home.jsx`:

```jsx
import React from 'react'

const EXAMPLE_MANIFEST = `---
name: Code Review Agent
version: 1.0.0
description: Reviews PRs and gives actionable feedback
author: your-github-username
tags: [code-review, git]
license: MIT
---

## Role

You are a senior software engineer. Review code changes
and provide constructive, actionable feedback.

## Capabilities

- Analyze code for bugs and security issues
- Suggest improvements following best practices

## Constraints

- Do not modify files unless explicitly asked
- Never approve PRs with security vulnerabilities`

const PLATFORM_BADGES = [
  { name: 'Claude',     file: 'CLAUDE.md' },
  { name: 'Gemini',     file: 'GEMINI.md' },
  { name: 'Hermes',     file: 'SOUL.md' },
  { name: 'OpenClaw',   file: 'SOUL.md' },
  { name: 'Cursor',     file: '.cursor/rules' },
  { name: 'Windsurf',   file: '.windsurfrules' },
  { name: 'AGENTS.md',  file: '10+ tools' },
]

const HOW_IT_WORKS = [
  {
    num: '①',
    title: 'Generate',
    desc: 'Describe your agent in plain language. AI writes the complete manifest draft.',
  },
  {
    num: '②',
    title: 'Edit & Validate',
    desc: 'Refine in the Monaco editor with real-time error checking across all sections.',
  },
  {
    num: '③',
    title: 'Export',
    desc: 'Pick a target platform and download the ready-to-use configuration file.',
  },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Write Once, Run on Any AI Agent</h1>
          <p>
            Agent Manifest Standard — one open format that exports to Claude,
            Gemini, Hermes, OpenClaw, Cursor, Windsurf and more.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/studio" className="cta-button">Open Studio →</a>
            <a
              href="/spec"
              className="cta-button"
              style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            >
              Read the Spec
            </a>
          </div>
        </div>
      </section>

      <main>
        <div className="container">

          {/* Platform compatibility badges */}
          <section className="section" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
              {PLATFORM_BADGES.map(({ name, file }) => (
                <div
                  key={name}
                  style={{
                    padding: '0.35rem 0.875rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{name}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.77rem' }}>{file}</span>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="section">
            <h2>How it works</h2>
            <div className="card-grid">
              {HOW_IT_WORKS.map(({ num, title, desc }) => (
                <div className="card" key={title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{num}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Manifest example */}
          <section className="section">
            <h2>What a Manifest looks like</h2>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
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
                {EXAMPLE_MANIFEST}
              </pre>
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <a href="/studio" style={{ color: 'var(--accent)', fontWeight: '500', textDecoration: 'none' }}>
                  Open in Studio →
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Verify homepage**

```bash
npm run dev
```
Go to `http://localhost:5173/`. Verify:
- Hero shows "Write Once, Run on Any AI Agent" with two CTA buttons
- "Open Studio →" navigates to `/studio`
- "Read the Spec" navigates to `/spec`
- 7 platform badge pills render below the hero
- 3 how-it-works cards display
- Manifest example code block renders with "Open in Studio →" link
- No trace of old "Agent OS Landscape" or "What is Agent OS?" content

- [ ] **Step 3: Run tests to confirm nothing regressed**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: rewrite homepage for agent manifest standard mission"
```

---

## Final verification

- [ ] Run full test suite: `npm test` — all pass
- [ ] Build for production: `npm run build` — no errors
- [ ] Push to remote: `git push origin master` — triggers Cloudflare Pages deploy
