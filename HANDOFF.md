# ClawFlag 项目交接文档
> 生成时间：2026-02-21 02:33 GMT+8
> 用途：/new 后恢复上下文

---

## 🎯 项目概述

**ClawFlag** = 移动端 AI Agent 指挥中心（针对 OpenClaw 用户）

- **PRD 文档**：`~/clawd/projects/clawflag/PRD.md`（完整产品定义，务必阅读）
- **GitHub**：https://github.com/windarch/ClawFlag
- **在线预览**：https://claw-flag.vercel.app/
- **本地目录**：`~/clawd/projects/clawflag`

---

## ✅ 已完成（第0周 + 部分第1周）

### 基础设施
- [x] GitHub 仓库 `windarch/ClawFlag`
- [x] Vercel 自动部署（push 即部署）
- [x] Vite + React + TypeScript + PWA 框架
- [x] 深色主题（#1a1a2e）

### 功能模块
- [x] **路由系统**：四个主页面 Chat/Pulse/Brain/Router + 底部导航栏
- [x] **Gateway 连接模块**：
  - `src/hooks/useGateway.ts` - WebSocket 连接、心跳、重连
  - `src/pages/Connect.tsx` - 连接配置页面
  - `src/types/gateway.ts` - 类型定义
  - `src/contexts/GatewayContext.tsx` - 全局状态
- [x] **概览视图**：
  - `src/components/GlanceView.tsx` - 3秒概览（状态/开销/待审批）
  - `src/pages/Pulse.tsx` - 脉搏页面 + 会话列表 + 安全警告

---

## 🔄 最新完成

### 对话功能 ✅ (刚完成)
- `src/types/chat.ts` - 消息类型定义
- `src/components/ChatBubble.tsx` - 对话气泡（Markdown渲染、成本标签、工具调用卡片）
- `src/components/ChatInput.tsx` - 消息输入框（可伸缩、字符计数）
- `src/pages/Chat.tsx` - 对话页面（含模拟数据）
- commit: `86abf9a`

---

## 📋 待办事项（按 PRD 路线图）

### 第1-2周 MVP（当前阶段）
- [ ] 对话功能（可能已完成，需检查）
- [ ] Gateway 安全检查（版本 + 公网暴露 + 认证状态）
- [ ] 今日成本数字显示
- [ ] `claw-audit` 命令行工具

### 第3-4周 增强
- [ ] 成本顾问基础建议
- [ ] SOUL.md 查看/编辑
- [ ] 技能列表 + 安全评分
- [ ] Telegram Bot 推送备用

### 第2-3个月 增长
- [ ] ClawRouter 模型路由
- [ ] 记忆时间线浏览器
- [ ] Product Hunt 发布

---

## 🔑 关键信息

### Git 状态
```bash
cd ~/clawd/projects/clawflag
git log --oneline -5  # 查看最近提交
git status            # 检查未提交内容
```

### 最近 commits（截至交接时）
- `86abf9a` feat(chat): 实现对话功能组件 ⬅️ 最新
- `c3d47e1` feat(pulse): 添加3秒概览视图组件
- `444329c` feat: 实现 Gateway WebSocket 连接模块
- `4a5d825` 🎉 Initial commit: ClawFlag PWA scaffold

### 构建和测试
```bash
cd ~/clawd/projects/clawflag
npm run build  # 构建
npm run dev    # 本地开发服务器
```

### Vercel 部署
- 每次 push 到 main 自动部署
- 域名：https://claw-flag.vercel.app/
- 后续可绑定 clawflag.com

---

## 📂 项目结构

```
~/clawd/projects/clawflag/
├── src/
│   ├── components/     # GlanceView, BottomNav, ChatBubble(?)
│   ├── pages/          # Chat, Pulse, Brain, Router, Connect
│   ├── hooks/          # useGateway
│   ├── contexts/       # GatewayContext
│   ├── types/          # gateway.ts, chat.ts(?)
│   ├── utils/          # mockData
│   └── styles/         # CSS 变量和全局样式
├── PRD.md              # ⭐ 产品定义文档（重要）
├── README.md           # 项目说明
└── HANDOFF.md          # 本文件
```

---

## 🚀 恢复工作步骤

1. 读取本文件了解上下文
2. 读取 `PRD.md` 了解产品全貌
3. 检查子 agent `clawflag-chat` 状态
4. 运行 `git log` 和 `git status` 确认代码状态
5. 继续按待办事项推进

---

*此文件由龙虾生成，用于 /new 后恢复上下文*
