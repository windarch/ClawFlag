import { useState } from 'react';
import type { SecurityCheckResult, SecurityLevel } from '../types/security';
import './SecurityCheck.css';

interface SecurityCheckProps {
  result: SecurityCheckResult;
  onRecheck?: () => void;
}

const levelIcon: Record<SecurityLevel, string> = {
  pass: '✅',
  warning: '⚠️',
  critical: '🚨',
};

const levelLabel: Record<SecurityLevel, string> = {
  pass: '通过',
  warning: '需注意',
  critical: '严重',
};

export default function SecurityCheck({ result, onRecheck }: SecurityCheckProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { summary, items } = result;
  const hasCritical = summary.critical > 0;
  const hasWarning = summary.warning > 0;

  const overallClass = hasCritical
    ? 'overall-critical'
    : hasWarning
      ? 'overall-warning'
      : 'overall-pass';

  const overallText = hasCritical
    ? '发现安全风险'
    : hasWarning
      ? '部分需改进'
      : '全部通过';

  const overallIcon = hasCritical ? '🛡️🚨' : hasWarning ? '🛡️⚠️' : '🛡️✅';

  return (
    <div className="security-check">
      {/* 汇总横幅 */}
      <div className={`security-summary ${overallClass}`}>
        <div className="summary-left">
          <span className="summary-icon">{overallIcon}</span>
          <div className="summary-text">
            <div className="summary-title">Gateway 安全检查</div>
            <div className="summary-status">{overallText}</div>
          </div>
        </div>
        <div className="summary-counts">
          {summary.pass > 0 && (
            <span className="count-badge count-pass">{summary.pass} 通过</span>
          )}
          {summary.warning > 0 && (
            <span className="count-badge count-warning">{summary.warning} 注意</span>
          )}
          {summary.critical > 0 && (
            <span className="count-badge count-critical">{summary.critical} 严重</span>
          )}
        </div>
      </div>

      {/* 检查项列表 */}
      <div className="check-items">
        {items.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`check-item check-${item.level} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <div className="check-header">
                <span className="check-icon">{levelIcon[item.level]}</span>
                <div className="check-info">
                  <div className="check-title">{item.title}</div>
                  <div className="check-description">{item.description}</div>
                </div>
                <span className={`check-badge badge-${item.level}`}>
                  {levelLabel[item.level]}
                </span>
              </div>
              {isExpanded && item.fix && (
                <div className="check-fix">
                  <div className="fix-label">💡 修复建议</div>
                  <div className="fix-text">{item.fix}</div>
                  {item.fixUrl && (
                    <a
                      className="fix-link"
                      href={item.fixUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      查看指南 →
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 重新检查按钮 */}
      {onRecheck && (
        <button className="recheck-btn" onClick={onRecheck}>
          🔄 重新检查
        </button>
      )}
    </div>
  );
}
