/**
 * SecurityBanner - 安全状态横幅
 * 固定在脉搏页顶部，可折叠
 */

import { useState, useMemo } from 'react';
import type { SecurityStatus } from '../hooks/useGatewayData';
import './SecurityBanner.css';

interface SecurityBannerProps {
  security: SecurityStatus;
  onRescan?: () => void;
}

type BannerLevel = 'safe' | 'warn' | 'critical';

export default function SecurityBanner({ security, onRescan }: SecurityBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { level, message, details } = useMemo(() => {
    const fails = security.checks.filter(c => c.status === 'fail');
    const warns = security.checks.filter(c => c.status === 'warn');

    if (fails.length > 0) {
      return {
        level: 'critical' as BannerLevel,
        message: `🔴 ${fails.length} 个严重安全问题需要处理`,
        details: fails.map(f => f.description),
      };
    }
    if (warns.length > 0) {
      return {
        level: 'warn' as BannerLevel,
        message: `🟡 ${warns.length} 个安全建议`,
        details: warns.map(w => w.description),
      };
    }
    return {
      level: 'safe' as BannerLevel,
      message: '🟢 安全检查全部通过',
      details: [],
    };
  }, [security]);

  if (level === 'safe' && collapsed) return null;

  return (
    <div className={`security-banner banner-${level} ${collapsed ? 'collapsed' : ''}`}>
      <div className="banner-main" onClick={() => setCollapsed(!collapsed)}>
        <span className="banner-message">{message}</span>
        <div className="banner-actions">
          {onRescan && (
            <button className="banner-btn" onClick={(e) => { e.stopPropagation(); onRescan(); }} title="重新扫描">
              🔄
            </button>
          )}
          <button className="banner-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      {!collapsed && details.length > 0 && (
        <div className="banner-details">
          {details.map((d, i) => (
            <div key={i} className="banner-detail-item">• {d}</div>
          ))}
        </div>
      )}
    </div>
  );
}
