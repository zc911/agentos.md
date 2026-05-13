// src/components/studio/ExportPanel.jsx
import React, { useState, useMemo, useEffect } from 'react'
import { parseManifest } from '../../lib/manifest/parser'
import { validateManifest } from '../../lib/manifest/validator'
import { exportManifest } from '../../lib/manifest/exporter'
import { PLATFORMS } from '../../lib/manifest/schema'
import { getUser } from '../../lib/auth.js'

export default function ExportPanel({ markdown, authToken, editingId, authError, onAuthNeeded }) {
  const [selected, setSelected] = useState('claude')
  const manifest = useMemo(() => parseManifest(markdown), [markdown])
  const errors   = useMemo(() => validateManifest(manifest).filter(i => i.level === 'error'), [manifest])
  const hasErrors = errors.length > 0
  const preview  = useMemo(() => hasErrors ? '' : exportManifest(manifest, selected), [manifest, selected, hasErrors])

  // Publish state — pre-fill from frontmatter
  const fm = manifest.frontmatter
  const [pubName, setPubName] = useState(fm.name || '')
  const [pubDesc, setPubDesc] = useState(fm.description || '')
  const [pubTags, setPubTags] = useState(
    Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || '')
  )
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)
  const [publishError, setPublishError] = useState('')

  // Sync publish form fields when markdown changes, respecting deliberate user edits
  useEffect(() => {
    const fm = parseManifest(markdown).frontmatter
    setPubName(prev => prev || fm.name || '')
    setPubDesc(prev => prev || fm.description || '')
    setPubTags(prev => prev || (Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || '')))
  }, [markdown])

  // Decode user from token payload (no verification — just display)
  const tokenUser = getUser(authToken)

  function handleDownload() {
    const blob = new Blob([preview], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = PLATFORMS[selected].filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handlePublish(withAuth) {
    setPublishing(true)
    setPublishError('')
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (withAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`

      const isEdit = withAuth && editingId
      const url = isEdit ? `/api/templates/${editingId}` : '/api/templates'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: pubName,
          description: pubDesc,
          tags: pubTags.split(',').map(t => t.trim()).filter(Boolean),
          markdown,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      setPublishResult({ ...data, wasEdit: !!editingId })
    } catch (err) {
      setPublishError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
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
            <div style={{ fontWeight: selected === key ? '600' : '400', color: 'var(--text-primary)', marginBottom: '0.2rem', fontSize: '0.9rem' }}>
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
          marginBottom: '2.5rem',
        }}
      >
        Download {PLATFORMS[selected]?.filename}
      </button>

      {/* Publish to Gallery */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Publish to Gallery</h3>

        {publishResult ? (
          <div style={{
            padding: '1rem',
            background: 'rgba(63,185,80,0.1)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
          }}>
            <p style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: '600' }}>
              {publishResult.wasEdit ? 'Updated!' : 'Published!'}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {window.location.origin}/templates/{publishResult.id}
            </p>
            <a
              href={`/templates/${publishResult.id}`}
              style={{ color: 'var(--accent)', fontSize: '0.9rem' }}
            >
              View in Gallery →
            </a>
          </div>
        ) : (
          <>
            {authError && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.88rem' }}>{authError}</p>
            )}

            <input
              value={pubName}
              onChange={e => setPubName(e.target.value)}
              placeholder="Agent name"
              style={inputStyle}
            />
            <input
              value={pubDesc}
              onChange={e => setPubDesc(e.target.value)}
              placeholder="Short description"
              style={inputStyle}
            />
            <input
              value={pubTags}
              onChange={e => setPubTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              style={{ ...inputStyle, marginBottom: '1.25rem' }}
            />

            {publishError && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.88rem' }}>{publishError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePublish(false)}
                disabled={publishing || !pubName.trim()}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: publishing || !pubName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {publishing ? 'Publishing...' : 'Publish Anonymously'}
              </button>

              {tokenUser ? (
                <button
                  onClick={() => handlePublish(true)}
                  disabled={publishing || !pubName.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: publishing || !pubName.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {publishing ? 'Publishing...' : (editingId ? `Update as @${tokenUser.login}` : `Publish as @${tokenUser.login}`)}
                </button>
              ) : (
                <button
                  onClick={() => onAuthNeeded(markdown)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Sign in with GitHub →
                </button>
              )}
            </div>

            {!tokenUser && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Anonymous templates cannot be edited after publishing.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
