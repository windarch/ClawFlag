# ClawFlag 测试指南

## 项目简介

ClawFlag 是 OpenClaw Gateway 的**移动端控制面板**（PWA），让你通过手机监控和操控 AI Agent。

- **线上预览**: https://claw-flag.vercel.app/
- **GitHub**: https://github.com/windarch/ClawFlag
- **技术栈**: React 19 + TypeScript + Vite + PWA

### 功能模块

| 页面 | 功能 |
|------|------|
| **连接 (Connect)** | 输入 Gateway 地址 + Token 连接 |
| **对话 (Chat)** | 与 AI Agent 实时对话，支持流式响应 |
| **脉搏 (Pulse)** | 概览（状态/开销/会话/定时任务/安全审计）|
| **大脑 (Brain)** | 记忆浏览器、配置编辑器、技能列表 |
| **路由 (Router)** | 模型路由、成本分析、预算熔断 |

---

## 测试方式

有两种测试方式，根据你的情况选择：

### 方式一：纯 UI 测试（不需要 Gateway）

适合：前端 UI 走查、样式检查、交互体验

1. 打开 https://claw-flag.vercel.app/
2. 你会看到连接页面，**不需要真的连接**
3. 底部导航栏可以切换 5 个页面
4. 各页面在未连接时会显示 **Mock 数据**（模拟数据）
5. 重点关注：
   - 页面布局是否正常（特别是手机竖屏）
   - 文字是否被截断
   - 按钮是否可点击
   - 底部导航是否正常

### 方式二：完整 E2E 测试（需要 Gateway）

适合：验证真实数据流

**前提条件：**
- 一台运行 OpenClaw Gateway 的机器（版本 ≥ 2026.1.30）
- Gateway 的 IP 地址和端口（默认 18789）
- Gateway 的 auth token（如有配置）

**步骤：**

#### 1. 确认 Gateway 运行中

```bash
openclaw gateway status
# 应显示 running
```

如果没有运行：
```bash
openclaw gateway start
```

#### 2. 获取连接信息

```bash
# Gateway IP（如果是本地就是 127.0.0.1）
hostname -I

# 查看 auth token（如有）
cat ~/.openclaw/openclaw.json | grep token
# 或
cat ~/.clawdbot/.openclaw/openclaw.json | grep token

# 默认端口
echo 18789
```

#### 3. 打开 ClawFlag

- **手机测试**: 用手机浏览器打开 https://claw-flag.vercel.app/
- **电脑测试**: 用 Chrome 开发者工具切换到手机模拟模式（F12 → 点击手机图标）
- **本地测试**: 克隆仓库后 `npm install && npm run dev`

#### 4. 连接 Gateway

1. 在连接页面输入：
   - **Gateway 地址**: 你的 Gateway IP（如 `192.168.1.100`）
   - **端口**: `18789`（或你的自定义端口）
   - **Token**: 粘贴你的 auth token（如有）
   - **WSS**: 如果 Gateway 有 TLS，勾选
2. 点击 **连接**

#### 5. 首次连接 — 设备配对

ClawFlag 使用 Ed25519 设备认证。首次连接时：

1. 页面会提示 **"设备待批准"**
2. 在 Gateway 主机上运行：
   ```bash
   openclaw devices
   ```
3. 找到 pending 的设备，批准它
4. 回到 ClawFlag，点击重新连接
5. 应该能看到 **"已连接"** + 权限信息

> ⚠️ 如果 Gateway 运行在本地（localhost），设备会**自动批准**，无需手动操作。

#### 6. 验证各页面

连接成功后，逐个检查：

**对话页 (/chat)**
- [ ] 能看到会话列表下拉框
- [ ] 选择会话后能加载聊天记录
- [ ] 发送消息后能收到流式响应
- [ ] 工具调用显示为可点击的卡片

**脉搏页 (/pulse)**
- [ ] 概览 tab 显示 Agent 状态
- [ ] 会话 tab 显示活跃会话列表 + context 用量条
- [ ] 定时任务 tab 显示 cron jobs（可能为空）
- [ ] 安全 tab 显示 Gateway 安全审计结果

**大脑页 (/brain)**
- [ ] 记忆 tab 显示记忆文件时间线
- [ ] 配置 tab 显示分层配置（L0-L3）
- [ ] 技能 tab 显示已安装技能列表

**路由页 (/router)**
- [ ] 模型 tab 显示可用模型列表
- [ ] 成本 tab 显示费用概览
- [ ] 预算 tab 显示预算进度条

---

## 已知问题

1. **Vercel 部署的版本连接非 HTTPS Gateway 时可能被浏览器拦截**
   - 解决：使用本地 `npm run dev` 测试，或 Gateway 配置 TLS
   
2. **Ed25519 WebCrypto 需要 Chrome 113+ / Safari 17+**
   - 较老浏览器可能无法生成设备密钥
   
3. **Gateway bind=lan 时新设备不会自动批准**
   - 需要手动在 Gateway 主机运行 `openclaw devices` 批准

---

## 本地开发测试

```bash
# 克隆
git clone https://github.com/windarch/ClawFlag.git
cd ClawFlag

# 安装
npm install

# 开发模式
npm run dev
# 打开 http://localhost:5173

# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 反馈模板

测试完成后请反馈：

```
设备: [手机型号/电脑+浏览器]
Gateway版本: [openclaw --version]
测试方式: [纯UI / 连接Gateway]

### UI 检查
- 连接页: ✅/❌ [问题描述]
- 对话页: ✅/❌ [问题描述]
- 脉搏页: ✅/❌ [问题描述]
- 大脑页: ✅/❌ [问题描述]
- 路由页: ✅/❌ [问题描述]

### 功能检查（连接 Gateway 时）
- 连接成功: ✅/❌
- 设备配对: ✅/❌
- 聊天: ✅/❌
- 数据加载: ✅/❌

### 其他问题
[截图 + 描述]
```

---

## 联系

有问题找 Raymond。
