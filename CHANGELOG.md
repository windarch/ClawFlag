# Changelog

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
- **真实数据对接**: sessions.list / cron.list / models.list / config.get / chat.history / chat.send 全部对接 Gateway API

### 已知限制
- 需要直连 Gateway（需知道 IP/端口/Token）
- Brain 页面记忆数据仍为 mock
- 成本数据为 token 估算（无真实计费 API）
- 无端到端加密
