<p align="center">
  <img src="public/icon-192.png" alt="ClawFlag" width="80" />
</p>

<h1 align="center">ClawFlag</h1>

<p align="center">
  <strong>Mobile Command Center for AI Agents</strong><br/>
  OpenClaw Gateway 移动控制面板 PWA
</p>

<p align="center">
  <a href="https://claw-flag.vercel.app/">Live Demo</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#security">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v4.0.0--beta.1-blue" />
  <img src="https://img.shields.io/badge/react-19-61dafb" />
  <img src="https://img.shields.io/badge/PWA-installable-brightgreen" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" />
</p>

---

> *"See your AI. Control it from your fingertips."*
> 洞察你的 AI，掌控于指尖。

AI safety requires human-in-the-loop. Human-in-the-loop requires mobile convenience. ClawFlag bridges that gap — a PWA that turns your phone into a full command center for your [OpenClaw](https://github.com/openclaw/openclaw) Gateway.

<!-- Screenshots -->
<p align="center">
  <img src="docs/screenshots/chat.png" width="180" alt="Chat" />
  <img src="docs/screenshots/pulse.png" width="180" alt="Pulse" />
  <img src="docs/screenshots/brain.png" width="180" alt="Brain" />
  <img src="docs/screenshots/router.png" width="180" alt="Router" />
</p>
<p align="center"><em>Screenshots coming soon — contributions welcome!</em></p>

---

## Quick Start

```
1. Visit   → https://claw-flag.vercel.app/
2. Install → "Add to Home Screen" (PWA)
3. Connect → Enter Gateway address (IP:port) + Token
4. Done    → You're in control 🎯
```

No account. No cloud. Your Gateway, your data.

---

## Features

ClawFlag is organized into **5 tabs（五大功能页）**:

### 💬 Chat — 对话

Real-time conversation with your AI Agent.

- Streaming responses with tool-call inline cards
- Collapsible code blocks for long outputs
- Per-message cost labels（单条消息成本标签）
- **Dangerous action approval buttons** — inline, one tap
- Context compression warning + one-click compress
- Emergency stop floating button（紧急停止）

### 📊 Pulse — 脉搏

**3-second overview** of everything that matters.

- Agent status / today's spend / pending approvals
- Session list with context usage progress bars
- Cron job management (enable / disable / manual trigger)
- **Gateway security audit** — version, auth, network exposure, TLS
- Agent stats social card (shareable)

### 🧠 Brain — 大脑

Peer into your Agent's mind.

- Memory browser: timeline + semantic search + fidelity rings
- SOUL.md viewer/editor
- Layered config editor (L0–L3)
- Skill list with **safety scores**（技能安全评分）

### ⚡ Router — 路由

Cost control and model management.

- Model routing table with fallback chains
- **Cost Advisor** — actionable optimization tips, one-click apply
- Cost distribution chart + 24h trend
- **3-tier cost circuit breaker**（三层成本熔断器）: warn → degrade → halt
- Budget settings with progress bar

### 🔗 Connect — 连接

Secure device pairing.

- Gateway connection configuration
- Ed25519 device authentication (WebCrypto)
- Pairing wait UI with auto-reconnect

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ClawFlag PWA                      │
│  ┌────────┬────────┬────────┬────────┬────────┐     │
│  │  Chat  │ Pulse  │ Brain  │ Router │Connect │     │
│  └────┬───┴────┬───┴────┬───┴────┬───┴────┬───┘     │
│       └────────┴────────┴────────┴────────┘          │
│                    gatewayClient.ts                   │
│              WebSocket Protocol v3                   │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │ Direct     │            │ V5 Relay (planned)
          │            │            │
          ▼            │            ▼
   ┌──────────┐       │     ┌─────────────┐
   │ OpenClaw │       │     │Relay Server │
   │ Gateway  │       │     │(blind pipe) │
   └──────────┘       │     └──────┬──────┘
                      │            │ E2EE
                      │     ┌──────┴──────┐
                      │     │clawflag-agent│
                      │     └──────┬──────┘
                      │            │
                      └────────────┘
                         Gateway
```

**Current (v4):** Direct WebSocket connection to Gateway.
**Planned (V5):** Relay Server with end-to-end encryption — Gateway never needs public exposure.

---

## Security Model

ClawFlag is built on a **zero-cloud-storage（零云存储）** principle:

| Layer | Protection |
|-------|-----------|
| **Data Sovereignty** | All data stays on YOUR Gateway. ClawFlag stores nothing in the cloud. |
| **Transport** | WSS (TLS) + Token authentication |
| **Device Auth** | Ed25519 key pairs generated locally via WebCrypto |
| **Local Storage** | Only connection config cached in browser localStorage |
| **Gateway Audit** | Built-in security scanner (version, auth, network, TLS) |

### V5 E2EE Architecture (In Development)

```
Phone ←──ECDH+AES-256-GCM──→ clawflag-agent ←──local──→ Gateway
              ↕
        Relay Server
      (sees only ciphertext)
```

- **Blind Pipe Principle（盲管道原则）**: Relay only forwards encrypted bytes
- **ECDH key exchange** + AES-256-GCM end-to-end encryption
- No direct Gateway exposure required
- `clawflag-agent`: npm global package running on Gateway host

---

## Self-Hosting

```bash
git clone https://github.com/windarch/ClawFlag.git
cd ClawFlag
npm install
npm run dev        # → http://localhost:5173
npm run build      # Production build → dist/
```

### Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Bundler | Vite 7 |
| PWA | vite-plugin-pwa |
| Auth | Ed25519 (WebCrypto) |
| Protocol | OpenClaw Gateway WS v3 |
| Theme | CSS Variables, dark mode |
| Deploy | Vercel (auto) |

---

## Project Structure

```
src/
├── services/gatewayClient.ts   # WS Protocol v3 client
├── contexts/                   # React Context providers
├── hooks/useGatewayData.ts     # Business data hooks
├── pages/                      # Connect / Chat / Pulse / Brain / Router
├── components/                 # 30+ components
└── styles/                     # Global styles + CSS variables

packages/
├── relay-server/               # V5 Relay server
├── clawflag-agent/             # V5 Gateway-side agent
└── claw-audit/                 # Security audit CLI
```

---

## Roadmap

- [x] Core 5-tab PWA
- [x] Gateway WS Protocol v3
- [x] Ed25519 device auth
- [x] Cost circuit breaker (3-tier)
- [x] Gateway security audit
- [ ] V5 Relay Server (E2EE blind pipe)
- [ ] `clawflag-agent` npm package
- [ ] Multi-gateway management
- [ ] Push notifications via Relay
- [ ] Localization (i18n)

---

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Why ClawFlag?

| | ClawFlag | Cloud dashboards |
|---|---|---|
| Data location | Your Gateway | Their servers |
| Cloud storage | **Zero** | Everything |
| Works offline | ✅ (PWA) | ❌ |
| Cost control | 3-tier circuit breaker | Basic alerts |
| Security audit | Built-in scanner | Trust them |
| Install | Add to home screen | App store |

---

## License

[MIT](LICENSE) © [windarch](https://github.com/windarch)

---

<p align="center">
  <strong>Your AI, your rules, your phone.</strong><br/>
  你的 AI，你的规则，你的手机。
</p>
