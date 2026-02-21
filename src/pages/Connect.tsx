/**
 * Gateway 连接配置页面
 * 允许用户输入 Gateway 地址和 Token 进行连接
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGateway } from '../hooks/useGateway';
import type { GatewayConfig, GatewayStatus } from '../types/gateway';
import './Connect.css';

// 默认端口
const DEFAULT_PORT = 18789;

// 状态显示配置
const STATUS_CONFIG: Record<GatewayStatus, { text: string; color: string; icon: string }> = {
  disconnected: { text: '未连接', color: '#6b7280', icon: '○' },
  connecting: { text: '连接中...', color: '#f59e0b', icon: '◐' },
  connected: { text: '已连接', color: '#10b981', icon: '●' },
  error: { text: '连接错误', color: '#ef4444', icon: '✕' },
};

function TroubleshootingGuide({ errorCode }: { errorCode: string }) {
  const [expanded, setExpanded] = useState(false);

  const tips: Record<string, { title: string; steps: string[] }> = {
    TIMEOUT: {
      title: '连接超时',
      steps: [
        '确认 Gateway 正在运行：ssh 到服务器执行 openclaw status',
        '检查 IP 和端口是否正确（默认端口 18789）',
        '如果 Gateway 在远程服务器上，检查防火墙是否放行该端口',
        '使用 Tailscale/WireGuard 等内网穿透工具时，确认隧道已连接',
        '尝试在浏览器中访问 http://host:18789 确认 Gateway 可达',
      ],
    },
    AUTH_FAILED: {
      title: 'Token 无效',
      steps: [
        '在服务器上查看 Token：cat ~/.openclaw/openclaw.json | grep token',
        '确保复制了完整的 Token（包含所有字符）',
        '如果最近重装了 Gateway，Token 可能已更新',
        '检查 Token 前后是否有多余的空格',
      ],
    },
    NETWORK_ERROR: {
      title: '网络错误',
      steps: [
        '检查手机/电脑的网络连接',
        '如果 Gateway 在局域网内，确保你在同一网络下',
        '确认没有使用代理/VPN 阻断了连接',
        '尝试使用 WSS（启用安全连接）',
      ],
    },
  };

  const guide = tips[errorCode] || tips['NETWORK_ERROR'];

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', color: 'var(--color-accent, #e94560)',
          fontSize: '0.8rem', cursor: 'pointer', padding: 0, textDecoration: 'underline',
        }}
      >
        {expanded ? '▼' : '▶'} 故障排除指南：{guide.title}
      </button>
      {expanded && (
        <div style={{
          marginTop: '0.5rem', padding: '0.75rem', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        }}>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary, #a0a0a0)' }}>
            {guide.steps.map((step, i) => (
              <li key={i} style={{ marginBottom: '0.4rem', lineHeight: 1.5 }}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Connect() {
  const navigate = useNavigate();
  const { 
    status, 
    error, 
    isConnected, 
    connect, 
    loadStoredConfig,
    systemInfo,
  } = useGateway();

  // 表单状态
  const [host, setHost] = useState('');
  const [port, setPort] = useState(DEFAULT_PORT.toString());
  const [token, setToken] = useState('');
  const [useSecure, setUseSecure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载存储的配置
  useEffect(() => {
    const stored = loadStoredConfig();
    if (stored) {
      setHost(stored.host);
      setPort(stored.port.toString());
      setToken(stored.token);
      setUseSecure(stored.secure);
    }
  }, [loadStoredConfig]);

  // 连接成功后跳转
  useEffect(() => {
    if (isConnected) {
      // 延迟跳转以显示成功状态
      const timer = setTimeout(() => {
        navigate('/');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, navigate]);

  // 处理地址输入（支持 host:port 格式）
  const handleHostChange = (value: string) => {
    // 检查是否包含端口
    if (value.includes(':')) {
      const [hostPart, portPart] = value.split(':');
      setHost(hostPart);
      if (portPart && /^\d+$/.test(portPart)) {
        setPort(portPart);
      }
    } else {
      setHost(value);
    }
  };

  // 验证表单
  const isFormValid = (): boolean => {
    if (!host.trim()) return false;
    if (!token.trim()) return false;
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) return false;
    return true;
  };

  // 提交连接
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid() || isSubmitting) return;

    setIsSubmitting(true);

    const config: GatewayConfig = {
      host: host.trim(),
      port: parseInt(port),
      token: token.trim(),
      secure: useSecure,
    };

    try {
      await connect(config);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="connect-page">
      <div className="connect-container">
        {/* Logo 和标题 */}
        <header className="connect-header">
          <div className="logo">🚩</div>
          <h1>ClawFlag</h1>
          <p className="tagline">洞察你的 AI，掌控于指尖</p>
        </header>

        {/* 连接状态 */}
        <div className="status-badge" style={{ color: statusConfig.color }}>
          <span className="status-icon">{statusConfig.icon}</span>
          <span className="status-text">{statusConfig.text}</span>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <div className="error-details">
              <span>{error.message}</span>
              {error.code === 'TIMEOUT' && (
                <small className="error-hint">请检查 Gateway 地址是否正确，以及 Gateway 是否正在运行</small>
              )}
              {error.code === 'AUTH_FAILED' && (
                <small className="error-hint">Token 无效或已过期，请重新输入</small>
              )}
              {error.code === 'NETWORK_ERROR' && (
                <small className="error-hint">网络连接失败，请检查你的网络设置或防火墙规则</small>
              )}
            </div>
          </div>
        )}

        {/* 系统信息（连接成功后显示） */}
        {isConnected && systemInfo && (
          <>
            <div className="success-info">
              <span className="success-icon">✓</span>
              <span>
                Gateway 版本: {systemInfo.version || systemInfo.gateway_version || '未知'}
              </span>
            </div>
            {/* 版本警告 */}
            {(() => {
              const ver = systemInfo.version || systemInfo.gateway_version || '';
              const clean = ver.replace(/-.*$/, '');
              const parts = clean.split('.').map(Number);
              const isOld = parts[0] < 2026 || (parts[0] === 2026 && parts[1] < 2 && (parts[1] < 1 || parts[2] < 30));
              return isOld ? (
                <div className="error-message" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  <span className="error-icon">🚨</span>
                  <div className="error-details">
                    <span>你的 Gateway 存在已知安全漏洞 (CVE-2026-25253)</span>
                    <small className="error-hint">
                      请升级到 2026.1.30+ 以修补远程代码执行漏洞。
                      <a href="https://docs.openclaw.ai/changelog" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', marginLeft: '4px' }}>
                        查看升级指南 →
                      </a>
                    </small>
                  </div>
                </div>
              ) : null;
            })()}
          </>
        )}

        {/* 连接表单 */}
        <form className="connect-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="host">Gateway 地址</label>
            <input
              id="host"
              type="text"
              value={host}
              onChange={(e) => handleHostChange(e.target.value)}
              placeholder="例如: 192.168.1.100 或 my-server.local"
              disabled={status === 'connecting'}
              autoComplete="off"
              autoCapitalize="off"
            />
            <small className="form-hint">
              支持 IP 地址或域名，可直接输入 host:port 格式
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="port">端口</label>
            <input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder={DEFAULT_PORT.toString()}
              min="1"
              max="65535"
              disabled={status === 'connecting'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="token">Token</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="粘贴你的 Gateway Token"
              disabled={status === 'connecting'}
              autoComplete="off"
            />
            <small className="form-hint">
              在 Gateway 配置文件中找到你的认证 Token
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useSecure}
                onChange={(e) => setUseSecure(e.target.checked)}
                disabled={status === 'connecting'}
              />
              <span>使用安全连接 (WSS)</span>
            </label>
          </div>

          <button
            type="submit"
            className="connect-button"
            disabled={!isFormValid() || status === 'connecting'}
          >
            {status === 'connecting' ? (
              <>
                <span className="spinner"></span>
                连接中...
              </>
            ) : (
              '连接 Gateway'
            )}
          </button>
        </form>

        {/* 故障排除指南 */}
        {error && <TroubleshootingGuide errorCode={error.code} />}

        {/* 帮助链接 */}
        <footer className="connect-footer">
          <a href="https://docs.clawflag.com/getting-started" target="_blank" rel="noopener noreferrer">
            如何找到 Gateway 地址和 Token？
          </a>
        </footer>
      </div>
    </div>
  );
}
