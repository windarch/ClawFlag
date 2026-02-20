# 🚩 ClawFlag

**洞察你的 AI，掌控于指尖。**

移动端 AI Agent 指挥中心 — 为 [OpenClaw](https://github.com/openclaw/openclaw) 用户打造。

[![Deploy](https://img.shields.io/badge/demo-live-brightgreen)](https://claw-flag.vercel.app/)
[![GitHub](https://img.shields.io/github/stars/windarch/ClawFlag?style=social)](https://github.com/windarch/ClawFlag)

## 🎯 核心功能

- **3秒概览** — Agent 状态、今日开销、待审批事项，一目了然
- **Gateway 安全检查** — 版本漏洞、网络暴露、认证状态自动检测
- **对话交互** — 与 Agent 对话，Markdown 渲染，工具调用卡片
- **成本顾问** — 智能优化建议，一键节省开销
- **技能管理** — 已安装技能列表，安全评分
- **SOUL.md 编辑** — 分层配置，L0 概览到 L1 编辑
- **紧急停止** — 两次确认，一键拉闸
- **统计卡片** — 可分享的 Agent 周报卡片

## 🛡️ 安全

- **零云存储** — 所有数据留在你的 Gateway 上
- **零中继** — App 直连 Gateway，不经过第三方
- **安全审计** — 内置 CVE 检查 + 独立 CLI 工具

## 🚀 快速开始

### 在线体验
打开 [claw-flag.vercel.app](https://claw-flag.vercel.app/) → 输入 Gateway 地址 → 粘贴 Token → 完成

### 本地开发
```bash
git clone https://github.com/windarch/ClawFlag.git
cd ClawFlag
npm install
npm run dev
```

### 安全审计 CLI
```bash
npx claw-audit ws://localhost:18789 --token YOUR_TOKEN
```

## 🏗️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React + TypeScript + Vite |
| PWA | vite-plugin-pwa + Workbox |
| 通信 | WebSocket |
| 部署 | Vercel |
| 主题 | 深色 (#1a1a2e) |

## 📂 项目结构

```
src/
├── components/    # UI 组件 (GlanceView, SecurityCheck, CostAdvisor...)
├── pages/         # 页面 (Chat, Pulse, Brain, Router, Connect)
├── hooks/         # Gateway WebSocket hook
├── contexts/      # 全局状态
├── types/         # TypeScript 类型
└── styles/        # 全局样式
packages/
└── claw-audit/    # 独立安全审计 CLI
```

## 📋 路线图

- [x] PWA 框架 + 四页面路由
- [x] Gateway WebSocket 连接
- [x] 3秒概览 + 安全检查
- [x] 对话功能 + 成本顾问
- [x] 技能列表 + SOUL 编辑
- [ ] 真实 Gateway 数据接入
- [ ] ClawRouter 模型路由
- [ ] 记忆时间线浏览器
- [ ] Telegram Bot 推送
- [ ] Product Hunt 发布

## 📄 许可证

MIT

---

> AI 安全需要人类在环。人类在环需要移动便利性。
