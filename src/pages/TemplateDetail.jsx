// src/pages/TemplateDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUser, getToken } from '../lib/auth.js'

function relativeDate(unixSec) {
  const diff = Math.floor(Date.now() / 1000) - unixSec
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TemplateDetail() {
  const { id, username, slug } = useParams()
  const navigate = useNavigate()
  const templateId = username ? `${username}/${slug}` : id

  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentUser = getUser()
  const isOwner = currentUser && template && template.user_id === currentUser.sub

  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTemplate(data)
        document.title = `${data.name} — agentos.md`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [templateId])

  function handleCopy() {
    navigator.clipboard.writeText(template.markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    const blob = new Blob([template.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleOpenInStudio() {
    sessionStorage.setItem('studio_import', template.markdown)
    navigate('/studio')
  }

  function handleEdit() {
    sessionStorage.setItem('studio_import', template.markdown)
    sessionStorage.setItem('studio_editing_id', template.id)
    navigate('/studio')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Delete failed')
      }
      navigate('/templates')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return (
    <main><div className="container"><section className="section">
      <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </section></div></main>
  )

  if (error) return (
    <main><div className="container"><section className="section">
      <p style={{ color: '#f87171' }}>{error}</p>
      <Link to="/templates" style={{ color: 'var(--accent)' }}>← Back to Gallery</Link>
    </section></div></main>
  )

  const tags = Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]')

  return (
    <main>
      <div className="container">
        <section className="section" style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <Link to="/templates" style={{ color: 'var(--accent)' }}>Templates</Link>
            {' → '}
            <span>{template.name}</span>
          </div>

          {/* Header */}
          <h1 style={{ marginBottom: '0.5rem' }}>{template.name}</h1>
          {template.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.05rem' }}>
              {template.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {template.username
                ? <a href={`https://github.com/${template.username}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>@{template.username}</a>
                : 'Anonymous'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{relativeDate(template.created_at)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{template.downloads} views</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.2rem 0.6rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Markdown'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Download
            </button>
            <button
              onClick={handleOpenInStudio}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Open in Studio →
            </button>
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Edit
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#f87171' }}>Delete? This cannot be undone.</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: '#f87171',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Manifest */}
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
            {template.markdown}
          </pre>
        </section>
      </div>
    </main>
  )
}
