import { SECTIONS } from './schema.js'

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const raw = line.slice(colonIdx + 1).trim()
    if (raw.startsWith('[') && raw.endsWith(']')) {
      result[key] = raw.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
    } else {
      result[key] = raw
    }
  }
  return result
}

function parseBody(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '')
  const sectionMap = Object.fromEntries(SECTIONS.map(name => [name, '']))
  // Split on ## headings that appear at the start of a line (including line 1)
  for (const part of body.split(/(?:^|\n)## /)) {
    const newline = part.indexOf('\n')
    if (newline === -1) continue
    const heading = part.slice(0, newline).trim()
    const content = part.slice(newline + 1).trim()
    if (SECTIONS.includes(heading)) {
      sectionMap[heading] = content
    }
  }
  return sectionMap
}

export function parseManifest(markdown) {
  return {
    frontmatter: parseFrontmatter(markdown),
    sections: parseBody(markdown),
  }
}
