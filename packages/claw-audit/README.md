# claw-audit 🛡️

Security audit CLI for [OpenClaw](https://github.com/openclaw/openclaw) Gateway instances.

One command to check if your AI agent's gateway is secure.

## Quick Start

```bash
npx claw-audit ws://localhost:18789 --token YOUR_TOKEN
```

## What it checks

| Check | Description | Severity |
|-------|------------|----------|
| **Version** | Gateway ≥ 2026.1.30 (CVE-2026-25253, CVE-2026-24763) | 🚨 Critical |
| **Exposure** | Bind address (0.0.0.0 = public = dangerous) | 🚨 Critical |
| **Auth** | Authentication enabled and configured | 🚨 Critical |
| **Skills** | Installed skill count (surface area check) | ⚠️ Warning |

## Options

```
-t, --token <token>   Authentication token
--timeout <ms>        Connection timeout (default: 10000)
--json                Output as JSON
-V, --version         Show version
-h, --help            Show help
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Warnings found |
| 2 | Critical issues found |
| 3 | Connection failed |

## Example Output

```
🛡️  claw-audit v0.1.0
──────────────────────────────────────────────────
Target: ws://localhost:18789

✅ Gateway 版本
   版本 2026.2.19，已满足安全基线

✅ 网络暴露
   Gateway 绑定到 loopback，仅本地可访问

✅ 认证状态
   已启用 token 认证

✅ 已安装技能
   已安装 5 个技能

──────────────────────────────────────────────────
✅ 所有检查通过！

🔗 在 ClawFlag 中查看详情: https://claw-flag.vercel.app/
```

## Part of ClawFlag

This tool is part of [ClawFlag](https://github.com/windarch/ClawFlag) — the mobile command center for your AI agents.

## License

MIT
