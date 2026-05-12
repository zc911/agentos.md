import React, { useState } from 'react'

export default function GeneratePanel({ onGenerated }) {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!description.trim()) return
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      onGenerated(data.markdown)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Describe your agent</h2>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="e.g. An agent that reviews GitHub pull requests and gives structured feedback on code quality, security, and style..."
        rows={5}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ color: '#f87171', marginTop: '0.5rem' }}>{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !description.trim()}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: isLoading || !description.trim() ? 'var(--bg-secondary)' : 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: isLoading || !description.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Generating...' : 'Generate Manifest →'}
      </button>
    </div>
  )
}
