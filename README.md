# ClawFlag 🚩

**洞察你的 AI，掌控于指尖。**

ClawFlag 是一个移动端 AI Agent 指挥中心，让 OpenClaw 用户能在 **3秒** 内通过移动设备看到 Agent 状态、开销和风险，并在 **30秒** 内完成任何控制操作。

## 🎯 核心理念

- **AI 安全需要"人类在环"** - 最危险的 AI 是无人监管的 AI
- **"人类在环"需要便利性** - 控制面板必须触手可及
- **AI 服务于人** - 人类是委托人，Agent 在边界内行事

## ✨ 核心功能

### 概览视图 (3秒了解全局)
- Agent 状态 / 今日开销 / 待审批事项
- 一句话描述当前任务

### 对话体验
- 超越 Telegram 的富媒体对话
- 工具调用内联卡片
- 单条消息成本标签
- 危险操作内联批准

### 成本控制
- 三层熔断器 (警告/降级/熔断)
- ClawRouter 可视化模型路由
- 成本顾问优化建议

### 安全审计
- Gateway 安全检查
- 技能护盾 (Skill Shield)
- 实时入侵检测

### 记忆智能
- 记忆保真度可视化
- 预压缩摘要
- 语义搜索

## 🛠️ 技术栈

- **框架**: React + TypeScript + Vite
- **PWA**: vite-plugin-pwa
- **路由**: react-router-dom
- **通信**: WebSocket (Gateway WS)
- **存储**: 本地加密缓存

## 📁 项目结构

```
src/
├── components/     # 可复用 UI 组件
├── pages/          # 页面组件
│   ├── Chat/       # 对话页
│   ├── Pulse/      # 脉搏页 (监控仪表盘)
│   ├── Brain/      # 大脑页 (记忆 & 配置)
│   └── Router/     # 路由页 (模型路由)
├── hooks/          # 自定义 React Hooks
├── utils/          # 工具函数
├── styles/         # 全局样式
└── ...
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📱 PWA 支持

ClawFlag 是一个 PWA (Progressive Web App)，支持：
- 添加到主屏幕
- 离线访问
- 推送通知 (通过 Telegram Bot 备用)

## 🗺️ 路线图

### MVP (第1-2周)
- [ ] Gateway 连接
- [ ] 概览视图
- [ ] 基础对话
- [ ] 安全检查

### 增强 (第3-4周)
- [ ] 成本顾问
- [ ] SOUL.md 编辑
- [ ] 技能列表
- [ ] Telegram Bot 推送

### 增长 (第2-3个月)
- [ ] ClawRouter 配置
- [ ] 记忆浏览器
- [ ] OpenRouter 集成

## 📄 License

MIT

---

> *AI 安全需要人类在环。人类在环需要移动便利性。AI 的存在是为了服务于人。*
