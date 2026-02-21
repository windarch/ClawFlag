import { useState } from 'react';
import CostAdvisor from '../components/CostAdvisor';
import type { CostAdvice } from '../components/CostAdvisor';
import { useModelRoutes, useCostData } from '../hooks/useGatewayData';
import '../styles/pages.css';

const mockAdvices: CostAdvice[] = [
  {
    id: 'cron-model-downgrade',
    title: '定时任务模型降级',
    description: '你的 cron-daily-news 使用 Opus (每次 ¥6)，历史数据显示 Sonnet 能达到同样质量。',
    savings: '¥175/月',
    actionLabel: '切换到 Sonnet',
  },
  {
    id: 'heartbeat-frequency',
    title: '心跳频率优化',
    description: '心跳每 30 分钟运行一次，但 92% 的时间返回 HEARTBEAT_OK。',
    savings: '¥85/月',
    actionLabel: '改为 2 小时',
  },
];

function BudgetCard({ todayCost, yesterdayCost, dailyBudget, monthlyCost, monthlyBudget }: {
  todayCost: number;
  yesterdayCost: number;
  dailyBudget: number;
  monthlyCost: number;
  monthlyBudget: number;
}) {
  const dailyPercent = Math.min((todayCost / dailyBudget) * 100, 100);
  const monthlyPercent = Math.min((monthlyCost / monthlyBudget) * 100, 100);
  const dailyColor = dailyPercent > 90 ? 'var(--color-status-error)' : dailyPercent > 70 ? 'var(--color-status-warning)' : 'var(--color-status-online)';
  const monthlyColor = monthlyPercent > 90 ? 'var(--color-status-error)' : monthlyPercent > 70 ? 'var(--color-status-warning)' : 'var(--color-status-online)';

  const trend = todayCost > yesterdayCost ? '↑' : todayCost < yesterdayCost ? '↓' : '→';
  const trendColor = todayCost > yesterdayCost ? 'var(--color-status-error)' : 'var(--color-status-online)';

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>💰 预算</h3>
        <span style={{ fontSize: '0.75rem', color: trendColor }}>
          {trend} 较昨日 ${Math.abs(todayCost - yesterdayCost).toFixed(2)}
        </span>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>今日</span>
          <span style={{ color: 'var(--color-text-primary)' }}>${todayCost.toFixed(2)} / ${dailyBudget}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${dailyPercent}%`, background: dailyColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>本月</span>
          <span style={{ color: 'var(--color-text-primary)' }}>${monthlyCost.toFixed(2)} / ${monthlyBudget}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${monthlyPercent}%`, background: monthlyColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
      </div>
    </div>
  );
}

function ModelRoutingTable({ routes, defaultModel, onToggle }: {
  routes: { id: string; pattern: string; model: string; fallback: string | null; enabled: boolean; monthlyCost: number }[];
  defaultModel: string;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>🔀 模型路由</h3>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
        默认模型: <span style={{ color: 'var(--color-accent)' }}>{defaultModel}</span>
      </div>
      {routes.map(route => (
        <div key={route.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.6rem 0', borderBottom: '1px solid var(--color-divider)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: route.enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{route.pattern}</code>
              → {route.model}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {route.fallback && `备用: ${route.fallback} · `}${route.monthlyCost.toFixed(2)}/月
            </div>
          </div>
          <button
            onClick={() => onToggle(route.id)}
            style={{
              background: route.enabled ? 'var(--color-status-online)' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 12, width: 40, height: 22,
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
              background: 'white', transition: 'left 0.2s',
              left: route.enabled ? 20 : 2,
            }} />
          </button>
        </div>
      ))}
    </div>
  );
}

function CircuitBreakerPanel({ breakers }: {
  breakers: { model: string; status: 'closed' | 'open' | 'half-open'; failureRate: number; lastFailure: Date | null }[];
}) {
  const statusEmoji = { closed: '🟢', open: '🔴', 'half-open': '🟡' };
  const statusLabel = { closed: '正常', open: '熔断', 'half-open': '恢复中' };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>⚡ 熔断器</h3>
      {breakers.map(b => (
        <div key={b.model} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0', borderBottom: '1px solid var(--color-divider)',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              {statusEmoji[b.status]} {b.model}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              失败率 {b.failureRate}%
              {b.lastFailure && ` · 上次失败 ${formatTimeAgo(b.lastFailure)}`}
            </div>
          </div>
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8,
            background: b.status === 'closed' ? 'rgba(34,197,94,0.15)' : b.status === 'open' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            color: b.status === 'closed' ? 'var(--color-status-online)' : b.status === 'open' ? 'var(--color-status-error)' : 'var(--color-status-warning)',
          }}>
            {statusLabel[b.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

function CostBreakdownChart({ breakdown }: { breakdown: { model: string; cost: number; percent: number }[] }) {
  const colors = ['var(--color-accent)', 'var(--color-status-info)', 'var(--color-status-warning)', 'var(--color-status-online)'];

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>📊 成本分布</h3>
      {/* Bar chart */}
      <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', marginBottom: '0.75rem' }}>
        {breakdown.map((item, i) => (
          <div key={item.model} style={{
            width: `${item.percent}%`, height: '100%',
            background: colors[i % colors.length],
          }} />
        ))}
      </div>
      {/* Legend */}
      {breakdown.map((item, i) => (
        <div key={item.model} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.8rem', padding: '0.25rem 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length] }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{item.model}</span>
          </div>
          <span style={{ color: 'var(--color-text-primary)' }}>${item.cost.toFixed(2)} ({item.percent}%)</span>
        </div>
      ))}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export default function Router() {
  const [advices] = useState<CostAdvice[]>(mockAdvices);
  const { routeData, toggleRoute } = useModelRoutes();
  const { cost } = useCostData();

  return (
    <div className="page router-page">
      <h1 className="page-title">⚡ 路由</h1>
      <p className="page-subtitle">模型路由与成本优化</p>

      <BudgetCard
        todayCost={cost.todayCost}
        yesterdayCost={cost.yesterdayCost}
        dailyBudget={cost.dailyBudget}
        monthlyCost={cost.monthlyCost}
        monthlyBudget={cost.monthlyBudget}
      />

      <CostBreakdownChart breakdown={cost.breakdown} />

      <ModelRoutingTable
        routes={routeData.routes}
        defaultModel={routeData.defaultModel}
        onToggle={toggleRoute}
      />

      <CircuitBreakerPanel breakers={routeData.circuitBreakers} />

      <CostAdvisor
        advices={advices}
        onApply={(id) => console.log('Applied advice:', id)}
      />
    </div>
  );
}
