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

### ✅ 已修复 (本轮)
1. `config.get` 返回值解析 — Gateway 返回 `{path, exists, raw}` 需 JSON.parse
2. `sessions.preview` 参数格式 — 改为 `{keys: [key]}`（e2e 测试修复）
3. chat 流式响应 delta 重复 bug — content 是累积的不是增量，改为替换
4. final 事件也更新 content 文本
5. **E2E 测试 10/10 全通过** ✅
6. **chat.send 流式响应 E2E 验证通过** — delta + final 事件正常
7. sessions.list 字段映射修复 — updatedAt(非updatedAtMs)、tokenUsage 从 totalTokens/contextTokens 计算、active 检测
8. sessions.usage 嵌套格式解析 — 从 sessions[].usage 提取 token 数据，估算美元成本
9. Router 页面不再显示 712 个 model — 只展示实际配置的路由

### 🚀 下一步
1. 在手机/浏览器上实测所有页面的真实数据展示
2. Brain 页面对接真实 memory/skills 数据（目前是 mock）
3. 实时事件推送（新消息通知）
4. 移动端 UX 打磨
5. 会话切换器完善

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
