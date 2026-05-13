import React, { useEffect } from 'react'

const EXAMPLE = `---
name: Code Review Agent
version: 1.0.0
description: Reviews PRs and provides actionable feedback
author: your-github-username
tags: [code-review, git, development]
license: MIT
---

## Role

You are a senior software engineer. Your responsibility is to review
code changes and provide constructive, actionable feedback.

## Capabilities

- Analyze code for bugs, security issues, and performance problems
- Suggest improvements following best practices
- Explain technical concepts clearly

## Constraints

- Do not modify files unless explicitly asked
- Never approve PRs with security vulnerabilities
- Always be constructive, focus on code not the author

## Memory

- Store review patterns in \`.agent/memory/\`
- Remember recurring issues for consistent feedback

## Tools

- bash: read-only
- git: read-only

## Workflow

1. Read PR description and understand context
2. Review changed files systematically
3. Output: Critical Issues / Suggestions / Praise`

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }
const thStyle = { textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }

export default function Spec() {
  useEffect(() => { document.title = 'Agent Manifest Spec v0.1 — agentos.md' }, [])
  return (
    <main>
      <div className="container">
        <section className="section" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Agent Manifest</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
            Open specification v0.1 — A platform-agnostic format for AI agent configuration
          </p>

          <h2>Overview</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '2rem' }}>
            An Agent Manifest is a structured markdown file that fully describes an AI agent's role,
            capabilities, constraints, and workflow. It is platform-agnostic and can be exported to{' '}
            <code>CLAUDE.md</code>, <code>AGENTS.md</code>, <code>GEMINI.md</code>, and other formats.
          </p>

          <h2>Example</h2>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1.5rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
          }}>
            {EXAMPLE}
          </pre>

          <h2>Frontmatter Fields</h2>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Field</th><th style={thStyle}>Required</th><th style={thStyle}>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['name', true, 'Human-readable name for the agent'],
                ['version', true, 'Semantic version (e.g. 1.0.0)'],
                ['description', true, 'One-line summary of what the agent does'],
                ['author', false, 'GitHub username or display name'],
                ['tags', false, 'Array of keywords for discovery'],
                ['license', false, 'SPDX license identifier (e.g. MIT)'],
              ].map(([field, req, desc]) => (
                <tr key={field}>
                  <td style={tdStyle}><code>{field}</code></td>
                  <td style={{ ...tdStyle, color: req ? '#f87171' : 'var(--text-secondary)' }}>{req ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Sections</h2>
          <table style={tableStyle}>
            <thead>
              <tr><th style={thStyle}>Section</th><th style={thStyle}>Required</th><th style={thStyle}>Purpose</th></tr>
            </thead>
            <tbody>
              {[
                ['Role', true, "Defines the agent's persona and primary responsibility"],
                ['Capabilities', false, 'Lists what the agent can do'],
                ['Constraints', false, 'Defines safety rules and behavioral boundaries'],
                ['Memory', false, 'Describes how the agent stores and retrieves context'],
                ['Tools', false, 'Lists tools and their permission levels'],
                ['Workflow', false, 'Step-by-step process the agent follows'],
              ].map(([name, req, purpose]) => (
                <tr key={name}>
                  <td style={tdStyle}><code>{'## ' + name}</code></td>
                  <td style={{ ...tdStyle, color: req ? '#f87171' : 'var(--text-secondary)' }}>{req ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Platform Export Map</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Section</th>
                <th style={thStyle}>CLAUDE.md</th>
                <th style={thStyle}>AGENTS.md</th>
                <th style={thStyle}>GEMINI.md</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Role', 'Role', 'System Instructions', 'Role'],
                ['Capabilities', 'Capabilities', 'Capabilities', 'Capabilities'],
                ['Constraints', 'Constraints', 'Constraints', 'Constraints'],
                ['Memory', 'Memory Configuration', '(omitted)', '(omitted)'],
                ['Tools', 'Allowed Tools', 'Tools', 'Tools'],
                ['Workflow', 'Workflow', 'Workflow', 'Workflow'],
              ].map(([s, c, o, g]) => (
                <tr key={s}>
                  <td style={tdStyle}><code>{s}</code></td>
                  <td style={tdStyle}>{c}</td>
                  <td style={tdStyle}>{o}</td>
                  <td style={tdStyle}>{g}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <a
              href="/studio"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Try the Studio →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
