import { useState } from 'react';
import './ContextBar.css';

interface ContextBarProps {
  tokenUsage: number; // 0-100 percentage
  tokenCount?: number;
  maxTokens?: number;
  onCompact?: () => Promise<void> | void;
}

export default function ContextBar({ tokenUsage, tokenCount, maxTokens, onCompact }: ContextBarProps) {
  const [compactState, setCompactState] = useState<'idle' | 'compacting' | 'done'>('idle');

  const isWarning = tokenUsage >= 70;
  const isDanger = tokenUsage >= 90;
  const showWarningBar = tokenUsage >= 80; // 任务 3.3: softThreshold 80%

  const barColor = isDanger ? '#ef4444' : isWarning ? '#eab308' : '#22c55e';
  const label = compactState === 'done'
    ? '✅ 已压缩'
    : isDanger
      ? '上下文即将满载！建议立即压缩'
      : isWarning
        ? `上下文使用 ${tokenUsage}% · 建议压缩`
        : '上下文正常';

  const handleCompact = async () => {
    if (!onCompact || compactState === 'compacting') return;
    setCompactState('compacting');
    try {
      await onCompact();
      setCompactState('done');
      // Reset after 5 seconds
      setTimeout(() => setCompactState('idle'), 5000);
    } catch {
      setCompactState('idle');
    }
  };

  return (
    <div className={`context-bar ${compactState === 'done' ? 'compacted' : isDanger ? 'danger' : showWarningBar ? 'warning' : ''}`}>
      <div className="context-info">
        <span className="context-label">{label}</span>
        <span className="context-usage" style={{ color: compactState === 'done' ? '#22c55e' : barColor }}>
          {tokenUsage}%
          {tokenCount != null && maxTokens != null && (
            <span className="context-detail"> ({Math.round(tokenCount / 1000)}K / {Math.round(maxTokens / 1000)}K)</span>
          )}
        </span>
      </div>
      <div className="context-progress">
        <div className="context-fill" style={{ width: `${tokenUsage}%`, background: compactState === 'done' ? '#22c55e' : barColor }} />
      </div>
      {showWarningBar && onCompact && compactState !== 'done' && (
        <button className="compact-btn" onClick={handleCompact} disabled={compactState === 'compacting'}>
          {compactState === 'compacting' ? '⏳ 压缩中...' : '🗜️ 压缩会话'}
        </button>
      )}
    </div>
  );
}
