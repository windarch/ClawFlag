# 🚩 ClawFlag v5

**洞察你的 AI，掌控于指尖。**

移动端 AI Agent 指挥中心 — 通过 E2EE Relay 安全连接 OpenClaw Agent。

## 预览

🔗 [claw-flag.vercel.app](https://claw-flag.vercel.app/)

## V5 新架构

```
┌─────────┐     E2EE      ┌──────────────┐     E2EE      ┌──────────┐
│ ClawFlag │◄────────────►│ Relay Server │◄────────────►│  Agent   │
│   App    │  AES-256-GCM │  (盲管道)     │  AES-256-GCM │(clawflag │
│  (PWA)   │              │              │              │ -agent)  │
└─────────┘               └──────────────┘               └──────────┘
     配对码连接                 零知识转发                  桥接 OpenClaw
```

- **无需暴露 Gateway IP** — 通过 6 位配对码连接
- **端到端加密** — ECDH 密钥交换 + AES-256-GCM
- **盲管道** — Relay Server 只转发加密数据，零知识

## 功能

### 💬 对话 (Chat)
- 实时流式对话 + Markdown 渲染
- 工具调用卡片 + 代码折叠
- 危险操作内联批准按钮
- 上下文压缩警告 + 一键压缩
- 紧急停止浮动按钮
- 单条消息成本标签

### 📊 脉搏 (Pulse)
- **3秒概览**: Agent 状态 / 今日开销 / 待审批
- 任务 DAG 可视化
- Cron 任务管理
- Gateway 安全审计横幅
- Context 使用进度条

### 🧠 大脑 (Brain)
- 记忆浏览器：时间线 + 语义搜索
- SOUL.md 编辑器
- 分层配置编辑器 (L0-L3)
- 技能列表 + 安全评分

### ⚡ 路由 (Router)
- 路由规则编辑器 + Fallback chain
- 成本顾问 + 一键优化
- 三层成本熔断器（警告/降级/熔断）
- 预算管理 + 趋势图

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 路由 | React Router 7 |
| PWA | vite-plugin-pwa |
| 加密 | Web Crypto API (ECDH + AES-256-GCM) |
| 部署 | Vercel + nginx |

## 快速开始

```bash
npm install
npm run dev      # 开发
npm run build    # 构建
npm run preview  # 预览
```

### 连接方式

**V5 (推荐):** 配对码连接
1. 在目标机器安装 `clawflag-agent`
2. App 生成配对码 → Agent 输入配对码
3. 自动建立 E2EE 连接

**V4 (高级):** 直连 Gateway
1. 输入 Gateway 地址和 Token
2. 直接 WebSocket 连接

## 安全

- **E2EE**: 端到端加密，Relay 零知识
- **零云存储**: 所有数据留在本地
- **Ed25519**: 设备认证签名

## License

MIT
