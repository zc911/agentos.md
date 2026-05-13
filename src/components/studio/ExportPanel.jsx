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
