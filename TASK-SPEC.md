# ClawFlag 完整开发任务规划

## 项目位置
`~/clawd/projects/clawflag/`

## 技术栈
- React 19 + TypeScript + Vite + React Router
- PWA (vite-plugin-pwa)
- 纯 CSS（无 UI 框架）

## Gateway WS 协议摘要

### 连接
```
ws://<host>:<port>  (默认 18789)
```

### 帧格式
- Request: `{type:"req", id, method, params}`
- Response: `{type:"res", id, ok, payload|error}`
- Event: `{type:"event", event, payload, seq?, stateVersion?}`

### 握手流程
1. 收到 `connect.challenge` event (nonce + ts)
2. 发送 connect req: `{type:"req", id:"1", method:"connect", params:{minProtocol:3, maxProtocol:3, client:{id:"openclaw-control-ui", version:"0.1.0", platform:"web", mode:"ui"}, role:"operator", scopes:["operator.read","operator.write"], auth:{token:"..."}}}`
3. 收到 hello-ok res: `{type:"res", id:"1", ok:true, payload:{type:"hello-ok", protocol:3, server:{version,connId}, features:{methods,events}, snapshot:{presence,health,stateVersion,uptimeMs,sessionDefaults,authMode,updateAvailable}}}`

### 关键方法（WS req/res）
- `sessions.list` → params: {limit?, activeMinutes?, includeDerivedTitles?, includeLastMessage?}
- `sessions.usage` → params: {key?, startDate?, endDate?, limit?}
- `sessions.reset` → params: {key, reason?}
- `sessions.compact` → params: {key}
- `chat.history` → params: {sessionKey, limit?}
- `chat.send` → params: {sessionKey, message, idempotencyKey, thinking?, deliver?, timeoutMs?}
- `chat.abort` → params: {sessionKey, runId?}
- `agents.list` → params: {}
- `agents.files.list` → params: {agentId}
- `agents.files.read` → params: {agentId, name}
- `agents.files.write` → params: {agentId, name, content}
- `cron.list` → params: {includeDisabled?}
- `cron.add` / `cron.update` / `cron.remove` / `cron.run`
- `config.get` / `config.patch`
- `models.list`
- `logs.tail` → params: {cursor?, limit?}

### 关键事件（WS event push）
- `chat` → ChatEvent: {runId, sessionKey, seq, state:"delta"|"final"|"aborted"|"error", message?, usage?}
- `tick` → {ts}
- `presence.update` → presence entries
- `health.update` → health snapshot
- `shutdown`
- `exec.approval.requested`
- `cron.job.update`

### HTTP API（备用）
- `POST /tools/invoke` → {tool, args, sessionKey?}
  - Auth: `Authorization: Bearer <token>`
- `POST /v1/chat/completions` → OpenAI 兼容
- `GET /health` (if available)

## 当前代码问题

### 1. gatewayClient.ts (153行)
需要重写以正确实现协议：connect challenge → handshake → req/res 配对 → event 订阅

### 2. useGateway.ts (408行)
连接管理 hook，需要与新 client 对接

### 3. useGatewayData.ts (323行)
所有 6 个 hooks 用 mock 数据，需要切换到真实 WS 调用，保留 mock 作 fallback

### 4. Pages 的 mock 数据
- Chat.tsx: mock messages，需要真实 chat.send / chat.history / chat event streaming
- Pulse.tsx: mock glance/security/sessions，需要真实 sessions.list + health snapshot
- Brain.tsx: mock soul/skills，需要 agents.files.list/read/write
- Router.tsx: mock advices/routes，需要 models.list + sessions.usage

### 5. ChatBubble 增强（PRD 要求）
- 折叠长代码块（>10行自动折叠）
- 文件差异卡片（检测 diff 格式并渲染）
- 内联批准按钮（tool_use 类型消息带批准/拒绝）

### 6. 移动端 UX
- Touch targets ≥ 44px
- Safe area padding (env(safe-area-inset-*))
- 页面切换动画
- Pull-to-refresh
- Haptic feedback (navigator.vibrate)
