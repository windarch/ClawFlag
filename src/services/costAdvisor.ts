/**
 * Cost Advisor Engine
 * 分析历史成本数据，生成优化建议
 */

import type { DailyCostSummary } from './costTracker';
import type { CostAdvice } from '../components/CostAdvisor';
import { USD_CNY_RATE, DOWNGRADE_PATH } from '../config/modelPricing';

export interface HistoricalData {
  sessions: Array<{
    key: string;
    label: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    kind: string;
  }>;
  cronJobs: Array<{
    id: string;
    name: string;
    schedule: string;
    model: string;
    avgTokens: number;
    monthlyRuns: number;
  }>;
  heartbeatStats?: {
    intervalMin: number;
    okPercent: number;
    avgTokens: number;
    monthlyRuns: number;
  };
}

export function generateAdvices(
  todaySummary: DailyCostSummary,
  historical?: HistoricalData,
): CostAdvice[] {
  const advices: CostAdvice[] = [];
  let adviceId = 0;

  // 1. Model mix optimization
  const opusEntry = todaySummary.byModel.get('Claude Opus');
  const totalCost = todaySummary.totalCostCNY;
  if (opusEntry && totalCost > 0 && opusEntry.costCNY / totalCost > 0.6) {
    const savingsPerMonth = opusEntry.costCNY * 0.8 * 30; // Sonnet is ~80% cheaper
    advices.push({
      id: `adv-${adviceId++}`,
      title: '模型使用比例优化',
      description: `Opus 占今日开销 ${((opusEntry.costCNY / totalCost) * 100).toFixed(0)}%。将非关键任务切换到 Sonnet 可大幅降低成本`,
      savings: `¥${savingsPerMonth.toFixed(0)}/月`,
      actionLabel: '优化路由',
    });
  }

  // 2. Cron job model suggestions
  if (historical?.cronJobs) {
    for (const job of historical.cronJobs) {
      const model = job.model.toLowerCase();
      if (model.includes('opus') && job.monthlyRuns > 20) {
        const opusCost = (job.avgTokens / 1_000_000) * 75 * USD_CNY_RATE * job.monthlyRuns;
        const sonnetCost = (job.avgTokens / 1_000_000) * 15 * USD_CNY_RATE * job.monthlyRuns;
        const savings = opusCost - sonnetCost;
        if (savings > 1) {
          advices.push({
            id: `adv-${adviceId++}`,
            title: `cron「${job.name}」模型降级`,
            description: `cron 任务「${job.name}」用 Opus，换 Sonnet 可省 ¥${savings.toFixed(0)}/月`,
            savings: `¥${savings.toFixed(0)}/月`,
            actionLabel: '切换模型',
          });
        }
      }
    }
  }

  // 3. Heartbeat optimization
  if (historical?.heartbeatStats) {
    const hb = historical.heartbeatStats;
    if (hb.okPercent > 85 && hb.intervalMin <= 60) {
      const currentMonthlyCost = (hb.avgTokens / 1_000_000) * 15 * USD_CNY_RATE * hb.monthlyRuns;
      const optimizedRuns = hb.monthlyRuns * (30 / (120 / hb.intervalMin));
      const optimizedCost = (hb.avgTokens / 1_000_000) * 15 * USD_CNY_RATE * optimizedRuns;
      const savings = currentMonthlyCost - optimizedCost;
      if (savings > 0.5) {
        advices.push({
          id: `adv-${adviceId++}`,
          title: '心跳频率优化',
          description: `心跳 ${hb.intervalMin}min 一次，${hb.okPercent.toFixed(0)}% 返回 OK，改 2h 可省 ¥${savings.toFixed(0)}/月`,
          savings: `¥${savings.toFixed(0)}/月`,
          actionLabel: '调整频率',
        });
      }
    }
  }

  // 4. Anomaly detection - sessions with abnormally high token usage
  if (historical?.sessions && historical.sessions.length > 2) {
    const costs = historical.sessions.map(s => s.cost).filter(c => c > 0);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    for (const s of historical.sessions) {
      if (s.cost > avgCost * 3 && s.cost > 1) {
        advices.push({
          id: `adv-${adviceId++}`,
          title: '异常会话检测',
          description: `会话「${s.label}」消耗 ${(s.cost / avgCost).toFixed(1)} 倍平均 token，可能有问题`,
          savings: '',
          actionLabel: '查看详情',
        });
      }
    }
  }

  // 5. Cost trend warning
  if (totalCost > 0) {
    const projectedDaily = totalCost;
    const projectedMonthly = projectedDaily * 30;
    if (projectedMonthly > 500) {
      advices.push({
        id: `adv-${adviceId++}`,
        title: '月度成本预测',
        description: `按今日速率，预计月成本 ¥${projectedMonthly.toFixed(0)}，建议关注`,
        savings: '',
        actionLabel: '查看趋势',
      });
    }
  }

  // Default healthy message
  if (advices.length === 0) {
    advices.push({
      id: 'healthy',
      title: '成本健康',
      description: '当前成本在合理范围内，暂无优化建议',
      savings: '',
      actionLabel: '查看',
    });
  }

  return advices;
}

/** Get downgrade target model */
export function getDowngradeModel(currentModel: string): string | null {
  const lower = currentModel.toLowerCase();
  const idx = DOWNGRADE_PATH.findIndex(m => lower.includes(m.replace('claude-', '')));
  if (idx >= 0 && idx < DOWNGRADE_PATH.length - 1) {
    return DOWNGRADE_PATH[idx + 1];
  }
  return null;
}
