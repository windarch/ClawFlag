/**
 * Router 页面 - 模型路由 + 成本管理
 */

import { useState, useCallback } from 'react';
import CostAdvisor from '../components/CostAdvisor';
import type { CostAdvice } from '../components/CostAdvisor';
import CostFuse from '../components/CostFuse';
import { useModelRoutes, useCostData, useCronJobs } from '../hooks/useGatewayData';
import { useCostContext } from '../contexts/CostContext';
import EmptyState from '../components/EmptyState';
import '../styles/pages.css';

type RouterTab = 'routes' | 'cost' | 'budget';

function generateAdvices(cost: ReturnType<typeof useCostData>['cost']): CostAdvice[] {
  const advices: CostAdvice[] = [];
  const opusUsage = cost.breakdown.find(b => b.model.includes('opus'));
  if (opusUsage && opusUsage.percent > 60) {
    advices.push({
      id: 'model-mix',
      title: '模型使用比例优化',
      description: `Opus 占用 ${opusUsage.percent.toFixed(0)}% 的开销。将部分任务切换到 Sonnet 可降低成本`,
      savings: `¥${(opusUsage.cost * 0.3).toFixed(0)}/月`,
      actionLabel: '优化路由',
    });
  }
  if (cost.trend === 'up' && cost.trendPercent > 30) {
    advices.push({
      id: 'cost-trend',
      title: '成本增长趋势',
      description: `今日成本较昨日增长 ${cost.trendPercent.toFixed(0)}%`,
      savings: '',
      actionLabel: '查看详情',
    });
  }
  if (advices.length === 0) {
    advices.push({ id: 'healthy', title: '成本健康', description: '当前成本在合理范围内', savings: '', actionLabel: '查看' });
  }
  return advices;
}

export default function Router() {
  const [activeTab, setActiveTab] = useState<RouterTab>('routes');
  const { routeData, loading: routesLoading } = useModelRoutes();
  const { cost } = useCostData();
  const { } = useCronJobs();
  const _costCtx = useCostContext(); void _costCtx;
  const [advices, setAdvices] = useState<CostAdvice[]>(() => generateAdvices(cost));
  const [editingBudget, setEditingBudget] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(cost.dailyBudget);
  const [monthlyBudget, setMonthlyBudget] = useState(cost.monthlyBudget);

  const handleApplyAdvice = useCallback((id: string) => {
    setAdvices(prev => prev.map(a => a.id === id ? { ...a, applied: true } : a));
  }, []);

  const tabs: { id: RouterTab; label: string; icon: string }[] = [
    { id: 'routes', label: '路由', icon: '⚡' },
    { id: 'cost', label: '成本', icon: '💰' },
    { id: 'budget', label: '预算', icon: '📊' },
  ];

  return (
    <div className="page router-page">
      <div className="router-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`router-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="router-content">
        {activeTab === 'routes' && (
          <div className="router-routes">
            <div className="section-header">
              <h3>模型路由表</h3>
              <span className="default-model">默认: {routeData.defaultModel}</span>
            </div>
            {routesLoading ? (
              <div className="loading-spinner-small"></div>
            ) : routeData.routes.length === 0 ? (
              <EmptyState icon="⚡" title="暂无路由" description="配置模型路由以优化成本" />
            ) : (
              <div className="route-table">
                {routeData.routes.map(route => (
                  <div key={route.id} className={`route-item ${route.enabled ? '' : 'disabled'}`}>
                    <div className="route-pattern"><code>{route.pattern}</code></div>
                    <div className="route-model">
                      <span className="model-name">{route.model}</span>
                      {route.fallback && <span className="route-fallback">→ {route.fallback}</span>}
                    </div>
                    {(route.monthlyTokens > 0 || route.monthlyCost > 0) && (
                      <div className="route-stats">
                        <span>{(route.monthlyTokens / 1000000).toFixed(1)}M tokens</span>
                        <span>¥{route.monthlyCost.toFixed(2)}/月</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="section-header" style={{ marginTop: '1.5rem' }}><h3>熔断器状态</h3></div>
            <div className="breaker-list">
              {routeData.circuitBreakers.map(cb => (
                <div key={cb.model} className={`breaker-item ${cb.status}`}>
                  <span className={`breaker-dot ${cb.status === 'closed' ? 'green' : cb.status === 'open' ? 'red' : 'yellow'}`}></span>
                  <span className="breaker-model">{cb.model}</span>
                  <span className="breaker-status">{cb.status === 'closed' ? '正常' : cb.status === 'open' ? '已熔断' : '半开'}</span>
                  <span className="breaker-rate">{cb.failureRate.toFixed(1)}% 失败率</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="router-cost">
            <div className="cost-summary">
              <div className="cost-today">
                <span className="cost-label">今日</span>
                <span className="cost-value">¥{cost.todayCost.toFixed(2)}</span>
                <span className={`cost-trend ${cost.trend}`}>
                  {cost.trend === 'up' ? '↑' : cost.trend === 'down' ? '↓' : '→'}{cost.trendPercent.toFixed(0)}%
                </span>
              </div>
              <div className="cost-yesterday"><span className="cost-label">昨日</span><span>¥{cost.yesterdayCost.toFixed(2)}</span></div>
              <div className="cost-monthly"><span className="cost-label">本月</span><span>¥{cost.monthlyCost.toFixed(2)}</span></div>
            </div>
            <div className="cost-breakdown">
              <h3>模型成本分布</h3>
              {cost.breakdown.map(item => (
                <div key={item.model} className="breakdown-item">
                  <div className="breakdown-header"><span>{item.model}</span><span>¥{item.cost.toFixed(2)}</span></div>
                  <div className="breakdown-bar"><div className="breakdown-fill" style={{ width: `${item.percent}%` }}></div></div>
                  <div className="breakdown-meta"><span>{item.percent.toFixed(0)}%</span><span>{(item.tokens / 1000).toFixed(0)}K tokens</span></div>
                </div>
              ))}
            </div>
            <div className="cost-hourly">
              <h3>24小时成本趋势</h3>
              <div className="hourly-chart">
                {cost.hourly.map((val, i) => (
                  <div key={i} className="hourly-bar-container" title={`${i}:00 - ¥${val.toFixed(2)}`}>
                    <div className="hourly-bar" style={{ height: `${Math.max(2, (val / Math.max(...cost.hourly, 0.01)) * 100)}%` }}></div>
                    {i % 6 === 0 && <span className="hourly-label">{i}h</span>}
                  </div>
                ))}
              </div>
            </div>
            <CostAdvisor advices={advices} onApply={handleApplyAdvice} />
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="router-budget">
            <h3>预算设置</h3>
            <div className="budget-progress">
              <div className="budget-item">
                <div className="budget-label"><span>日预算</span><span>¥{cost.todayCost.toFixed(2)} / ¥{dailyBudget}</span></div>
                <div className="budget-bar">
                  <div className={`budget-fill ${cost.todayCost / dailyBudget > 0.9 ? 'danger' : cost.todayCost / dailyBudget > 0.7 ? 'warning' : ''}`} style={{ width: `${Math.min(100, (cost.todayCost / dailyBudget) * 100)}%` }}></div>
                </div>
              </div>
              <div className="budget-item">
                <div className="budget-label"><span>月预算</span><span>¥{cost.monthlyCost.toFixed(2)} / ¥{monthlyBudget}</span></div>
                <div className="budget-bar">
                  <div className={`budget-fill ${cost.monthlyCost / monthlyBudget > 0.9 ? 'danger' : cost.monthlyCost / monthlyBudget > 0.7 ? 'warning' : ''}`} style={{ width: `${Math.min(100, (cost.monthlyCost / monthlyBudget) * 100)}%` }}></div>
                </div>
              </div>
            </div>
            {editingBudget ? (
              <div className="budget-editor">
                <div className="form-group"><label>日预算 (¥)</label><input type="number" value={dailyBudget} onChange={e => setDailyBudget(Number(e.target.value))} /></div>
                <div className="form-group"><label>月预算 (¥)</label><input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(Number(e.target.value))} /></div>
                <div className="budget-actions"><button className="btn btn-primary" onClick={() => setEditingBudget(false)}>保存</button><button className="btn" onClick={() => setEditingBudget(false)}>取消</button></div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setEditingBudget(true)}>✏️ 编辑预算</button>
            )}
            <CostFuse />
          </div>
        )}
      </div>
    </div>
  );
}
