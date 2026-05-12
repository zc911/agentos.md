import { REQUIRED_FRONTMATTER, REQUIRED_SECTIONS } from './schema.js'

export function validateManifest(manifest) {
  const issues = []
  const { frontmatter, sections } = manifest

  for (const field of REQUIRED_FRONTMATTER) {
    if (!frontmatter[field] || !String(frontmatter[field]).trim()) {
      issues.push({ level: 'error', field, message: `"${field}" is required in frontmatter` })
    }
  }

  for (const name of REQUIRED_SECTIONS) {
    if (!sections[name] || !sections[name].trim()) {
      issues.push({ level: 'error', field: name, message: `"${name}" section is required` })
    }
  }

  if (sections.Tools && /:\s*(all|write|\*)/i.test(sections.Tools)) {
    issues.push({
      level: 'warning',
      field: 'Tools',
      message: 'Broad tool permissions detected — consider restricting to read-only',
    })
  }

  if (!sections.Constraints || !sections.Constraints.trim()) {
    issues.push({
      level: 'suggestion',
      field: 'Constraints',
      message: 'Adding a Constraints section improves agent safety and predictability',
    })
  }

  if (!sections.Workflow || !sections.Workflow.trim()) {
    issues.push({
      level: 'suggestion',
      field: 'Workflow',
      message: 'A Workflow section helps the agent follow a consistent process',
    })
  }

  return issues
}
