# ClawFlag 项目交接文档
> 更新时间：2026-02-21 04:15 GMT+8

---

## 🎯 项目概述

**ClawFlag** = 移动端 AI Agent 指挥中心（针对 OpenClaw 用户）

- **PRD**：`~/clawd/projects/clawflag/PRD.md`
- **GitHub**：https://github.com/windarch/ClawFlag
- **在线预览**：https://claw-flag.vercel.app/
- **本地**：`~/clawd/projects/clawflag`

---

## ✅ 已完成功能（PRD 全覆盖）

### 基础设施
- [x] GitHub + Vercel 自动部署
- [x] Vite + React + TypeScript + PWA
- [x] 深色主题 + PWA 图标 + Manifest

### MVP（第1-2周）
- [x] 四页面路由 + 底部导航
- [x] Gateway WebSocket 连接（心跳/重连/指数退避）
- [x] 概览视图（3秒看状态/开销/待审批）
- [x] 对话功能（ChatBubble + ChatInput + Markdown + 成本标签）
- [x] Gateway 安全检查（版本/暴露/认证/代理）
- [x] 今日成本（趋势箭头 + 昨日对比 + 预算进度条）
- [x] claw-audit CLI 工具

### 增强（第3-4周）
- [x] 成本顾问（2条规则 + 一键应用）
- [x] SOUL.md 查看/编辑（L0-L1 分层）
- [x] 技能列表 + 安全评分
- [x] 会话历史列表
- [x] Agent 统计社交卡片（Web Share API）

### 完善
- [x] 紧急停止按钮（两次确认 + 脉冲动画）
- [x] 通知铃铛（下拉列表 + 未读徽章）
- [x] 危险操作批准模态框（三级风险）
- [x] 上下文压缩警告条 + 一键压缩
- [x] 多步骤进度条（TaskProgress）
- [x] 执行链路透视（ExecutionTrace）
- [x] 错误状态处理 + 版本警告
- [x] 空状态组件

---

## ❌ 需要后端/基础设施（等 Raymond）

- [ ] 真实 Gateway 数据接入（替换 mock）
- [ ] Telegram Bot 推送备用通道
- [ ] ClawRouter 模型路由配置（第2-3个月）
- [ ] 成本异常检测
- [ ] 记忆时间线浏览器
- [ ] OpenRouter API 集成
- [ ] Product Hunt 发布

---

## 📂 组件清单（18个）

| 组件 | 文件 | 功能 |
|------|------|------|
| GlanceView | components/ | 3秒概览 |
| SecurityCheck | components/ | Gateway 安全检查 |
| ChatBubble | components/ | 对话气泡 |
| ChatInput | components/ | 消息输入 |
| CostAdvisor | components/ | 成本顾问 |
| SoulEditor | components/ | SOUL.md 编辑 |
| SkillList | components/ | 技能列表 |
| AgentStatsCard | components/ | 统计卡片 |
| EmergencyStop | components/ | 紧急停止 |
| NotificationBell | components/ | 通知铃铛 |
| ApprovalModal | components/ | 批准模态框 |
| ContextBar | components/ | 上下文压缩 |
| TaskProgress | components/ | 多步进度条 |
| ExecutionTrace | components/ | 执行链路 |
| EmptyState | components/ | 空状态 |
| SessionHistory | components/ | 会话历史 |
| BottomNav | components/ | 底部导航 |
| RequireConnection | components/ | 连接保护 |

## 🔑 Git

```bash
cd ~/clawd/projects/clawflag && git log --oneline
```
