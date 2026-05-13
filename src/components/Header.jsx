import React from 'react'
import { Link } from 'react-router-dom'

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#0d1117"/>
    <path d="M6 11.5 L13 16 L6 20.5" stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="15.5" y1="20.5" x2="26" y2="20.5" stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const Header = () => {
  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="logo">
            <LogoIcon />
            <span>agentos<span style={{ color: 'var(--accent)' }}>.md</span></span>
          </Link>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/spec">Spec</Link></li>
            <li><Link to="/studio">Studio</Link></li>
            <li><Link to="/templates">Templates</Link></li>
            <li><Link to="/navigation">Resources</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
