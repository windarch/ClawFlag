import { useState } from 'react';
import './ModelRouter.css';

export interface RoutingRule {
  id: string;
  condition: string;
  conditionType: 'default' | 'session_type' | 'cost_threshold' | 'time_range';
  conditionValue?: string;
  model: string;
  enabled: boolean;
}

export interface FallbackChain {
  models: string[];
}

interface ModelRouterProps {
  rules: RoutingRule[];
  fallbackChain: FallbackChain;
  onRuleToggle?: (id: string) => void;
  onRuleDelete?: (id: string) => void;
  onRuleAdd?: (rule: Omit<RoutingRule, 'id'>) => void;
  onFallbackUpdate?: (chain: FallbackChain) => void;
}

const MODEL_OPTIONS = [
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-haiku',
  'deepseek-v3',
  'gpt-4o',
  'gpt-4o-mini',
];

const CONDITION_LABELS: Record<string, string> = {
  default: '默认',
  session_type: '会话类型',
  cost_threshold: '成本阈值',
  time_range: '时间段',
};

export default function ModelRouter({ rules, fallbackChain, onRuleToggle, onRuleDelete, onRuleAdd }: ModelRouterProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newConditionType, setNewConditionType] = useState<string>('session_type');
  const [newConditionValue, setNewConditionValue] = useState('');
  const [newModel, setNewModel] = useState(MODEL_OPTIONS[1]);
  const [previewRule, setPreviewRule] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newConditionValue && newConditionType !== 'default') return;
    onRuleAdd?.({
      condition: newConditionType === 'default' ? '默认' : `${CONDITION_LABELS[newConditionType]} = ${newConditionValue}`,
      conditionType: newConditionType as RoutingRule['conditionType'],
      conditionValue: newConditionValue,
      model: newModel,
      enabled: true,
    });
    setShowAdd(false);
    setNewConditionValue('');
  };

  return (
    <section className="model-router">
      <div className="section-header">
        <h2 className="section-title">🔀 模型路由规则</h2>
        <button className="btn-add" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕' : '+ 添加规则'}
        </button>
      </div>

      {showAdd && (
        <div className="add-rule-form">
          <div className="form-row">
            <label>条件类型</label>
            <select value={newConditionType} onChange={e => setNewConditionType(e.target.value)}>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {newConditionType !== 'default' && (
            <div className="form-row">
              <label>条件值</label>
              <input
                type="text"
                value={newConditionValue}
                onChange={e => setNewConditionValue(e.target.value)}
                placeholder={
                  newConditionType === 'session_type' ? 'cron / subagent / main' :
                  newConditionType === 'cost_threshold' ? '> ¥10' :
                  '22:00-06:00'
                }
              />
            </div>
          )}
          <div className="form-row">
            <label>目标模型</label>
            <select value={newModel} onChange={e => setNewModel(e.target.value)}>
              {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn-confirm" onClick={handleAdd}>确认添加</button>
        </div>
      )}

      <div className="rules-list">
        {rules.map(rule => (
          <div key={rule.id} className={`rule-card ${!rule.enabled ? 'rule-disabled' : ''}`}>
            <div className="rule-main">
              <div className="rule-condition">
                <span className="condition-badge">{CONDITION_LABELS[rule.conditionType] || rule.conditionType}</span>
                <span className="condition-text">{rule.condition}</span>
              </div>
              <div className="rule-arrow">→</div>
              <div className="rule-model">{rule.model}</div>
            </div>
            <div className="rule-actions">
              <button
                className="btn-preview"
                onClick={() => setPreviewRule(previewRule === rule.id ? null : rule.id)}
                title="决策预览"
              >
                👁️
              </button>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => onRuleToggle?.(rule.id)}
                />
                <span className="toggle-slider" />
              </label>
              <button className="btn-delete" onClick={() => onRuleDelete?.(rule.id)} title="删除">
                🗑️
              </button>
            </div>
            {previewRule === rule.id && (
              <div className="rule-preview">
                <div className="preview-title">决策预览</div>
                <div className="preview-content">
                  当 <strong>{rule.condition}</strong> 时，所有匹配的请求将使用{' '}
                  <strong>{rule.model}</strong> 处理。
                  {rule.conditionType === 'session_type' && rule.conditionValue === 'cron' && (
                    <span className="preview-savings"> 预估每月可节省 ¥85-175。</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fallback-section">
        <h3 className="subsection-title">🔗 备用链 (Fallback Chain)</h3>
        <div className="fallback-chain">
          {fallbackChain.models.map((model, i) => (
            <span key={i} className="fallback-item">
              <span className="fallback-model">{model}</span>
              {i < fallbackChain.models.length - 1 && <span className="fallback-arrow">→</span>}
            </span>
          ))}
        </div>
        <p className="fallback-desc">当首选模型不可用或超时时，自动按此链路降级。</p>
      </div>
    </section>
  );
}
