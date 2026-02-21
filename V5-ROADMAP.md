# ClawFlag V5 开发路线图

> 基于 PRD-v5.0.pdf，拆解为可执行的开发任务

## Phase 0: 核心验证 (2-4 周)

### 0.1 Relay Server (Go/Node.js)
- [ ] WebSocket 服务器框架
- [ ] Token 生成与配对流程
- [ ] ECDH 密钥交换（通过 Token 首次配对）
- [ ] E2EE 消息转发（AES-256-GCM）
- [ ] 盲管道原则：服务器只转发加密数据
- [ ] 部署到铁锤服务器

### 0.2 clawflag-agent (npm 全局包)
- [ ] 项目初始化 (TypeScript + Node.js)
- [ ] --token 参数配对流程
- [ ] WebSocket 连接 Relay Server
- [ ] ECDH 密钥协商
- [ ] 监听 OpenClaw 结构化日志
- [ ] 接收并执行加密指令
- [ ] npm publish

### 0.3 App 架构重构
- [ ] 从直连 Gateway → 通过 Relay 连接
- [ ] Token 生成 UI（"+"按钮创建 Bot 连接）
- [ ] 配对等待 UI
- [ ] 连接状态管理

## Phase 1: MVGP (4-8 周)

### 1.1 紧急停止按钮 (The Big Red Button)
- [ ] UI：永远置顶、高亮、一键触达
- [ ] 独立高优先级信道
- [ ] 1秒内可靠终止所有 Agent 任务
- [ ] 离线/弱网 fallback

### 1.2 基础驾驶舱 (Show Your Work)
- [ ] "探查"按钮（每个 Agent 回复旁）
- [ ] 树状视图：思考链、工具调用、子任务
- [ ] 实时推送渲染

### 1.3 成本熔断器 (Cost Fuse)
- [ ] 日累计成本阈值设置
- [ ] 实时成本监控
- [ ] 超阈值自动暂停 + 推送警报

## Phase 2: 迭代 (8-16 周)
- [ ] 多 Bot 连接
- [ ] 记忆编辑器
- [ ] 技能护盾
- [ ] Pro 版订阅

---

## 当前决策

### 技术选型
- **Relay Server**: Node.js (TypeScript) — 与生态一致，开发速度快
- **App**: 保持 React PWA（V4 基础），后续考虑 React Native
- **加密**: tweetnacl (NaCl) 或 Web Crypto API

### 开发顺序
1. 先搭 Relay Server（铁锤上）
2. 再写 clawflag-agent
3. 最后改 App 前端

### V4 → V5 过渡
- V4 直连模式保留为"高级模式"
- V5 默认走 Relay
- 两种模式共存
