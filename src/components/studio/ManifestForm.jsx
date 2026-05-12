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
