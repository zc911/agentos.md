import React from 'react'

const Navigation = () => {
  const resources = {
    教程文档: [
      {
        name: 'Agent OS 开发入门指南',
        description: '从零开始学习智能体操作系统开发，包含核心概念和基础教程',
        url: '#'
      },
      {
        name: 'OpenClaw 官方文档',
        description: 'OpenClaw智能体开发框架官方文档，最全的API参考和示例',
        url: 'https://docs.openclaw.ai'
      },
      {
        name: 'Agent 工作流设计最佳实践',
        description: '智能体工作流设计的经验总结和最佳实践指南',
        url: '#'
      }
    ],
    开源项目: [
      {
        name: 'Awesome Agent OS',
        description: '最全的Agent OS相关开源项目汇总，持续更新中',
        url: 'https://github.com/agentos/awesome-agent-os'
      },
      {
        name: 'Agent SDK Collections',
        description: '主流编程语言的Agent开发SDK集合，支持Python、JavaScript、Go等',
        url: '#'
      },
      {
        name: 'Agent Benchmark',
        description: '智能体性能基准测试工具集，帮助评估不同Agent OS的性能',
        url: '#'
      }
    ],
    社区资源: [
      {
        name: 'Agent OS Discord 社区',
        description: '全球最大的Agent OS开发者社区，交流技术、分享经验',
        url: 'https://discord.gg/agentos'
      },
      {
        name: 'Agent 开发者论坛',
        description: '中文Agent开发者社区，专注于智能体技术交流',
        url: '#'
      },
      {
        name: '每周Agent技术周报',
        description: '订阅每周最新的Agent技术动态和行业资讯',
        url: '#'
      }
    ],
    开发工具: [
      {
        name: 'Agent Studio',
        description: '可视化Agent开发IDE，支持拖拽式工作流设计',
        url: '#'
      },
      {
        name: 'Agent Debugger',
        description: '智能体调试工具，帮助定位Agent运行时问题',
        url: '#'
      },
      {
        name: 'Agent Simulator',
        description: '智能体行为模拟器，在虚拟环境中测试Agent性能',
        url: '#'
      }
    ]
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#333' }}>
            Agent OS 资源导航
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
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>资源收录申请</h3>
            <p style={{ marginBottom: '1rem' }}>如果您有优质的Agent OS相关资源希望被收录，欢迎联系我们提交申请。</p>
            <a href="mailto:zack.mm.chen@gmail.com" style={{ color: 'white', fontWeight: '600', textDecoration: 'underline' }}>
              点击提交资源 →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Navigation
