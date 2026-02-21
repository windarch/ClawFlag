# ClawFlag 项目状态 📊

> 最后更新: 2026-02-21 21:05

## 项目概况
- **定位**: 移动端 AI Agent 指挥中心 PWA
- **技术栈**: Vite 7.3 + React 19 + TypeScript 5.9 + react-router-dom 7 + react-markdown 10 + vite-plugin-pwa
- **GitHub**: https://github.com/windarch/ClawFlag
- **Vercel**: https://claw-flag.vercel.app/
- **铁锤部署**: http://REDACTED_SERVER_IP:8088 (nginx → /var/www/clawflag/)
- **本地路径**: ~/clawd/projects/clawflag/

## 部署方式

### Vercel (自动)
```bash
git push  # 自动触发 Vercel 部署
```

### 铁锤 nginx (手动)
```bash
cd ~/clawd/projects/clawflag
npm run build
tar -czf /tmp/clawflag-dist.tar.gz -C dist .
scp /tmp/clawflag-dist.tar.gz root@REDACTED_SERVER_IP:/tmp/
ssh root@REDACTED_SERVER_IP "tar -xzf /tmp/clawflag-dist.tar.gz -C /var/www/clawflag/"
```

## 铁锤 Gateway 配置
- **端口**: 18789
- **Token**: `REDACTED_GATEWAY_TOKEN`
- **配置文件**: `/root/.openclaw/openclaw.json`
- **关键设置**:
  - `bind: lan` (0.0.0.0)
  - `controlUi.allowedOrigins`: 含 `http://REDACTED_SERVER_IP:8088`
  - `dangerouslyDisableDeviceAuth: true`
  - `allowInsecureAuth: true`

## 已完成功能 ✅

### 核心架构
- [x] Gateway WS 客户端 (`src/services/gatewayClient.ts`)
  - v3 协议握手: connect.challenge → connect → hello-ok
  - Ed25519 设备认证 (WebCrypto)
  - 请求/响应/事件帧处理
  - tick 心跳保活
  - 自动重连 (指数退避)
  - 所有 API 方法封装
- [x] GatewayContext (`src/contexts/GatewayContext.tsx`)
  - 自动连接、断线重连
  - pairingRequired 状态
  - scopes 跟踪
- [x] 统一 hooks (`src/hooks/useGatewayData.ts`)
  - `useChat` — 聊天 + 流式响应
  - `useSessions` — 会话列表
  - `useAgentStatus` — Agent 状态
  - `useModels` — 模型列表
  - `useCronJobs` — 定时任务
  - `useChannels` — 渠道状态
  - 真实 API 优先，mock 数据兜底
  - `extractContent()` 处理 Anthropic 数组格式 content

### 5 个页面
1. **Connect** — Gateway 连接配置 + 设备配对 UI
2. **Chat** — 对话界面，流式响应、工具调用模态框、成本标签、停止/总结按钮
3. **Pulse** — 系统脉搏：Agent 状态、会话列表、Cron 任务
4. **Brain** — 大脑：模型列表、token 用量
5. **Router** — 路由：渠道状态、消息路由

### UI 组件 (30+)
- ChatBubble (Markdown、折叠代码块、文件diff、工具调用卡片、流式动画)
- ChatInput (发送、长按总结)
- ContextBar (token 进度条)
- ToolCallModal
- EmptyState
- StatusCard / MetricCard
- SessionCard / CronCard
- 底部导航 (对话/脉搏/大脑/路由)
- PWA 支持 (Service Worker, 离线缓存)

### 设备认证
- Ed25519 密钥对生成 (WebCrypto)
- IndexedDB 存储密钥
- 正确的签名 payload 格式: `v2|deviceId|clientId|mode|role|scopes|signedAt|token|nonce`
- base64url 编码
- deviceToken 持久化
- 配对 UI (等待审批提示)

## E2E 测试结果 (2026-02-21)

对铁锤 Gateway (REDACTED_SERVER_IP:18789) 的 API 测试:

| 方法 | 状态 | 备注 |
|------|------|------|
| connect (v3) | ✅ | protocol=3, 86 methods |
| health | ✅ | |
| status | ✅ | |
| sessions.list | ✅ | 2 sessions |
| chat.history | ✅ | content 为数组格式，extractContent 正确处理 |
| models.list | ✅ | 712 models |
| cron.list | ✅ | 2 jobs |
| usage.status | ✅ | |
| sessions.preview | ❌ | 参数格式需修复 (keys[] 而非 sessionKey) |
| config.get | ❌ | 参数格式需修复 |

测试脚本: `scripts/e2e-api-test.cjs`

## 已知问题 / 待修复 🐛

1. **sessions.preview 参数**: 应传 `{keys: [sessionKey]}` 而非 `{sessionKey}`
2. **config.get 参数**: 需查正确格式
3. **scopes=0**: webchat 模式 + dangerouslyDisableDeviceAuth=true 时不返回 scopes，但 API 仍可用
4. **Vercel 部署**: 连外部 WS 需要目标 Gateway 配置 allowedOrigins 含 vercel 域名

## 已发现的关键协议细节 🔑

- Gateway 用 **Ed25519** (不是 ECDSA P-256)
- `webchat-ui` client ID 避免 `openclaw-control-ui` 的严格 origin 检查
- `dangerouslyDisableDeviceAuth: true` 实际让 device=null，跳过设备验证
- `allowedOrigins: ['*']` 在新版本不生效，必须明确列出 origin
- `chat.history` content 是 Anthropic 数组格式: `[{type:"text", text:"..."}]`
- `chat.history` 响应较慢 (几秒)，需前端 loading 状态

## 文件结构

```
src/
├── services/
│   └── gatewayClient.ts      # WS 客户端核心
├── contexts/
│   └── GatewayContext.tsx     # React Context
├── hooks/
│   └── useGatewayData.ts     # 6 个 hooks
├── pages/
│   ├── Connect.tsx            # 连接页
│   ├── Chat.tsx               # 对话页
│   ├── Pulse.tsx              # 脉搏页
│   ├── Brain.tsx              # 大脑页
│   └── Router.tsx             # 路由页
├── components/
│   ├── ChatBubble.tsx + .css
│   ├── ChatInput.tsx + .css
│   ├── ContextBar.tsx + .css
│   ├── ToolCallModal.tsx + .css
│   ├── EmptyState.tsx
│   ├── StatusCard.tsx
│   └── ...
├── styles/
│   ├── global.css
│   ├── pages.css
│   └── theme.css
├── types/
│   ├── chat.ts
│   └── gateway.ts
└── App.tsx + main.tsx
scripts/
├── e2e-api-test.cjs           # E2E API 测试
├── admin-approve.mjs          # 设备批量审批
├── test-paired.mjs            # 配对设备测试
└── test-device-auth.mjs       # 设备认证测试
```

## 下一步建议 🚀

### 短期 (bug 修复)
- 修复 sessions.preview / config.get 参数格式
- 各页面对接真实数据验证 (Pulse/Brain/Router)
- 改善 loading / error 状态展示

### 中期 (功能增强)
- chat.send 发消息并接收流式响应
- 实时事件推送 (新消息通知铃铛)
- 会话切换器完善
- 暗色/亮色主题切换
- PWA 推送通知

### 长期 (差异化)
- 多 Gateway 管理
- 手势操作 (滑动切换页面)
- 语音输入
- 移动端专属 Agent 控制 (一键重启、紧急停止)
