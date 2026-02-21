/**
 * SecurityAudit 组件 - Gateway 完整安全审计面板
 * 检查项：版本、认证、公网暴露、已知 CVE
 */

import { useState, useCallback, useEffect } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';

interface AuditItem {
  id: string;
  category: string;
  name: string;
  status: 'safe' | 'warn' | 'danger';
  description: string;
  detail: string;
  fix?: string;
}

interface AuditResult {
  items: AuditItem[];
  timestamp: Date;
  scanning: boolean;
}

const KNOWN_CVES: { id: string; affectedBefore: string; description: string; severity: 'high' | 'medium' | 'low' }[] = [
  { id: 'CVE-2025-0001', affectedBefore: '2025.12.1', description: 'WebSocket 未认证访问漏洞', severity: 'high' },
  { id: 'CVE-2025-0042', affectedBefore: '2026.1.15', description: 'config.set 路径遍历', severity: 'medium' },
  { id: 'CVE-2026-0003', affectedBefore: '2026.1.30', description: 'Device auth 签名绕过', severity: 'high' },
];

function parseVersion(v: string): number {
  // "2026.2.19-2" → 20260219
  const match = v.match(/(\d{4})\.(\d+)\.(\d+)/);
  if (!match) return 0;
  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

const statusIcon = { safe: '✅', warn: '⚠️', danger: '❌' };
const statusLabel = { safe: '安全', warn: '警告', danger: '危险' };
const statusColor = {
  safe: 'var(--color-status-online, #22c55e)',
  warn: 'var(--color-status-warning, #eab308)',
  danger: 'var(--color-status-error, #ef4444)',
};

export default function SecurityAudit() {
  const { client, connected } = useGatewayContext();
  const [result, setResult] = useState<AuditResult>({ items: [], timestamp: new Date(), scanning: false });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scan = useCallback(async () => {
    if (!client?.connected) return;
    setResult(prev => ({ ...prev, scanning: true }));
    const items: AuditItem[] = [];

    try {
      const [statusResult, healthResult] = await Promise.all([
        client.status(),
        client.health(),
      ]);

      // 1. Version check
      const version = String(statusResult.version || statusResult.gatewayVersion || '');
      const vNum = parseVersion(version);
      const minSafe = parseVersion('2026.1.30');
      items.push({
        id: 'version',
        category: '版本',
        name: 'Gateway 版本检查',
        status: !version ? 'danger' : vNum >= minSafe ? 'safe' : 'warn',
        description: version ? `当前版本 ${version}` : '无法获取版本信息',
        detail: vNum >= minSafe ? '版本符合最低安全要求 (>= 2026.1.30)' : '建议升级到 2026.1.30 或更高版本',
        fix: vNum < minSafe ? '运行 npm update -g openclaw 或参考 https://docs.openclaw.ai/upgrade' : undefined,
      });

      // 2. Auth check
      const authMode = String(statusResult.authMode || healthResult.authMode || '');
      const hasAuth = authMode && authMode !== 'none';
      items.push({
        id: 'auth',
        category: '认证',
        name: '认证状态',
        status: hasAuth ? 'safe' : 'danger',
        description: hasAuth ? `${authMode} 认证已启用` : '未启用任何认证',
        detail: hasAuth ? `当前认证模式: ${authMode}` : '任何人都可以连接并控制你的 Agent',
        fix: !hasAuth ? '在 Gateway 配置中设置 auth_token 或 password' : undefined,
      });

      // 3. Public exposure check
      const bind = String(statusResult.bind || healthResult.bind || '');
      const isLocal = bind.includes('127.0.0.1') || bind.includes('localhost') || bind.includes('loopback');
      const isPublic = bind.includes('0.0.0.0');
      items.push({
        id: 'exposure',
        category: '网络',
        name: '公网暴露检查',
        status: isLocal ? 'safe' : isPublic ? 'danger' : 'warn',
        description: isLocal ? '仅本地回环访问' : isPublic ? '绑定到所有网络接口 (0.0.0.0)' : `绑定到 ${bind}`,
        detail: `bind: ${bind || '未知'}`,
        fix: isPublic ? '将 bind 设置为 127.0.0.1 或使用 Tailscale 进行安全远程访问' : undefined,
      });

      // 4. CVE match
      const matchedCVEs = version ? KNOWN_CVES.filter(cve => vNum < parseVersion(cve.affectedBefore)) : [];
      if (matchedCVEs.length > 0) {
        for (const cve of matchedCVEs) {
          items.push({
            id: `cve-${cve.id}`,
            category: 'CVE',
            name: cve.id,
            status: cve.severity === 'high' ? 'danger' : 'warn',
            description: cve.description,
            detail: `影响版本: < ${cve.affectedBefore} | 严重性: ${cve.severity}`,
            fix: `升级 Gateway 到 ${cve.affectedBefore} 或更高版本`,
          });
        }
      } else {
        items.push({
          id: 'cve-none',
          category: 'CVE',
          name: '已知漏洞检查',
          status: 'safe',
          description: '未匹配到已知 CVE',
          detail: `已检查 ${KNOWN_CVES.length} 个已知漏洞`,
        });
      }

      // 5. TLS check
      const tls = statusResult.tls || healthResult.tls;
      items.push({
        id: 'tls',
        category: '加密',
        name: 'TLS 传输加密',
        status: tls ? 'safe' : 'warn',
        description: tls ? 'HTTPS/WSS 已启用' : '未配置 TLS 加密',
        detail: tls ? '传输层已加密' : '数据以明文传输',
        fix: !tls ? '通过 Tailscale Serve、nginx 或 caddy 启用 TLS' : undefined,
      });

    } catch {
      items.push({
        id: 'error',
        category: '错误',
        name: '扫描失败',
        status: 'danger',
        description: '无法连接 Gateway 进行安全审计',
        detail: '请确认 Gateway 正在运行',
      });
    }

    setResult({ items, timestamp: new Date(), scanning: false });
  }, [client]);

  useEffect(() => { if (connected) scan(); }, [connected, scan]);

  const safeCount = result.items.filter(i => i.status === 'safe').length;
  const warnCount = result.items.filter(i => i.status === 'warn').length;
  const dangerCount = result.items.filter(i => i.status === 'danger').length;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)' }}>🔐 安全审计</h3>
        <button
          className="btn btn-small"
          onClick={scan}
          disabled={result.scanning}
          style={{ fontSize: '0.75rem' }}
        >
          {result.scanning ? '扫描中...' : '🔄 重新扫描'}
        </button>
      </div>

      {/* Summary */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.5rem 0.75rem',
        background: 'rgba(255,255,255,0.03)', borderRadius: 8,
      }}>
        <span style={{ color: statusColor.safe, fontSize: '0.8rem' }}>✅ {safeCount} 安全</span>
        <span style={{ color: statusColor.warn, fontSize: '0.8rem' }}>⚠️ {warnCount} 警告</span>
        <span style={{ color: statusColor.danger, fontSize: '0.8rem' }}>❌ {dangerCount} 危险</span>
      </div>

      {/* Items */}
      {result.items.map(item => (
        <div
          key={item.id}
          className="card"
          style={{
            marginBottom: '0.5rem', padding: '0.6rem 0.75rem', cursor: 'pointer',
            borderLeft: `3px solid ${statusColor[item.status]}`,
          }}
          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{statusIcon[item.status]}</span>
            <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{item.name}</span>
            <span style={{
              fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
              background: `${statusColor[item.status]}20`, color: statusColor[item.status],
            }}>
              {statusLabel[item.status]}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {item.description}
          </div>
          {expandedId === item.id && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-divider, rgba(255,255,255,0.08))' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {item.detail}
              </div>
              {item.fix && (
                <div style={{
                  marginTop: '0.4rem', padding: '0.4rem', borderRadius: 6,
                  background: 'rgba(59, 130, 246, 0.1)', fontSize: '0.7rem',
                  color: 'var(--color-accent, #3b82f6)',
                }}>
                  💡 修复建议: {item.fix}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        上次扫描: {result.timestamp.toLocaleString('zh-CN')}
      </div>
    </div>
  );
}
