import React from 'react'

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Agent OS</h3>
            <p>The definitive hub for autonomous agent development</p>
            <p>Curated list of global Agent OS projects and resources</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <p><a href="/">Home</a></p>
            <p><a href="/navigation">Resources</a></p>
            <p><a href="/blog">Blog</a></p>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: <a href="mailto:zack.mm.chen@gmail.com">zack.mm.chen@gmail.com</a></p>
            <p>Twitter: @AgentOS_org</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 AgentOS. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
