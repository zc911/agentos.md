import React from 'react'

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Agent OS</h3>
            <p>智能体操作系统权威入口</p>
            <p>汇聚全球Agent OS项目与资源</p>
          </div>
          <div className="footer-section">
            <h3>快速链接</h3>
            <p><a href="/">首页</a></p>
            <p><a href="/navigation">资源导航</a></p>
            <p><a href="/blog">博客</a></p>
          </div>
          <div className="footer-section">
            <h3>联系方式</h3>
            <p>邮箱: <a href="mailto:zack.mm.chen@gmail.com">zack.mm.chen@gmail.com</a></p>
            <p>Twitter: @AgentOS_org</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Agent OS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
