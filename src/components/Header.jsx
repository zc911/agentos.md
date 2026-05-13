import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="logo">Agent OS</Link>
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
