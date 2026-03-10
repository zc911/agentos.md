import React from 'react'

const Home = () => {
  const osProjects = [
    {
      name: 'Nuwax',
      description: '高性能智能体操作系统，支持多模态输入输出，内置完善的插件生态系统。',
      url: 'https://github.com/nuwax/nuwax'
    },
    {
      name: 'LoopForge',
      description: '开源Agent运行时框架，专注于工作流编排和复杂任务调度。',
      url: 'https://github.com/loopforge/loopforge'
    },
    {
      name: 'Squire',
      description: '轻量级智能体操作系统，适合边缘设备和嵌入式场景使用。',
      url: 'https://github.com/squire-os/squire'
    },
    {
      name: 'Ghost',
      description: '专注于隐私保护的Agent OS，所有计算都在本地完成，不上传任何数据。',
      url: 'https://github.com/ghost-os/ghost'
    },
    {
      name: 'OpenClaw Runtime',
      description: 'OpenClaw官方智能体运行时，支持多协议扩展和跨平台部署。',
      url: 'https://openclaw.ai'
    },
    {
      name: 'AgentFlow',
      description: '可视化Agent工作流操作系统，无需代码即可构建复杂智能体应用。',
      url: 'https://github.com/agentflow/agentflow'
    }
  ]

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Agent OS 行业全景图</h1>
          <p>全球领先的智能体操作系统资源聚合平台，汇聚最前沿的Agent技术与项目</p>
          <a href="/navigation" className="cta-button">探索资源导航</a>
        </div>
      </section>

      <main>
        <div className="container">
          <section className="section">
            <h2>主流Agent OS项目</h2>
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
            <h2>什么是Agent OS？</h2>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: '#f8f9fa', padding: '2rem', borderRadius: '12px' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                Agent OS（智能体操作系统）是专门为AI智能体设计的底层软件系统，提供智能体运行所需的核心能力：
              </p>
              <ul style={{ marginLeft: '2rem', marginBottom: '1rem', lineHeight: '2' }}>
                <li>🧠 感知与认知能力：支持多模态输入理解和决策生成</li>
                <li>⚡ 任务调度与执行：高效管理复杂任务队列和工作流</li>
                <li>🔌 插件扩展系统：通过插件扩展智能体的功能边界</li>
                <li>🔒 安全与隐私保护：确保智能体行为可控和数据安全</li>
                <li>🌐 跨平台部署：支持云端、边缘、端侧等多种部署环境</li>
              </ul>
              <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                随着AI智能体技术的快速发展，Agent OS正在成为AI基础设施的核心组成部分，驱动下一代智能应用的开发与落地。
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Home
