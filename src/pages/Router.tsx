import { useState } from 'react';
import CostAdvisor from '../components/CostAdvisor';
import ModelRouter from '../components/ModelRouter';
import BudgetSettings from '../components/BudgetSettings';
import CircuitBreaker from '../components/CircuitBreaker';
import type { CostAdvice } from '../components/CostAdvisor';
import type { RoutingRule, FallbackChain } from '../components/ModelRouter';
import type { BudgetData } from '../components/BudgetSettings';
import type { CircuitBreakerData } from '../components/CircuitBreaker';
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

const mockRules: RoutingRule[] = [
  { id: 'r1', condition: '默认', conditionType: 'default', model: 'claude-opus-4', enabled: true },
  { id: 'r2', condition: '会话类型 = cron', conditionType: 'session_type', conditionValue: 'cron', model: 'claude-haiku', enabled: true },
  { id: 'r3', condition: '会话类型 = subagent', conditionType: 'session_type', conditionValue: 'subagent', model: 'claude-sonnet-4', enabled: true },
  { id: 'r4', condition: '时间段 = 22:00-06:00', conditionType: 'time_range', conditionValue: '22:00-06:00', model: 'claude-haiku', enabled: false },
];

const mockFallback: FallbackChain = {
  models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku'],
};

const mockBudget: BudgetData = {
  dailyBudget: 50,
  monthlyBudget: 800,
  todaySpent: 12.58,
  monthSpent: 245.80,
  last7Days: [
    { date: '周一', amount: 15 },
    { date: '周二', amount: 32 },
    { date: '周三', amount: 8 },
    { date: '周四', amount: 22 },
    { date: '周五', amount: 45 },
    { date: '周六', amount: 18 },
    { date: '今天', amount: 13 },
  ],
};

const mockCircuitBreaker: CircuitBreakerData = {
  currentUsagePercent: 25,
  activeLayer: 'normal',
  warningThreshold: 70,
  degradeThreshold: 90,
  tripThreshold: 100,
  pausedSessions: 0,
};

export default function Router() {
  const [advices] = useState<CostAdvice[]>(mockAdvices);
  const [rules, setRules] = useState<RoutingRule[]>(mockRules);
  const [fallbackChain] = useState<FallbackChain>(mockFallback);
  const [budgetData] = useState<BudgetData>(mockBudget);
  const [circuitData] = useState<CircuitBreakerData>(mockCircuitBreaker);

  return (
    <div className="page router-page">
      <h1 className="page-title">⚡ 路由</h1>
      <p className="page-subtitle">模型路由与成本优化</p>

      {/* 成本顾问 */}
      <CostAdvisor
        advices={advices}
        onApply={(id) => console.log('Applied advice:', id)}
      />

      {/* 模型路由 */}
      <ModelRouter
        rules={rules}
        fallbackChain={fallbackChain}
        onRuleToggle={(id) => setRules(r => r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))}
        onRuleDelete={(id) => setRules(r => r.filter(rule => rule.id !== id))}
        onRuleAdd={(rule) => setRules(r => [...r, { ...rule, id: `r${Date.now()}` }])}
      />

      {/* 预算设置 */}
      <BudgetSettings
        data={budgetData}
        onDailyBudgetChange={(v) => console.log('Daily budget:', v)}
        onMonthlyBudgetChange={(v) => console.log('Monthly budget:', v)}
      />

      {/* 熔断器 */}
      <CircuitBreaker
        data={circuitData}
        onThresholdChange={(layer, v) => console.log('Threshold:', layer, v)}
        onReset={() => console.log('Circuit breaker reset')}
      />
    </div>
  );
}
