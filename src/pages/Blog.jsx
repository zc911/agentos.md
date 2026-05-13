import React, { useEffect } from 'react'

const Blog = () => {
  useEffect(() => { document.title = 'Blog — agentos.md' }, [])
  const posts = [
    {
      title: '2026 Agent OS Industry Trends Report',
      date: '2026-03-10',
      excerpt: 'An analysis of Agent OS industry trends for 2026 — covering technology roadmaps, market landscape, and investment hotspots to help developers and investors navigate the ecosystem.',
      url: '#'
    },
    {
      title: 'Agent OS Performance Showdown: Nuwax vs LoopForge vs Squire',
      date: '2026-03-05',
      excerpt: 'A comprehensive benchmark of three leading Agent OS platforms across response speed, resource consumption, and extensibility — a practical guide for project selection.',
      url: '#'
    },
    {
      title: "Building Your First Agent App from Scratch: A Developer's Guide",
      date: '2026-02-28',
      excerpt: 'A step-by-step walkthrough for building your first intelligent agent application with Agent OS — complete development flow, code examples, and solutions to common pitfalls.',
      url: '#'
    },
    {
      title: 'Security Challenges in Agent OS and How to Address Them',
      date: '2026-02-20',
      excerpt: 'A deep dive into the security landscape of agent operating systems — prompt injection, runaway behavior, data leakage — with practical technical mitigations for each.',
      url: '#'
    },
    {
      title: 'Multi-Modal Agents: Architecture and Implementation Principles',
      date: '2026-02-15',
      excerpt: 'Breaking down the architecture behind agents that understand text, images, and audio — how core components work and how to optimize them for production.',
      url: '#'
    },
    {
      title: 'Designing a Plugin Ecosystem for Agent OS',
      date: '2026-02-10',
      excerpt: 'The design philosophy and implementation approach behind Agent OS plugin systems — how modular plugins let you expand agent capabilities without limits.',
      url: '#'
    }
  ]

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#333' }}>
            Agent OS Blog
          </h1>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {posts.map((post, index) => (
              <div className="blog-post" key={index}>
                <h3>{post.title}</h3>
                <div className="date">{post.date}</div>
                <p className="excerpt">{post.excerpt}</p>
                <a href={post.url} className="read-more">
                  Read more →
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#f8f9fa', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Write for Us</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              We welcome technical articles on Agent OS, agent tooling, and real-world agent deployments. High-quality submissions are published with attribution.
            </p>
            <a href="mailto:zack.mm.chen@gmail.com" style={{ color: '#667eea', fontWeight: '600' }}>
              Get in touch →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Blog
