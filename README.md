# 🚩 ClawFlag

**洞察你的 AI，掌控于指尖。**

Mobile-first AI Agent 指挥中心 — 监控、控制和保护你的 OpenClaw Agent。

🌐 **预览：** [claw-flag.vercel.app](https://claw-flag.vercel.app/)

---

## ✨ 功能

### 📊 脉搏 (Pulse)
- **3秒概览视图** — Agent 状态 / 今日开销 / 待审批事项
- **会话列表** — 实时 token 使用和成本追踪
- **定时任务面板** — 启用/禁用/手动触发
- **上下文窗口计量器** — 可视化 token 使用率
- **成本异常检测** — 自动标记异常消耗
- **每周文摘** — 自动生成的周报摘要
- **Agent 统计社交卡片** — 可分享的 "AI Wrapped"
- **Gateway 安全检查** — 版本/暴露/认证/代理/技能

### 💬 对话 (Chat)
- **Markdown 渲染** — 代码高亮 + 可折叠长代码块
- **工具调用详情** — 底部弹出模态框显示参数和结果
- **文件差异卡片** — 内联显示文件操作
- **内联批准按钮** — 危险操作快速审批
- **单条消息成本标签** — token 消耗一目了然
- **上下文压缩警告条** — 一键压缩
- **总结此会话** — 长按输入框触发
- **紧急停止** — 常驻浮动按钮

### 🧠 大脑 (Brain)
- **记忆保真度环** — SVG 环形图可视化健康度
- **记忆时间线** — 按日期排列的记忆条目
- **语义搜索** — 搜索记忆内容
- **配置编辑器 (L0-L3)** — 分层零配置，从概览到原始 Markdown
- **SOUL.md 编辑器** — 查看和编辑 Agent 人格
- **技能列表** — 安全评分 + 详情展开
- **技能护盾** — 权限声明/行为日志/更新差异/IoC 匹配

### ⚡ 路由 (Router)
- **预算卡片** — 日/月预算进度条
- **成本分布图** — 按模型的成本饼图
- **模型路由表** — 任务→模型映射配置
- **熔断器面板** — 模型健康度和失败率
- **成本顾问** — 可操作的优化建议

### 🔗 连接 (Connect)
- **Gateway 连接** — Token 认证 + 版本指纹检测
- **CVE 版本警告** — 自动检测旧版本漏洞
- **故障排除指南** — 按错误类型的分步指导

### 🛡️ claw-audit CLI
```bash
npx claw-audit ws://localhost:18789 --token <token>
```
6 项安全检查：版本 / 网络暴露 / 认证 / 反向代理 / 技能 / 成本异常

---

## 🚀 快速开始

```bash
# 克隆
git clone https://github.com/windarch/ClawFlag.git
cd ClawFlag

# 安装
npm install

# 开发
npm run dev

# 构建
npm run build
```

打开 http://localhost:5173 → 输入 Gateway 地址和 Token → 开始使用。

---

## 🏗️ 技术栈

- **React 18** + TypeScript
- **Vite** + PWA (vite-plugin-pwa)
- **react-router-dom** — 路由
- **react-markdown** — Markdown 渲染
- **SVG 图表** — 零外部依赖的环形图和进度条
- **CSS Variables** — 统一主题系统

---

## 📁 项目结构

```
src/
├── components/          # 28 个 UI 组件
│   ├── ChatBubble       # 消息气泡 (折叠代码/文件差异/内联批准)
│   ├── GlanceView       # 3秒概览
│   ├── SecurityCheck    # 安全检查
│   ├── SkillShield      # 技能护盾
│   ├── WeeklyDigest     # 每周文摘
│   ├── ConfigEditor     # 分层配置编辑器
│   ├── ToolCallModal    # 工具调用详情
│   └── ...
├── pages/               # 5 个页面 (Chat/Pulse/Brain/Router/Connect)
├── hooks/               # Gateway 连接 + 业务数据 hooks
├── contexts/            # Gateway + App 全局状态
├── types/               # TypeScript 类型定义
├── styles/              # 全局样式 + 主题变量
└── utils/               # Mock 数据
packages/
└── claw-audit/          # 独立 CLI 安全扫描工具
```

---

## 📋 路线图

- [x] Gateway 连接 + 版本检测
- [x] 概览视图 + 安全检查
- [x] 基础对话 + Markdown
- [x] 成本顾问 + 预算管理
- [x] 模型路由 + 熔断器
- [x] 记忆浏览器 + 语义搜索
- [x] 技能护盾 + IoC 匹配
- [x] 分层配置编辑器
- [x] 每周文摘
- [x] claw-audit CLI
- [ ] 真实 Gateway WebSocket 集成
- [ ] Telegram Bot 推送备用通道
- [ ] 多 Agent 切换
- [ ] React Native 原生包装

---

## 📜 许可证

MIT

---

> AI 安全需要人类在环。人类在环需要移动便利性。AI 的存在是为了服务于人。
