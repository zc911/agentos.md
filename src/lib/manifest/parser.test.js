import { describe, it, expect } from 'vitest'
import { parseManifest } from './parser'

const SAMPLE = `---
name: Test Agent
version: 1.0.0
description: A test agent
author: testuser
tags: [testing, vitest]
license: MIT
---

## Role

You are a test agent.

## Capabilities

- Do testing
- Assert results

## Constraints

- No side effects

## Tools

- bash: read-only
`

describe('parseManifest', () => {
  it('parses string frontmatter fields', () => {
    const result = parseManifest(SAMPLE)
    expect(result.frontmatter.name).toBe('Test Agent')
    expect(result.frontmatter.version).toBe('1.0.0')
    expect(result.frontmatter.description).toBe('A test agent')
    expect(result.frontmatter.author).toBe('testuser')
    expect(result.frontmatter.license).toBe('MIT')
  })

  it('parses tags as array', () => {
    const result = parseManifest(SAMPLE)
    expect(result.frontmatter.tags).toEqual(['testing', 'vitest'])
  })

  it('parses Role section content', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Role).toContain('You are a test agent.')
  })

  it('parses Capabilities section content', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Capabilities).toContain('Do testing')
  })

  it('returns empty string for missing sections', () => {
    const result = parseManifest(SAMPLE)
    expect(result.sections.Memory).toBe('')
    expect(result.sections.Workflow).toBe('')
  })

  it('returns empty object when no frontmatter present', () => {
    const result = parseManifest('## Role\n\nYou are an agent.')
    expect(result.frontmatter).toEqual({})
    expect(result.sections.Role).toContain('You are an agent.')
  })
})
