import './ContextBar.css';

interface ContextBarProps {
  tokenUsage: number; // 0-100 percentage
  tokenCount?: number;
  maxTokens?: number;
  onCompact?: () => void;
}

export default function ContextBar({ tokenUsage, tokenCount, maxTokens, onCompact }: ContextBarProps) {
  const isWarning = tokenUsage >= 70;
  const isDanger = tokenUsage >= 90;

  const barColor = isDanger ? '#ef4444' : isWarning ? '#eab308' : '#22c55e';
  const label = isDanger
    ? '上下文即将满载！建议立即压缩'
    : isWarning
      ? '上下文使用率较高'
      : '上下文正常';

  return (
    <div className={`context-bar ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
      <div className="context-info">
        <span className="context-label">{label}</span>
        <span className="context-usage" style={{ color: barColor }}>
          {tokenUsage}%
          {tokenCount && maxTokens && (
            <span className="context-detail"> ({Math.round(tokenCount / 1000)}K / {Math.round(maxTokens / 1000)}K)</span>
          )}
        </span>
      </div>
      <div className="context-progress">
        <div className="context-fill" style={{ width: `${tokenUsage}%`, background: barColor }} />
      </div>
      {isWarning && onCompact && (
        <button className="compact-btn" onClick={onCompact}>
          🗜️ 压缩会话
        </button>
      )}
    </div>
  );
}
