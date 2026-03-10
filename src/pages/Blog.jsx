import React from 'react'

const Blog = () => {
  const posts = [
    {
      title: '2026年Agent OS行业发展趋势报告',
      date: '2026-03-10',
      excerpt: '分析2026年智能体操作系统行业的发展趋势，包括技术路线、市场格局、投资热点等核心内容，帮助开发者和投资者把握行业脉搏。',
      url: '#'
    },
    {
      title: '主流Agent OS性能对比评测：Nuwax vs LoopForge vs Squire',
      date: '2026-03-05',
      excerpt: '对当前主流的三款Agent OS进行全面的性能测试和对比，从响应速度、资源消耗、扩展性等多个维度进行评测，为项目选型提供参考。',
      url: '#'
    },
    {
      title: '从0到1搭建第一个Agent应用：开发实践指南',
      date: '2026-02-28',
      excerpt: '详细介绍如何使用Agent OS快速开发第一个智能体应用，包含完整的开发流程、代码示例和常见问题解决方案。',
      url: '#'
    },
    {
      title: 'Agent OS的安全挑战与解决方案',
      date: '2026-02-20',
      excerpt: '深入探讨智能体操作系统面临的安全挑战，包括 prompt 注入、行为失控、数据泄露等问题，并提供相应的技术解决方案。',
      url: '#'
    },
    {
      title: '多模态Agent的技术架构与实现原理',
      date: '2026-02-15',
      excerpt: '解析支持文本、图像、音频等多模态输入的Agent技术架构，介绍核心组件的实现原理和优化方案。',
      url: '#'
    },
    {
      title: 'Agent OS插件生态系统设计思路',
      date: '2026-02-10',
      excerpt: '分享Agent OS插件系统的设计理念和实现方案，如何通过插件机制无限扩展智能体的功能边界。',
      url: '#'
    }
  ]

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#333' }}>
            Agent OS 技术博客
          </h1>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {posts.map((post, index) => (
              <div className="blog-post" key={index}>
                <h3>{post.title}</h3>
                <div className="date">{post.date}</div>
                <p className="excerpt">{post.excerpt}</p>
                <a href={post.url} className="read-more">
                  阅读全文 →
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#f8f9fa', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem' }}>投稿指南</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              欢迎开发者投稿分享Agent OS相关的技术文章、实践经验和项目案例，稿件一经采用将获得丰厚稿酬。
            </p>
            <a href="mailto:zack.mm.chen@gmail.com" style={{ color: '#667eea', fontWeight: '600' }}>
              查看投稿详情 →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Blog
