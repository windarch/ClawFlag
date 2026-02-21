/**
 * ContextMeter - 上下文窗口环形计量器
 * 显示当前上下文使用百分比，颜色随使用率变化
 */

import './ContextMeter.css';

interface ContextMeterProps {
  usedTokens: number;
  totalTokens: number;
}

export default function ContextMeter({ usedTokens, totalTokens }: ContextMeterProps) {
  const percent = totalTokens > 0 ? Math.min((usedTokens / totalTokens) * 100, 100) : 0;
  const color = percent >= 80 ? 'var(--color-status-error)' :
    percent >= 60 ? 'var(--color-status-warning)' : 'var(--color-status-online)';

  // SVG ring params
  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  const formatTokens = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1000).toFixed(0)}K`;

  return (
    <div className="context-meter">
      <svg width={90} height={90} viewBox="0 0 90 90">
        {/* Background ring */}
        <circle cx={45} cy={45} r={radius} fill="none"
          stroke="var(--color-bg-tertiary)" strokeWidth={stroke} />
        {/* Progress ring */}
        <circle cx={45} cy={45} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }} />
        {/* Center text */}
        <text x={45} y={42} textAnchor="middle" fill="var(--color-text-primary)"
          fontSize={16} fontWeight={700}>{Math.round(percent)}%</text>
        <text x={45} y={56} textAnchor="middle" fill="var(--color-text-secondary)"
          fontSize={9}>context</text>
      </svg>
      <div className="context-meter-detail">
        <span className="meter-used">{formatTokens(usedTokens)}</span>
        <span className="meter-sep">/</span>
        <span className="meter-total">{formatTokens(totalTokens)}</span>
      </div>
    </div>
  );
}
