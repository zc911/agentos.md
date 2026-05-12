# Agent Manifest Standard + Tool Site — Design Spec

**Date:** 2026-05-12
**Status:** Approved
**Author:** zack

---

## Overview

`agentos.md` 定位为 **Agent Manifest 规范的权威主页 + 配套在线工具站**。

核心洞察：`.md` 文件（CLAUDE.md、AGENTS.md、GEMINI.md 等）正在成为 AI agent 的"操作系统层"——用 markdown 指挥 agent 行为。`agentos.md` 的域名天然命中 Agent + OS + Markdown 三重含义，适合承载一套开放的平台无关规范，并提供生成、编辑、验证、发布的全流程工具。

**目标用户：** 开发 AI agent 的工程师，需要为 Claude Code、OpenAI Codex、Gemini 等平台配置 agent 行为的个人开发者和小团队。

**第一阶段目标：** 发布规范 v0.1 + 上线 /studio 工具 + 建立公开模板库。暂不考虑商业化，专注产品质量和用户口碑。

---

## Architecture

产品分三层：

### 层 1：Agent Manifest 规范（The Standard）

开放规范，定义平台无关的 agent 配置格式。以文档形式发布在网站，社区可引用和贡献。规范本身是 SEO 和品牌的核心资产。

### 层 2：agentos.md 官网（The Hub）

现有网站改造为规范主页 + 工具入口，包含：
- 规范文档 + 版本历史
- 平台兼容对照表
- 模板库（/templates）
- Studio 工具入口（/studio）

### 层 3：在线工具（The Tool — /studio）

实现四阶段工作流：Generate → Edit → Validate → Export/Publish

### 技术栈

| 层 | 技术选型 | 说明 |
|---|---|---|
| 前端 | React + Vite + Monaco Editor | 现有技术栈，新增编辑器组件 |
| 后端 | Cloudflare Workers | API 层，调用 LLM，处理认证和 CRUD |
| 数据库 | Cloudflare D1（SQLite） | 存储用户账户和已发布 manifest |
| LLM | 火山引擎豆包 API（OpenAI 兼容） | 已采购订阅，成本可控；API key 存为 Cloudflare Workers Secret |
| 认证 | GitHub OAuth | 开发者用户天然有 GitHub 账号 |
| 验证 | 纯前端 JSON Schema + 自定义规则 | 无需后端，响应即时 |
| 部署 | Cloudflare Pages（前端）+ Workers（后端） | 全在 Cloudflare 生态，成本极低 |

### 数据流

```
用户 GitHub OAuth 登录
    ↓
/studio: 描述 agent → 豆包 API 生成 manifest 草稿
    ↓
编辑（表单 ↔ Monaco Editor 双向同步）
    ↓
前端验证（Error / Warning / Suggestion）
    ↓
导出（下载 .md）or 发布（写入 D1，生成公开 URL）
    ↓
/templates: 社区浏览、使用他人模板
```

---

## Agent Manifest 规范格式（v0.1）

### 完整示例

```markdown
---
name: Code Review Agent
version: 1.0.0
description: Reviews PRs and provides actionable feedback
author: your-github-username
tags: [code-review, git, development]
license: MIT
---

## Role

You are a senior software engineer. Your responsibility is to review
code changes and provide constructive, actionable feedback.

## Capabilities

- Analyze code for bugs, security issues, and performance problems
- Suggest improvements following best practices
- Explain technical concepts clearly

## Constraints

- Do not modify files unless explicitly asked
- Never approve PRs with security vulnerabilities
- Always be constructive, focus on code not the author

## Memory

- Store review patterns in `.agent/memory/`
- Remember recurring issues for consistent feedback

## Tools

- bash: read-only
- git: read-only

## Workflow

1. Read PR description and understand context
2. Review changed files systematically
3. Output: Critical Issues / Suggestions / Praise
```

### 规范要点

- **YAML frontmatter**：存元数据，机器可读；`name`、`version`、`description` 为必填
- **H2 section**：固定 section 名称是规范的一部分；`Role` 为必填，其余为可选
- **纯 markdown**：无需特殊工具即可手写，人类友好
- **版本**：从 v0.1 开始，语义化版本，公开发布后接受社区 PR

### 导出映射

| Manifest Section | CLAUDE.md | AGENTS.md | GEMINI.md |
|---|---|---|---|
| Role | 顶部系统说明 | `system` 字段 | 角色描述 |
| Capabilities | 能力列表 | `tools` | 功能说明 |
| Constraints | 行为规则 | `constraints` | 限制条款 |
| Memory | memory 配置 | 忽略 | 忽略 |
| Tools | `allowed_tools` | `tools` | `tools` |
| Workflow | 工作流说明 | 步骤列表 | 流程说明 |

---

## /studio 工具设计

### 阶段 1：Generate

- 用户用自然语言描述 agent 用途
- 调用火山引擎豆包 API 生成完整 manifest 草稿
- 生成完成后自动进入编辑阶段

### 阶段 2：Edit

双栏布局：
- **右栏（主）**：Monaco Editor 为唯一真相来源，存储完整 markdown 原文
- **左栏（辅）**：结构化表单，解析 Monaco 内容渲染；表单字段修改后写回 Monaco markdown，不存在独立状态

### 阶段 3：Validate

纯前端执行，即时反馈，三级问题分类：
- **Error（红）**：阻断导出，必须修复（如缺少必填 Role section）
- **Warning（黄）**：可忽略继续（如 Tools 权限较宽）
- **Suggestion（蓝）**：优化建议，不影响任何操作

同时输出平台兼容性预检：导出为各平台时哪些字段会丢失。

### 阶段 4：Export & Publish

- **导出**：选择目标平台 → 下载对应 `.md` 文件，无需登录
- **发布**：GitHub 登录 → 填写标签 → 发布到公开模板库
- 发布后生成唯一 URL：`agentos.md/templates/username/agent-name`

---

## /templates 模板库

- 展示所有用户公开发布的 manifest
- 按标签浏览（code-review / data-analysis / customer-support 等）
- 按热度 / 最新排序
- 一键"Use this template"进入 /studio 编辑

---

## 错误处理

| 场景 | 处理方式 |
|---|---|
| 豆包 API 超时/限流 | 友好提示 + 保留用户输入 + 支持重试；Workers 设 30s 超时 |
| 验证 Error | 阻断导出，高亮问题 section |
| 发布同名冲突 | 提示选择：覆盖更新 or 改名新版本 |
| GitHub OAuth 失败 | 降级：生成/编辑/导出不受影响，仅发布需要登录 |

---

## 测试策略

| 层 | 测试内容 | 方式 |
|---|---|---|
| 规范解析 | 各 section 正确提取 | 单元测试（Vitest） |
| 导出转换 | manifest → 各平台格式正确 | 快照测试 |
| 验证规则 | 各 Error/Warning 规则触发 | 单元测试 |
| Workers API | 认证、CRUD、调用豆包 API | 集成测试（Miniflare） |
| E2E | 完整生成→编辑→发布流程 | Playwright |

第一版优先覆盖规范解析和导出转换。

---

## 实现优先级

### Phase 1 — MVP
1. 规范 v0.1 文档页
2. /studio：Generate + Edit + Export（无需登录）
3. 支持导出 CLAUDE.md、AGENTS.md、GEMINI.md

### Phase 2 — 社区
4. GitHub OAuth
5. 发布到模板库（D1 存储）
6. /templates 浏览页

### Phase 3 — 完善
7. 验证规则完善
8. 模板搜索和标签过滤
9. 规范 v0.2（社区反馈迭代）
