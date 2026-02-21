/**
 * Gateway 连接配置页面
 * 输入 Gateway 地址和 Token 进行连接
 * 包含故障排除指南和连接历史
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGatewayContext, type GatewayConfig } from '../contexts/GatewayContext';
import '../styles/pages.css';

const DEFAULT_PORT = 18789;

// 故障排除步骤
const TROUBLESHOOT_STEPS = [
  { title: '检查 Gateway 是否运行', desc: '运行 `openclaw gateway status` 确认 Gateway 已启动', icon: '🔍' },
  { title: '确认网络可达', desc: '确保设备与 Gateway 在同一网络，或通过 Tailscale 连接', icon: '🌐' },
  { title: '检查端口', desc: `默认端口 ${DEFAULT_PORT}，确认防火墙已放行`, icon: '🔌' },
  { title: '验证 Token', desc: '在 Gateway 配置中查看 auth.token 设置', icon: '🔑' },
  { title: '使用 HTTPS', desc: '远程访问建议使用 Tailscale Serve 或反向代理提供 TLS', icon: '🔒' },
];

// CVE 警告信息
const KNOWN_CVES = [
  { id: 'CVE-2026-25253', minVersion: '2026.1.30', desc: '跨站 WebSocket 劫持 (CSWSH)' },
  { id: 'CVE-2026-24763', minVersion: '2026.1.30', desc: '未授权远程代码执行 (RCE)' },
];

export default function Connect() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    connected, connecting, error, hello,
    connect, disconnect, loadStoredConfig, clearStoredConfig,
  } = useGatewayContext();

  const [host, setHost] = useState('');
  const [port, setPort] = useState(String(DEFAULT_PORT));
  const [token, setToken] = useState('');
  const [secure, setSecure] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load stored config
  useEffect(() => {
    const stored = loadStoredConfig();
    if (stored) {
      setHost(stored.host);
      setPort(String(stored.port));
      if (stored.token) setToken(stored.token);
      setSecure(stored.secure || false);
    }
  }, [loadStoredConfig]);

  // Redirect to app after successful connect
  useEffect(() => {
    if (connected) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [connected, navigate, location.state]);

  const handleConnect = () => {
    if (!host.trim()) return;
    const config: GatewayConfig = {
      host: host.trim(),
      port: parseInt(port) || DEFAULT_PORT,
      token: token.trim() || undefined,
      secure,
    };
    connect(config);
  };

  const handleDisconnect = () => {
    disconnect();
    clearStoredConfig();
  };

  // Check for CVE warnings based on hello payload
  const gatewayVersion = hello?.version as string || hello?.gatewayVersion as string || '';
  const cveWarnings = KNOWN_CVES.filter(() => {
    // Simple check: if version looks old, warn
    return gatewayVersion && gatewayVersion < '2026.1.30';
  });

  return (
    <div className="page connect-page">
      <div className="connect-container">
        {/* Header */}
        <div className="connect-header">
          <div className="connect-logo">🚩</div>
          <h1>ClawFlag</h1>
          <p className="connect-subtitle">连接到你的 OpenClaw Gateway</p>
        </div>

        {/* Connection Status */}
        {connected && (
          <div className="connect-status connected">
            <span className="status-dot green"></span>
            <span>已连接到 {host}:{port}</span>
            {gatewayVersion && <span className="version-badge">v{gatewayVersion}</span>}
          </div>
        )}

        {connecting && (
          <div className="connect-status connecting">
            <div className="loading-spinner-small"></div>
            <span>正在连接...</span>
          </div>
        )}

        {error && !connecting && (
          <div className="connect-status error">
            <span className="status-dot red"></span>
            <span>{error}</span>
          </div>
        )}

        {/* CVE Warnings */}
        {cveWarnings.length > 0 && (
          <div className="cve-banner">
            <span className="cve-icon">⚠️</span>
            <div>
              <strong>安全警告</strong>
              {cveWarnings.map(cve => (
                <p key={cve.id}>{cve.id}: {cve.desc}</p>
              ))}
              <p>请升级 Gateway 到 ≥ {cveWarnings[0].minVersion}</p>
            </div>
          </div>
        )}

        {/* Connection Form */}
        {!connected && (
          <div className="connect-form">
            <div className="form-group">
              <label>Gateway 地址</label>
              <input
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="例如: 192.168.1.100 或 my-server.local"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>

            <div className="form-row">
              <div className="form-group form-group-port">
                <label>端口</label>
                <input
                  type="number"
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  placeholder={DEFAULT_PORT.toString()}
                />
              </div>
              <div className="form-group form-group-secure">
                <label>
                  <input
                    type="checkbox"
                    checked={secure}
                    onChange={e => setSecure(e.target.checked)}
                  />
                  WSS (TLS)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Token (可选)</label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="粘贴你的 Gateway Token"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>

            {showAdvanced && (
              <div className="form-group">
                <label className="form-hint">高级选项</label>
                <p className="form-hint">
                  使用 Tailscale 时，输入 MagicDNS 地址即可。
                  如果 Gateway 配置了 <code>controlUi.basePath</code>，请在地址中包含路径。
                </p>
              </div>
            )}

            <button
              className="btn btn-primary btn-connect"
              onClick={handleConnect}
              disabled={!host.trim() || connecting}
            >
              {connecting ? '连接中...' : '连接'}
            </button>

            <button
              className="btn btn-text"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '隐藏高级选项' : '高级选项'}
            </button>
          </div>
        )}

        {/* Connected: action buttons */}
        {connected && (
          <div className="connect-actions">
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              进入 ClawFlag →
            </button>
            <button className="btn btn-danger" onClick={handleDisconnect}>
              断开连接
            </button>
          </div>
        )}

        {/* Gateway Info */}
        {connected && hello && (
          <div className="gateway-info">
            <h3>Gateway 信息</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">协议版本</span>
                <span className="info-value">v{hello.protocol}</span>
              </div>
              {hello.auth?.role && (
                <div className="info-item">
                  <span className="info-label">角色</span>
                  <span className="info-value">{hello.auth.role}</span>
                </div>
              )}
              {hello.auth?.scopes && (
                <div className="info-item">
                  <span className="info-label">权限</span>
                  <span className="info-value">{hello.auth.scopes.join(', ')}</span>
                </div>
              )}
              {hello.policy?.tickIntervalMs && (
                <div className="info-item">
                  <span className="info-label">心跳间隔</span>
                  <span className="info-value">{hello.policy.tickIntervalMs / 1000}s</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Troubleshoot */}
        <div className="troubleshoot-section">
          <button
            className="btn btn-text troubleshoot-toggle"
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
          >
            {showTroubleshoot ? '收起' : '🔧 连接问题？'}
          </button>

          {showTroubleshoot && (
            <div className="troubleshoot-guide">
              <h3>故障排除指南</h3>
              {TROUBLESHOOT_STEPS.map((step, i) => (
                <div key={i} className="troubleshoot-step">
                  <span className="step-icon">{step.icon}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
              <div className="troubleshoot-links">
                <a href="https://docs.openclaw.ai/gateway/troubleshooting" target="_blank" rel="noopener">
                  📖 完整文档
                </a>
                <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener">
                  💬 社区支持
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
