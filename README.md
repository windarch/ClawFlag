# 🚩 ClawFlag

**洞察你的 AI，掌控于指尖。**

移动端 AI Agent 指挥中心 — OpenClaw Gateway 的移动控制面板。

## 预览

🔗 [claw-flag.vercel.app](https://claw-flag.vercel.app/)

## 功能

### 💬 对话 (Chat)
- 与 AI Agent 实时对话，支持流式响应
- 工具调用内联卡片 + 详情模态框
- 折叠长代码块、文件差异高亮
- 单条消息成本标签
- 内联危险操作批准按钮
- 上下文压缩警告 + 一键压缩
- 紧急停止浮动按钮

### 📊 脉搏 (Pulse)
- **3秒概览**: Agent 状态 / 今日开销 / 待审批
- 会话列表 + context 使用进度条
- Cron 定时任务管理（启用/禁用/手动触发）
- Gateway 安全审计（版本/认证/网络暴露/TLS）
- Agent 统计社交卡片 (Web Share API)

### 🧠 大脑 (Brain)
- 记忆浏览器：时间线 + 语义搜索 + 保真度环
- SOUL.md 查看/编辑器
- 分层配置编辑器 (L0-L3)
- 技能列表 + 安全评分

### ⚡ 路由 (Router)
- 模型路由表 + 备用链
- 成本顾问（可操作的优化建议 + 一键应用）
- 成本分布图 + 24小时趋势
- 三层成本熔断器（警告/降级/熔断）
- 预算设置 + 进度条

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 路由 | React Router 7 |
| PWA | vite-plugin-pwa |
| 样式 | CSS Variables + 暗色主题 |
| 协议 | OpenClaw Gateway WebSocket Protocol v3 |
| 部署 | Vercel (自动) |

## 架构

```
src/
├── services/gatewayClient.ts   # Gateway WS 协议 v3 客户端
├── contexts/
│   ├── GatewayContext.tsx       # 连接状态管理
│   └── AppContext.tsx           # 全局状态（通知/审批）
├── hooks/useGatewayData.ts     # 业务数据 hooks（真实API + mock fallback）
├── pages/                      # 5个页面
│   ├── Connect.tsx             # Gateway 连接配置
│   ├── Chat.tsx                # 对话界面
│   ├── Pulse.tsx               # 概览与监控
│   ├── Brain.tsx               # 记忆与配置
│   └── Router.tsx              # 模型路由与成本
├── components/                 # 30+ 组件
└── styles/                     # 全局样式 + CSS 变量
```

## 快速开始

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 连接 Gateway

1. 启动 OpenClaw Gateway: `openclaw gateway`
2. 打开 ClawFlag (本地或 Vercel)
3. 输入 Gateway 地址和 Token
4. 开始使用

## 数据安全

- **零云存储**: 所有数据留在你的 Gateway，ClawFlag 不存储任何用户数据
- **本地缓存**: 连接配置存储在浏览器 localStorage
- **协议安全**: 支持 WSS (TLS) + Token 认证

## 开发状态

- ✅ Phase 1-3: 前端 UI (30+ 组件, 5 页面)
- ✅ Phase 4: Gateway WS 协议 v3 集成
- ✅ 移动端 UX + PWA
- 🔄 E2E 测试 (真实 Gateway 连接验证)

## License

MIT
