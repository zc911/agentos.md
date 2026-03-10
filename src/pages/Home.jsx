import React from 'react'

const Home = () => {
  const osProjects = [
    {
      name: 'Nuwax',
      description: 'High-performance agent operating system with multi-modal input/output support and a comprehensive plugin ecosystem.',
      url: 'https://github.com/nuwax/nuwax'
    },
    {
      name: 'LoopForge',
      description: 'Open-source agent runtime framework focused on workflow orchestration and complex task scheduling.',
      url: 'https://github.com/loopforge/loopforge'
    },
    {
      name: 'Squire',
      description: 'Lightweight agent operating system ideal for edge devices and embedded scenarios.',
      url: 'https://github.com/squire-os/squire'
    },
    {
      name: 'Ghost',
      description: 'Privacy-first agent OS with all computation performed locally, no data uploaded to servers.',
      url: 'https://github.com/ghost-os/ghost'
    },
    {
      name: 'OpenClaw Runtime',
      description: 'Official OpenClaw agent runtime with multi-protocol extension and cross-platform deployment support.',
      url: 'https://openclaw.ai'
    },
    {
      name: 'AgentFlow',
      description: 'Visual agent workflow operating system for building complex agent applications without coding.',
      url: 'https://github.com/agentflow/agentflow'
    }
  ]

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Agent OS Landscape</h1>
          <p>The world's leading resource aggregation platform for agent operating systems, featuring cutting-edge agent technologies and projects.</p>
          <a href="/navigation" className="cta-button">Explore Resources</a>
        </div>
      </section>

      <main>
        <div className="container">
          <section className="section">
            <h2>Leading Agent OS Projects</h2>
            <div className="card-grid">
              {osProjects.map((project, index) => (
                <div className="card" key={index}>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    访问项目 →
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>What is Agent OS?</h2>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                An Agent Operating System is a specialized software layer designed specifically for AI agents, providing core capabilities required for agent operation:
              </p>
              <ul style={{ marginLeft: '2rem', marginBottom: '1rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
                <li>🧠 Perception & cognition: Multi-modal input understanding and decision generation</li>
                <li>⚡ Task scheduling & execution: Efficient management of complex task queues and workflows</li>
                <li>🔌 Plugin extension system: Expand agent capabilities through modular plugins</li>
                <li>🔒 Security & privacy: Ensure controllable agent behavior and data protection</li>
                <li>🌐 Cross-platform deployment: Support for cloud, edge, and on-device environments</li>
              </ul>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                As AI agent technology rapidly evolves, Agent OS is becoming a core component of AI infrastructure, powering the next generation of intelligent applications.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Home
