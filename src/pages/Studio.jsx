// src/pages/Studio.jsx
import React, { useState, useEffect } from 'react'
import GeneratePanel from '../components/studio/GeneratePanel'
import EditPanel from '../components/studio/EditPanel'
import ValidatePanel from '../components/studio/ValidatePanel'
import ExportPanel from '../components/studio/ExportPanel'
import { getToken, setToken } from '../lib/auth.js'

const PHASES = ['generate', 'edit', 'validate', 'export']
const PHASE_LABELS = ['Generate', 'Edit', 'Validate', 'Export']

export default function Studio() {
  // Lazy init: restore from sessionStorage before first render
  const [markdown, setMarkdown] = useState(() => {
    return sessionStorage.getItem('studio_import') ||
           sessionStorage.getItem('studio_pre_auth_markdown') || ''
  })
  const [phase, setPhase] = useState(() => {
    if (sessionStorage.getItem('studio_import')) return 'edit'
    return sessionStorage.getItem('studio_pre_auth_phase') || 'generate'
  })
  const [editingId, setEditingId] = useState(() => {
    return sessionStorage.getItem('studio_editing_id') ||
           sessionStorage.getItem('studio_pre_auth_editing_id') || null
  })
  const [authToken, setAuthToken] = useState(() => getToken())
  const [authError, setAuthError] = useState('')

  const currentIdx = PHASES.indexOf(phase)

  useEffect(() => {
    document.title = 'Agent Manifest Studio — agentos.md'

    // Clean up sessionStorage after reading
    sessionStorage.removeItem('studio_import')
    sessionStorage.removeItem('studio_editing_id')
    sessionStorage.removeItem('studio_pre_auth_markdown')
    sessionStorage.removeItem('studio_pre_auth_phase')
    sessionStorage.removeItem('studio_pre_auth_editing_id')

    // Handle OAuth return via URL token (delivered via fragment to avoid server logs)
    const hash = window.location.hash.slice(1)
    const hashParams = new URLSearchParams(hash)
    const params = new URLSearchParams(window.location.search)
    const token = hashParams.get('token')
    const authErr = params.get('auth_error')

    if (token) {
      setToken(token)
      setAuthToken(token)
      hashParams.delete('token')
      const cleanHash = hashParams.toString() ? '#' + hashParams.toString() : ''
      const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + cleanHash
      window.history.replaceState({}, '', clean)
    }

    if (authErr) {
      setAuthError('GitHub sign-in failed. Please try again.')
      params.delete('auth_error')
      const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
      window.history.replaceState({}, '', clean)
    }
  }, [])

  function handleStartOver() {
    setMarkdown('')
    setPhase('generate')
    setEditingId(null)
  }

  function handleAuthNeeded(currentMarkdown) {
    sessionStorage.setItem('studio_pre_auth_markdown', currentMarkdown)
    sessionStorage.setItem('studio_pre_auth_phase', 'export')
    if (editingId) sessionStorage.setItem('studio_pre_auth_editing_id', editingId)
    window.location.href = '/api/auth/github'
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
                      background: isCurrent ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--bg-tertiary)',
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
                      color: isCurrent ? 'var(--text-primary)' : isCompleted ? 'var(--success)' : 'var(--text-secondary)',
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
            <EditPanel markdown={markdown} onChange={setMarkdown} onNext={() => setPhase('validate')} />
          )}
          {phase === 'validate' && (
            <ValidatePanel markdown={markdown} onNext={() => setPhase('export')} />
          )}
          {phase === 'export' && (
            <ExportPanel
              markdown={markdown}
              authToken={authToken}
              editingId={editingId}
              authError={authError}
              onAuthNeeded={handleAuthNeeded}
            />
          )}
        </section>
      </div>
    </main>
  )
}
