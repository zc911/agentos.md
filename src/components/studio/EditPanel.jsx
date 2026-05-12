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
