import React from 'react'
import { parseManifest } from '../../lib/manifest/parser'
import { validateManifest } from '../../lib/manifest/validator'

const LEVEL = {
  error:      { color: '#f87171', icon: '✕', label: 'Error' },
  warning:    { color: '#fbbf24', icon: '⚠', label: 'Warning' },
  suggestion: { color: '#60a5fa', icon: '→', label: 'Suggestion' },
}

export default function ValidatePanel({ markdown, onNext }) {
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        {counts.error > 0 && (
          <span style={{ fontSize: '0.85rem', color: '#f87171' }}>
            {counts.error} error{counts.error !== 1 ? 's' : ''} — fix before publishing
          </span>
        )}
        <button
          onClick={onNext}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Proceed to Export →
        </button>
      </div>
    </div>
  )
}
