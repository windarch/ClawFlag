/**
 * Router 页面 - 模型路由 + 成本管理 + 备用链配置
 */

import { useState, useCallback, useEffect } from 'react';
import CostAdvisor from '../components/CostAdvisor';
import type { CostAdvice } from '../components/CostAdvisor';
import CostFuse from '../components/CostFuse';
import { useModelRoutes, useCostData, useCronJobs } from '../hooks/useGatewayData';
import { useCostContext } from '../contexts/CostContext';
import { useGatewayContext } from '../contexts/GatewayContext';
import EmptyState from '../components/EmptyState';
import '../styles/pages.css';

type RouterTab = 'routes' | 'editor' | 'fallback' | 'cost' | 'budget';

// ===== Fallback Chain Types =====

interface FallbackNode {
  id: string;
  model: string;
  price: string;    // e.g. "$15/M in"
  latency: string;  // e.g. "~2s"
}

const DEFAULT_CHAIN: FallbackNode[] = [
  { id: 'f1', model: 'claude-opus-4', price: '$15/M in', latency: '~3s' },
  { id: 'f2', model: 'claude-sonnet-4', price: '$3/M in', latency: '~1.5s' },
  { id: 'f3', model: 'claude-haiku-3.5', price: '$0.25/M in', latency: '~0.5s' },
];

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

// ===== Route Config Editor =====

function RouteConfigEditor() {
  const { client } = useGatewayContext();
  const [configText, setConfigText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load current config
  const loadConfig = useCallback(async () => {
    if (!client?.connected) return;
    setLoading(true);
    try {
      const result = await client.configGet();
      const config = result.config || {};
      // Extract models-related config
      const routeConfig: Record<string, unknown> = {};
      if (config.agents) routeConfig.agents = config.agents;
      if (config.models) routeConfig.models = config.models;
      if (config.gateway) routeConfig.gateway = config.gateway;
      const text = JSON.stringify(routeConfig, null, 2);
      setConfigText(text);
      setOriginalText(text);
    } catch {
      setConfigText('{\n  "agents": {\n    "defaults": {\n      "model": "claude-opus-4"\n    }\n  }\n}');
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // Preview
  const handlePreview = useCallback(() => {
    setError('');
    setPreviewData(null);
    try {
      const parsed = JSON.parse(configText);
      setPreviewData(parsed);
    } catch (e) {
      setError(`JSON 语法错误: ${e instanceof Error ? e.message : e}`);
    }
  }, [configText]);

  // Apply
  const handleApply = useCallback(async () => {
    if (!client?.connected) return;
    setError('');
    setSuccess('');
    setApplying(true);
    try {
      const parsed = JSON.parse(configText);
      await client.configApply(parsed);
      setSuccess('配置已应用！');
      setOriginalText(configText);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(`应用失败: ${e instanceof Error ? e.message : e}`);
    }
    setApplying(false);
  }, [client, configText]);

  const hasChanges = configText !== originalText;

  return (
    <div>
      <div className="section-header">
        <h3>📝 模型路由配置</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-small" onClick={loadConfig} disabled={loading}>
            {loading ? '加载中...' : '🔄 重载'}
          </button>
          <button className="btn btn-small" onClick={handlePreview}>👁️ 预览</button>
          <button
            className="btn btn-small btn-primary"
            onClick={handleApply}
            disabled={applying || !hasChanges}
          >
            {applying ? '应用中...' : '✅ 应用'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', color: 'var(--color-status-error, #ef4444)',
          fontSize: '0.75rem',
        }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderRadius: 6,
          background: 'rgba(34,197,94,0.1)', color: 'var(--color-status-online, #22c55e)',
          fontSize: '0.75rem',
        }}>
          ✅ {success}
        </div>
      )}

      <textarea
        value={configText}
        onChange={e => setConfigText(e.target.value)}
        style={{
          width: '100%', minHeight: '200px', padding: '0.75rem',
          background: 'rgba(0,0,0,0.3)', color: 'var(--color-text-primary, #e5e5e5)',
          border: `1px solid ${hasChanges ? 'var(--color-accent, #3b82f6)' : 'var(--color-border, rgba(255,255,255,0.1))'}`,
          borderRadius: 8, fontFamily: 'monospace', fontSize: '0.75rem',
          resize: 'vertical', outline: 'none',
        }}
        spellCheck={false}
      />
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
        编辑 JSON 配置后点击"应用"通过 Gateway config.apply 生效
        {hasChanges && <span style={{ color: 'var(--color-accent, #3b82f6)', marginLeft: '0.5rem' }}>● 有未保存的更改</span>}
      </div>

      {/* Preview */}
      {previewData && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>预览结果</h4>
          <div style={{
            padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.3)',
          }}>
            {Boolean(previewData.agents) && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Agent 默认模型</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                  {String((previewData.agents as Record<string, unknown>)?.defaults
                    ? ((previewData.agents as Record<string, unknown>).defaults as Record<string, unknown>)?.model || '未指定'
                    : '未指定')}
                </div>
              </div>
            )}
            {Boolean(previewData.models) && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>模型配置</div>
                <pre style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(previewData.models, null, 2)}
                </pre>
              </div>
            )}
            {Boolean(previewData.gateway) && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Gateway 配置</div>
                <pre style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(previewData.gateway, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Fallback Chain Editor =====

function FallbackChainEditor() {
  const { client } = useGatewayContext();
  const [chain, setChain] = useState<FallbackNode[]>(DEFAULT_CHAIN);
  const [adding, setAdding] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const moveUp = (index: number) => {
    if (index === 0) return;
    setChain(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === chain.length - 1) return;
    setChain(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const removeNode = (index: number) => {
    setChain(prev => prev.filter((_, i) => i !== index));
  };

  const addModel = () => {
    if (!newModel.trim()) return;
    setChain(prev => [...prev, {
      id: `f-${Date.now()}`,
      model: newModel.trim(),
      price: '—',
      latency: '—',
    }]);
    setNewModel('');
    setAdding(false);
  };

  const saveChain = async () => {
    if (!client?.connected) return;
    setSaving(true);
    setSaveMsg('');
    try {
      // Save fallback chain as models config
      const fallbackConfig = {
        agents: {
          defaults: {
            model: chain[0]?.model || 'claude-opus-4',
            fallbackModels: chain.slice(1).map(n => n.model),
          },
        },
      };
      await client.configApply(fallbackConfig);
      setSaveMsg('✅ 备用链已保存');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg(`❌ 保存失败: ${e instanceof Error ? e.message : e}`);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="section-header">
        <h3>🔗 备用链配置</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-small" onClick={() => setAdding(true)}>➕ 添加模型</button>
          <button className="btn btn-small btn-primary" onClick={saveChain} disabled={saving}>
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{
          padding: '0.4rem 0.75rem', marginBottom: '0.5rem', borderRadius: 6,
          background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: saveMsg.startsWith('✅') ? 'var(--color-status-online, #22c55e)' : 'var(--color-status-error, #ef4444)',
          fontSize: '0.75rem',
        }}>
          {saveMsg}
        </div>
      )}

      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
        当主模型不可用时，按顺序尝试下一个模型。用箭头调整优先级。
      </div>

      {/* Chain visualization */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {chain.map((node, i) => (
          <div key={node.id}>
            <div className="card" style={{
              padding: '0.6rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              borderLeft: `3px solid ${i === 0 ? 'var(--color-status-online, #22c55e)' : 'var(--color-text-muted, #666)'}`,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  style={{
                    background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer',
                    color: i === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    fontSize: '0.7rem', padding: 0, lineHeight: 1,
                  }}
                >▲</button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === chain.length - 1}
                  style={{
                    background: 'none', border: 'none', cursor: i === chain.length - 1 ? 'default' : 'pointer',
                    color: i === chain.length - 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    fontSize: '0.7rem', padding: 0, lineHeight: 1,
                  }}
                >▼</button>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {i === 0 && <span style={{ fontSize: '0.6rem', color: 'var(--color-status-online, #22c55e)', marginRight: '0.3rem' }}>主</span>}
                  {node.model}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {node.price} · {node.latency}
                </div>
              </div>
              <button
                onClick={() => removeNode(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '0.25rem',
                }}
                title="移除"
              >✕</button>
            </div>
            {i < chain.length - 1 && (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '0.15rem 0' }}>
                ↓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add model form */}
      {adding && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={newModel}
            onChange={e => setNewModel(e.target.value)}
            placeholder="模型名称, e.g. gpt-4o"
            style={{
              flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6,
              background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
              color: 'var(--color-text-primary)', fontSize: '0.75rem', outline: 'none',
            }}
            onKeyDown={e => e.key === 'Enter' && addModel()}
            autoFocus
          />
          <button className="btn btn-small btn-primary" onClick={addModel}>添加</button>
          <button className="btn btn-small" onClick={() => setAdding(false)}>取消</button>
        </div>
      )}
    </div>
  );
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
    { id: 'editor', label: '编辑', icon: '📝' },
    { id: 'fallback', label: '备用链', icon: '🔗' },
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

        {activeTab === 'editor' && (
          <div className="router-editor">
            <RouteConfigEditor />
          </div>
        )}

        {activeTab === 'fallback' && (
          <div className="router-fallback">
            <FallbackChainEditor />
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
