/**
 * SecurityCheck 组件
 * 显示安全检查结果，支持展开详情和重新扫描
 */

import { useState } from 'react';
import './SecurityCheck.css';

type SecurityLevel = 'pass' | 'warn' | 'fail';

interface CheckItem {
  id: string;
  name: string;
  level: SecurityLevel;
  message: string;
  detail?: string;
  fixUrl?: string;
}

interface SecurityCheckResult {
  overallScore: number;
  checks: CheckItem[];
  timestamp: number;
}

interface SecurityCheckProps {
  result: SecurityCheckResult;
  onRescan?: () => void;
  loading?: boolean;
}

const levelIcon: Record<SecurityLevel, string> = {
  pass: '✅',
  warn: '⚠️',
  fail: '🚨',
};

const levelLabel: Record<SecurityLevel, string> = {
  pass: '通过',
  warn: '需注意',
  fail: '严重',
};

export default function SecurityCheck({ result, onRescan, loading }: SecurityCheckProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { overallScore, checks, timestamp } = result;
  const hasFail = checks.some(c => c.level === 'fail');
  const hasWarn = checks.some(c => c.level === 'warn');

  const overallClass = hasFail ? 'overall-critical' : hasWarn ? 'overall-warning' : 'overall-pass';
  const scoreColor = overallScore >= 80 ? 'var(--color-green)' : overallScore >= 60 ? 'var(--color-yellow)' : 'var(--color-red)';

  return (
    <div className={`security-check ${overallClass}`}>
      {/* Header */}
      <div className="security-header">
        <div className="security-score" style={{ '--score-color': scoreColor } as React.CSSProperties}>
          <span className="score-value">{overallScore}</span>
          <span className="score-label">安全分</span>
        </div>
        <div className="security-summary">
          <span className="summary-pass">{checks.filter(c => c.level === 'pass').length} 通过</span>
          <span className="summary-warn">{checks.filter(c => c.level === 'warn').length} 警告</span>
          <span className="summary-fail">{checks.filter(c => c.level === 'fail').length} 严重</span>
        </div>
        {onRescan && (
          <button className="btn btn-small" onClick={onRescan} disabled={loading}>
            {loading ? '扫描中...' : '🔄 重新扫描'}
          </button>
        )}
      </div>

      {/* Check Items */}
      <div className="security-items">
        {checks.map(item => (
          <div
            key={item.id}
            className={`security-item level-${item.level} ${expandedId === item.id ? 'expanded' : ''}`}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="item-header">
              <span className="item-icon">{levelIcon[item.level]}</span>
              <span className="item-name">{item.name}</span>
              <span className={`item-badge ${item.level}`}>{levelLabel[item.level]}</span>
            </div>
            <div className="item-message">{item.message}</div>
            {expandedId === item.id && item.detail && (
              <div className="item-detail">
                <pre>{item.detail}</pre>
                {item.fixUrl && (
                  <a href={item.fixUrl} target="_blank" rel="noopener" className="fix-link">
                    📖 修复指南
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <div className="security-footer">
        <span>上次扫描: {new Date(timestamp).toLocaleString('zh-CN')}</span>
      </div>
    </div>
  );
}
