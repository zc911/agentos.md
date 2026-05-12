import { describe, it, expect } from 'vitest'
import { validateManifest } from './validator'

const VALID = {
  frontmatter: { name: 'Test Agent', version: '1.0.0', description: 'A test agent' },
  sections: {
    Role: 'You are a test agent.',
    Capabilities: '- Do testing',
    Constraints: '- No side effects',
    Memory: '',
    Tools: '- bash: read-only',
    Workflow: '1. Do it',
  },
}

describe('errors', () => {
  it('errors when name is missing', () => {
    const m = { ...VALID, frontmatter: { version: '1.0.0', description: 'x' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'name')).toBe(true)
  })

  it('errors when version is missing', () => {
    const m = { ...VALID, frontmatter: { name: 'x', description: 'x' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'version')).toBe(true)
  })

  it('errors when Role section is empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Role: '' } }
    expect(validateManifest(m).some(i => i.level === 'error' && i.field === 'Role')).toBe(true)
  })

  it('returns no errors for a valid manifest', () => {
    expect(validateManifest(VALID).filter(i => i.level === 'error')).toHaveLength(0)
  })
})

describe('warnings', () => {
  it('warns when Tools contains broad permissions', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Tools: '- bash: all' } }
    expect(validateManifest(m).some(i => i.level === 'warning' && i.field === 'Tools')).toBe(true)
  })
})

describe('suggestions', () => {
  it('suggests adding Constraints when empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Constraints: '' } }
    expect(validateManifest(m).some(i => i.level === 'suggestion' && i.field === 'Constraints')).toBe(true)
  })

  it('suggests adding Workflow when empty', () => {
    const m = { ...VALID, sections: { ...VALID.sections, Workflow: '' } }
    expect(validateManifest(m).some(i => i.level === 'suggestion' && i.field === 'Workflow')).toBe(true)
  })
})
