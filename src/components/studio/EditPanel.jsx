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

export default function EditPanel({ markdown, onChange, onNext }) {
  const [formOpen, setFormOpen] = useState(true)
  const parsed = parseManifest(markdown)

  const handleFormChange = useCallback(({ frontmatter, sections }) => {
    onChange(buildMarkdown(frontmatter, sections))
  }, [onChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
      <button
        onClick={onNext}
        disabled={!markdown.trim()}
        style={{
          padding: '0.75rem 2rem',
          background: markdown.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: markdown.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        Next: Validate →
      </button>
    </div>
    </div>
  )
}
