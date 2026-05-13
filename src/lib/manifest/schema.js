export const REQUIRED_FRONTMATTER = ['name', 'version', 'description']

export const SECTIONS = ['Role', 'Capabilities', 'Constraints', 'Memory', 'Tools', 'Workflow']
export const REQUIRED_SECTIONS = ['Role']

export const PLATFORMS = {
  claude:   { label: 'Claude',          filename: 'CLAUDE.md',      note: null },
  openai:   { label: 'AGENTS.md',       filename: 'AGENTS.md',      note: null },
  gemini:   { label: 'Gemini',          filename: 'GEMINI.md',      note: null },
  hermes:   { label: 'Hermes/OpenClaw', filename: 'SOUL.md',        note: null },
  cursor:   { label: 'Cursor',          filename: 'agent.mdc',      note: 'Place in .cursor/rules/' },
  windsurf: { label: 'Windsurf',        filename: '.windsurfrules', note: 'Place in project root' },
}
