# ClawFlag V5 开发路线图

> 基于 PRD-v5.0.pdf，拆解为可执行的开发任务

## Phase 0: 核心验证 ✅

### 0.1 Relay Server (Node.js) ✅
- [x] WebSocket 服务器框架
- [x] Token 生成与配对流程
- [x] ECDH 密钥交换（通过 Token 首次配对）
- [x] E2EE 消息转发（AES-256-GCM）
- [x] 盲管道原则：服务器只转发加密数据
- [x] 部署到铁锤服务器

### 0.2 clawflag-agent (npm 全局包) ✅
- [x] 项目初始化 (TypeScript + Node.js)
- [x] --token 参数配对流程
- [x] WebSocket 连接 Relay Server
- [x] ECDH 密钥协商
- [x] 监听 OpenClaw 结构化日志
- [x] 接收并执行加密指令
- [ ] npm publish (待发布)

### 0.3 App 架构重构 ✅
- [x] 从直连 Gateway → 通过 Relay 连接
- [x] Token 生成 UI（"+"按钮创建 Bot 连接）
- [x] 配对等待 UI
- [x] 连接状态管理

## Phase 1: MVGP ✅

### 1.1 紧急停止按钮 ✅
- [x] UI：永远置顶、高亮、一键触达
- [x] 独立高优先级信道
- [x] 离线/弱网 fallback

### 1.2 基础驾驶舱 ✅
- [x] "探查"按钮（每条 Agent 回复旁）
- [x] 树状视图：思考链、工具调用、子任务
- [x] 实时推送渲染

### 1.3 成本熔断器 ✅
- [x] 日累计成本阈值设置
- [x] 实时成本监控
- [x] 超阈值自动暂停 + 推送警告
- [x] 三层熔断（警告/降级/熔断）
- [x] 成本顾问 + 一键优化

## Phase 2: 迭代 (计划中)
- [ ] 多 Bot 连接
- [ ] 记忆编辑器
- [ ] 技能护栏
- [ ] Pro 版订阅

---

## 当前状态

**V5.0.0-beta.1 已发布** (2026-02-22)
- Phase 0 + Phase 1 全部完成
- 部署: Vercel + 铁锤 nginx
- 下一步: Phase 2 迭代功能
