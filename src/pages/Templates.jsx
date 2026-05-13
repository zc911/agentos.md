import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function relativeDate(unixSec) {
  const diff = Math.floor(Date.now() / 1000) - unixSec
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Templates() {
  useEffect(() => { document.title = 'Template Gallery — agentos.md' }, [])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tags') || '')
  const [allTags, setAllTags] = useState([])
  const [templates, setTemplates] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load tag list once
  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(d => setAllTags(d.tags || []))
      .catch(() => {})
  }, [])

  const loadTemplates = useCallback(async (reset = true) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (activeTag) params.set('tags', activeTag)
      if (!reset && nextCursor) params.set('cursor', String(nextCursor))
      const res = await fetch(`/api/templates?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setTemplates(prev => reset ? data.templates : [...prev, ...data.templates])
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [q, activeTag, nextCursor])

  // Reload when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(p => {
        q ? p.set('q', q) : p.delete('q')
        activeTag ? p.set('tags', activeTag) : p.delete('tags')
        return p
      }, { replace: true })
      loadTemplates(true)
    }, q ? 300 : 0)
    return () => clearTimeout(timer)
  }, [q, activeTag]) // eslint-disable-line

  function cardHref(t) {
    return `/templates/${t.id}`
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Template Gallery</h1>

          {/* Search */}
          <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search templates..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <button
                onClick={() => setActiveTag('')}
                style={{
                  padding: '0.3rem 0.75rem',
                  background: !activeTag ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: !activeTag ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    background: activeTag === tag ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: activeTag === tag ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ color: '#f87171', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>
          )}

          {/* Card grid */}
          {templates.length === 0 && !loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
              No templates found. <a href="/studio" style={{ color: 'var(--accent)' }}>Create the first one →</a>
            </p>
          ) : (
            <div className="card-grid">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(cardHref(t))}
                >
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{t.name}</h3>
                  {t.description && (
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      marginBottom: '0.75rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {t.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {(Array.isArray(t.tags) ? t.tags : JSON.parse(t.tags || '[]')).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          color: 'var(--accent)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>{t.username ? `@${t.username}` : 'Anonymous'}</span>
                    <span>{relativeDate(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {nextCursor && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => loadTemplates(false)}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
          {loading && templates.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
          )}
        </section>
      </div>
    </main>
  )
}
