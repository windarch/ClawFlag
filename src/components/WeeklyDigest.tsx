/**
 * Agent 每周文摘
 * 自动生成的每周摘要：任务/开销/趋势/安全事件/模型分布
 */

import { useState } from 'react';

export interface DigestData {
  weekLabel: string; // e.g. "2月17日 - 2月23日"
  tasksCompleted: number;
  totalCost: number;
  costTrend: number; // percentage change vs last week
  securityEvents: number;
  modelUsage: { model: string; percent: number; cost: number }[];
  highlights: string[];
}

const MOCK_DIGEST: DigestData = {
  weekLabel: '2月17日 - 2月23日',
  tasksCompleted: 47,
  totalCost: 85.20,
  costTrend: -12.5,
  securityEvents: 1,
  modelUsage: [
    { model: 'claude-opus-4', percent: 62, cost: 52.82 },
    { model: 'claude-sonnet-4', percent: 28, cost: 23.86 },
    { model: 'claude-haiku-3.5', percent: 10, cost: 8.52 },
  ],
  highlights: [
    'ClawFlag Phase 1-3 开发完成',
    'AIMCN 服务器端部署',
    '升级事故后恢复',
  ],
};

export default function WeeklyDigest() {
  const [digest] = useState<DigestData>(MOCK_DIGEST);
  const [expanded, setExpanded] = useState(false);

  const trendColor = digest.costTrend < 0 ? 'var(--color-status-online)' : 'var(--color-status-error)';
  const trendArrow = digest.costTrend < 0 ? '↓' : '↑';

  const colors = ['var(--color-accent)', 'var(--color-status-info)', 'var(--color-status-warning)'];

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', margin: 0 }}>📰 每周文摘</h3>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {digest.weekLabel}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            ${digest.totalCost.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.7rem', color: trendColor }}>
            {trendArrow} {Math.abs(digest.costTrend)}%
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-divider)', paddingTop: '0.75rem' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[
              { label: '完成任务', value: `${digest.tasksCompleted}` },
              { label: '成本变化', value: `${trendArrow}${Math.abs(digest.costTrend)}%`, color: trendColor },
              { label: '安全事件', value: `${digest.securityEvents}`, color: digest.securityEvents > 0 ? 'var(--color-status-warning)' : undefined },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: s.color || 'var(--color-text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Model usage */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>模型分布</div>
            <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', marginBottom: '0.5rem' }}>
              {digest.modelUsage.map((m, i) => (
                <div key={m.model} style={{ width: `${m.percent}%`, height: '100%', background: colors[i % colors.length] }} />
              ))}
            </div>
            {digest.modelUsage.map((m, i) => (
              <div key={m.model} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', padding: '0.1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: colors[i % colors.length] }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{m.model}</span>
                </div>
                <span style={{ color: 'var(--color-text-muted)' }}>${m.cost.toFixed(2)} ({m.percent}%)</span>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>本周亮点</div>
            {digest.highlights.map((h, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '0.15rem 0' }}>
                ✨ {h}
              </div>
            ))}
          </div>

          {/* Share button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `ClawFlag 每周文摘 - ${digest.weekLabel}`,
                  text: `${digest.tasksCompleted} 个任务 | $${digest.totalCost.toFixed(2)} | ${digest.modelUsage[0]?.model}`,
                });
              }
            }}
            style={{
              marginTop: '0.75rem', width: '100%', padding: '0.5rem',
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
              color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            📤 分享文摘
          </button>
        </div>
      )}
    </div>
  );
}
