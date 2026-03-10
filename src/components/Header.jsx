import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="logo">Agent OS</Link>
          <ul className="nav-links">
            <li><Link to="/">首页</Link></li>
            <li><Link to="/navigation">资源导航</Link></li>
            <li><Link to="/blog">博客</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
