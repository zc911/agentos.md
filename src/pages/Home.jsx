import React, { useEffect } from 'react'

const EXAMPLE_MANIFEST = `---
name: Code Review Agent
version: 1.0.0
description: Reviews PRs and gives actionable feedback
author: your-github-username
tags: [code-review, git]
license: MIT
---

## Role

You are a senior software engineer. Review code changes
and provide constructive, actionable feedback.

## Capabilities

- Analyze code for bugs and security issues
- Suggest improvements following best practices

## Constraints

- Do not modify files unless explicitly asked
- Never approve PRs with security vulnerabilities`

const PLATFORM_BADGES = [
  { name: 'Claude',     file: 'CLAUDE.md' },
  { name: 'Gemini',     file: 'GEMINI.md' },
  { name: 'Hermes',     file: 'SOUL.md' },
  { name: 'OpenClaw',   file: 'SOUL.md' },
  { name: 'Cursor',     file: '.cursor/rules' },
  { name: 'Windsurf',   file: '.windsurfrules' },
  { name: 'AGENTS.md',  file: '10+ tools' },
]

const HOW_IT_WORKS = [
  {
    num: '①',
    title: 'Generate',
    desc: 'Describe your agent in plain language. AI writes the complete manifest draft.',
  },
  {
    num: '②',
    title: 'Edit & Validate',
    desc: 'Refine in the Monaco editor with real-time error checking across all sections.',
  },
  {
    num: '③',
    title: 'Export',
    desc: 'Pick a target platform and download the ready-to-use configuration file.',
  },
]

export default function Home() {
  useEffect(() => { document.title = 'agentos.md — Agent Manifest Standard' }, [])
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Write Once, Run on Any AI Agent</h1>
          <p>
            Agent Manifest Standard — one open format that exports to Claude,
            Gemini, Hermes, OpenClaw, Cursor, Windsurf and more.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/studio" className="cta-button">Open Studio →</a>
            <a
              href="/spec"
              className="cta-button"
              style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            >
              Read the Spec
            </a>
          </div>
        </div>
      </section>

      <main>
        <div className="container">

          {/* Platform compatibility badges */}
          <section className="section" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
              {PLATFORM_BADGES.map(({ name, file }) => (
                <div
                  key={name}
                  style={{
                    padding: '0.35rem 0.875rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{name}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.77rem' }}>{file}</span>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="section">
            <h2>How it works</h2>
            <div className="card-grid">
              {HOW_IT_WORKS.map(({ num, title, desc }) => (
                <div className="card" key={title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{num}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Manifest example */}
          <section className="section">
            <h2>What a Manifest looks like</h2>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
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
                {EXAMPLE_MANIFEST}
              </pre>
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <a href="/studio" style={{ color: 'var(--accent)', fontWeight: '500', textDecoration: 'none' }}>
                  Open in Studio →
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
