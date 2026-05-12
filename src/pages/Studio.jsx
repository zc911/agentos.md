import React, { useState } from 'react'
import GeneratePanel from '../components/studio/GeneratePanel'

const PHASES = ['generate', 'edit', 'validate', 'export']

export default function Studio() {
  const [markdown, setMarkdown] = useState('')
  const [phase, setPhase] = useState('generate')

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Agent Manifest Studio</h1>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            {PHASES.map(p => (
              <button
                key={p}
                onClick={() => (markdown || p === 'generate') && setPhase(p)}
                style={{
                  background: phase === p ? 'var(--accent)' : 'transparent',
                  color: phase === p ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.25rem',
                  cursor: markdown || p === 'generate' ? 'pointer' : 'not-allowed',
                  textTransform: 'capitalize',
                  fontWeight: phase === p ? '600' : '400',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {phase === 'generate' && (
            <GeneratePanel onGenerated={md => { setMarkdown(md); setPhase('edit') }} />
          )}

          {phase === 'edit' && (
            <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
              {markdown}
            </pre>
          )}
        </section>
      </div>
    </main>
  )
}
