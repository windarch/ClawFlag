# ClawFlag 会话交接文档

> 写给 /new 后的自己。读完这个文件你就能无缝接上。

## 你在做什么

ClawFlag — 移动端 AI Agent 指挥中心 PWA。已完成前端 UI + Gateway WS 集成，正在铁锤服务器上实机测试。

## 关键文件（必读）

1. **`~/clawd/projects/clawflag/STATUS.md`** — 完整项目状态、已完成功能、E2E 测试结果、已知 bug、文件结构、下一步建议
2. **`~/clawd/projects/clawflag/PRD.md`** — 产品需求文档

## 部署信息

| 环境 | 地址 | 方式 |
|------|------|------|
| 铁锤 nginx | http://REDACTED_SERVER_IP:8088 | 手动 scp dist/ |
| Vercel | https://claw-flag.vercel.app/ | git push 自动 |
| 本地 dev | http://localhost:5173/ | npm run dev |

铁锤 Gateway: `ws://REDACTED_SERVER_IP:18789`，Token: `REDACTED_GATEWAY_TOKEN`

## 当前进度

### ✅ 已完成
- 5 个页面 (Connect/Chat/Pulse/Brain/Router) + 30+ 组件
- Gateway WS v3 协议客户端 + Ed25519 设备认证
- Chat 页面已通 E2E：连接 ✅、chat.history ✅、消息正常显示 ✅
- **content 数组格式 bug 已修复** — Gateway 返回 `[{type:"text",text:"..."}]`，已加 `extractContent()` 处理
- **origin 问题已修复** — `allowedOrigins: ['*']` 不生效，已明确添加 origin
- API 测试 8/10 通过 (scripts/e2e-api-test.cjs)

### 🐛 待修复
1. `sessions.preview` 参数格式：应传 `{keys: [sessionKey]}` 非 `{sessionKey}`
2. `config.get` 参数格式需查正确格式
3. Pulse/Brain/Router 页面需对接真实数据验证（可能也有 object 序列化问题）

### 🚀 下一步
1. 修复上面 2 个 API 参数 bug
2. 各页面真实数据验证（特别是 Pulse 的 sessions、Brain 的 models、Router 的 channels）
3. chat.send 发消息 + 流式响应测试
4. 实时事件推送（新消息通知）
5. 移动端 UX 打磨

## 关键协议知识

- Gateway 用 **Ed25519**（不是 P-256）
- client ID 用 `webchat-ui`（避免 `openclaw-control-ui` 的 origin 限制）
- `chat.history` 的 content 是 **Anthropic 数组格式**，不是 string
- `dangerouslyDisableDeviceAuth: true` 在铁锤已开启
- `allowedOrigins: ['*']` 新版无效，必须明确列 origin

## 部署命令

```bash
cd ~/clawd/projects/clawflag
npm run build
tar -czf /tmp/clawflag-dist.tar.gz -C dist .
scp /tmp/clawflag-dist.tar.gz root@REDACTED_SERVER_IP:/tmp/
ssh root@REDACTED_SERVER_IP "tar -xzf /tmp/clawflag-dist.tar.gz -C /var/www/clawflag/"
```
