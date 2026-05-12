import React from 'react'

const Navigation = () => {
  const resources = {
    'Tutorials & Docs': [
      {
        name: 'Getting Started with Agent OS Development',
        description: 'Learn agent OS development from scratch — core concepts and foundational tutorials',
        url: '#'
      },
      {
        name: 'OpenClaw Official Documentation',
        description: 'Official docs for the OpenClaw agent development framework — full API reference and examples',
        url: 'https://docs.openclaw.ai'
      },
      {
        name: 'Agent Workflow Design Best Practices',
        description: 'Lessons learned and best practices for designing intelligent agent workflows',
        url: '#'
      }
    ],
    'Open Source': [
      {
        name: 'Awesome Agent OS',
        description: 'The most comprehensive curated list of Agent OS open-source projects, continuously updated',
        url: 'https://github.com/agentos/awesome-agent-os'
      },
      {
        name: 'Agent SDK Collections',
        description: 'Agent development SDKs for major languages — Python, JavaScript, Go and more',
        url: '#'
      },
      {
        name: 'Agent Benchmark',
        description: 'Agent performance benchmarking toolkit for evaluating different Agent OS implementations',
        url: '#'
      }
    ],
    'Community': [
      {
        name: 'Agent OS Discord Community',
        description: 'The global Agent OS developer community — discuss techniques, share experiences',
        url: 'https://discord.gg/agentos'
      },
      {
        name: 'Agent Developer Forum',
        description: 'Developer community focused on agent technology discussion',
        url: '#'
      },
      {
        name: 'Weekly Agent Tech Newsletter',
        description: 'Subscribe to the latest weekly Agent technology news and industry updates',
        url: '#'
      }
    ],
    'Dev Tools': [
      {
        name: 'Agent Studio',
        description: 'Visual agent development IDE with drag-and-drop workflow design',
        url: '#'
      },
      {
        name: 'Agent Debugger',
        description: 'Agent debugging tool for tracing issues in agent runtime behavior',
        url: '#'
      },
      {
        name: 'Agent Simulator',
        description: 'Agent behavior simulator for testing agent performance in virtual environments',
        url: '#'
      }
    ]
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#333' }}>
            Agent OS Resources
          </h1>

          {Object.entries(resources).map(([category, items], categoryIndex) => (
            <div key={categoryIndex} style={{ marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#667eea', borderBottom: '3px solid #667eea', paddingBottom: '0.5rem' }}>
                {category}
              </h2>
              <ul className="resource-list">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.name}
                    </a>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', borderRadius: '12px', color: 'white', textAlign: 'center', marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Submit a Resource</h3>
            <p style={{ marginBottom: '1rem' }}>Know a great Agent OS resource that should be listed here? Send it our way.</p>
            <a href="mailto:zack.mm.chen@gmail.com" style={{ color: 'white', fontWeight: '600', textDecoration: 'underline' }}>
              Submit a resource →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Navigation
