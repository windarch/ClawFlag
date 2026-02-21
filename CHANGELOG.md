# Changelog

## v5.0.0-beta.1 (2026-02-22) — MVGP

V5 架构升级：Relay 盲管道 + E2EE + clawflag-agent + 全面 UI 增强。

### 🏗️ 架构
- **Relay Server**: Node.js 盲管道中继，部署于独立服务器
- **clawflag-agent**: npm 全局包，桥接 OpenClaw ↔ ClawFlag App
- **E2EE**: ECDH 密钥交换 + AES-256-GCM 端到端加密
- **Token 配对**: 6位配对码流程，无需暴露 Gateway IP

### 💬 对话增强 (Batch 3)
- 危险操作内联批准按钮
- 工具调用进度条
- 上下文压缩警告 + 一键压缩
- 对话总结按钮

### 📊 Pulse 增强 (Batch 4)
- 3秒概览仪表盘（Agent 状态/今日开销/待审批）
- 任务 DAG 可视化
- Gateway 安全审计横幅
- Context 使用进度条

### 💰 成本系统 (Batch 5)
- 三层成本熔断器（警告/降级/熔断）
- 成本顾问（可操作优化建议 + 一键应用）
- 实时成本追踪
- 消息级成本标签

### 🔧 Router 增强 (Batch 6)
- 路由规则编辑器
- Fallback chain 配置
- 技能护盾隔离
- 安全审计面板

### 🔒 安全
- 源码零敏感信息
- .env 环境变量隔离
- Ed25519 设备认证

### 已知限制
- Brain 记忆数据部分为 mock
- 成本数据基于 token 估算
- Relay Server 单节点部署

---

## v4.0.0-beta.1 (2026-02-21) — 内测版

首个可用内测版本。直连 Gateway 模式。

### 功能
- **5 个页面**: Connect / Chat / Pulse / Brain / Router
- **Gateway WS v3 协议**: 完整握手、Ed25519 设备认证、心跳保活、自动重连
- **Chat**: 对话界面、流式响应、Markdown 渲染、工具调用卡片、代码折叠
- **Pulse**: 会话列表、Cron 任务管理（启用/禁用/手动运行）、概览仪表盘
- **Brain**: 记忆浏览器、配置编辑器、技能列表
- **Router**: 模型路由表、成本分析、预算管理、熔断器状态
- **PWA**: Service Worker 离线缓存、可安装到主屏幕
- **真实数据对接**: 全部对接 Gateway API

### 已知限制
- 需要直连 Gateway（需知道 IP/端口/Token）
- 无端到端加密
