import { useState } from 'react';
import './CircuitBreaker.css';

export interface CircuitBreakerData {
  currentUsagePercent: number;
  activeLayer: 'normal' | 'warning' | 'degraded' | 'tripped';
  warningThreshold: number;
  degradeThreshold: number;
  tripThreshold: number;
  degradedModel?: string;
  pausedSessions: number;
  lastTripped?: Date;
}

interface CircuitBreakerProps {
  data: CircuitBreakerData;
  onThresholdChange?: (layer: string, value: number) => void;
  onReset?: () => void;
}

const LAYER_CONFIG = {
  normal: { label: '正常', color: 'var(--color-status-online)', icon: '✅' },
  warning: { label: '警告', color: 'var(--color-status-warning)', icon: '⚠️' },
  degraded: { label: '降级', color: '#f97316', icon: '🔄' },
  tripped: { label: '熔断', color: 'var(--color-status-error)', icon: '🛑' },
};

export default function CircuitBreaker({ data, onThresholdChange, onReset }: CircuitBreakerProps) {
  const [editing, setEditing] = useState(false);
  const [thresholds, setThresholds] = useState({
    warning: data.warningThreshold,
    degrade: data.degradeThreshold,
    trip: data.tripThreshold,
  });

  const layerCfg = LAYER_CONFIG[data.activeLayer];

  return (
    <section className="circuit-breaker">
      <div className="section-header">
        <h2 className="section-title">⚡ 熔断器</h2>
        <div className="cb-status" style={{ color: layerCfg.color }}>
          {layerCfg.icon} {layerCfg.label}
        </div>
      </div>

      {/* Meter */}
      <div className="cb-meter">
        <div className="cb-meter-track">
          <div className="cb-meter-zone cb-zone-normal" style={{ width: `${data.warningThreshold}%` }} />
          <div className="cb-meter-zone cb-zone-warning" style={{ width: `${data.degradeThreshold - data.warningThreshold}%` }} />
          <div className="cb-meter-zone cb-zone-degraded" style={{ width: `${data.tripThreshold - data.degradeThreshold}%` }} />
          <div className="cb-meter-zone cb-zone-tripped" style={{ width: `${100 - data.tripThreshold}%` }} />
          <div
            className="cb-meter-needle"
            style={{ left: `${Math.min(data.currentUsagePercent, 100)}%` }}
          />
        </div>
        <div className="cb-meter-labels">
          <span>0%</span>
          <span style={{ left: `${data.warningThreshold}%` }}>{data.warningThreshold}%</span>
          <span style={{ left: `${data.degradeThreshold}%` }}>{data.degradeThreshold}%</span>
          <span style={{ left: `${data.tripThreshold}%` }}>{data.tripThreshold}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Layers */}
      <div className="cb-layers">
        <div className={`cb-layer ${data.activeLayer === 'warning' || data.activeLayer === 'degraded' || data.activeLayer === 'tripped' ? 'cb-layer-active' : ''}`}>
          <div className="cb-layer-header">
            <span className="cb-layer-icon" style={{ color: LAYER_CONFIG.warning.color }}>⚠️</span>
            <span className="cb-layer-name">警告层</span>
            <span className="cb-layer-threshold">
              {editing ? (
                <input
                  type="number"
                  value={thresholds.warning}
                  onChange={e => setThresholds(t => ({ ...t, warning: Number(e.target.value) }))}
                  onBlur={() => onThresholdChange?.('warning', thresholds.warning)}
                  min={10} max={95}
                />
              ) : (
                `${data.warningThreshold}%`
              )}
            </span>
          </div>
          <p className="cb-layer-desc">通知用户预算即将用尽。通过 App + Telegram 发送黄色警报。</p>
        </div>

        <div className={`cb-layer ${data.activeLayer === 'degraded' || data.activeLayer === 'tripped' ? 'cb-layer-active' : ''}`}>
          <div className="cb-layer-header">
            <span className="cb-layer-icon" style={{ color: LAYER_CONFIG.degraded.color }}>🔄</span>
            <span className="cb-layer-name">降级层</span>
            <span className="cb-layer-threshold">
              {editing ? (
                <input
                  type="number"
                  value={thresholds.degrade}
                  onChange={e => setThresholds(t => ({ ...t, degrade: Number(e.target.value) }))}
                  onBlur={() => onThresholdChange?.('degrade', thresholds.degrade)}
                  min={50} max={99}
                />
              ) : (
                `${data.degradeThreshold}%`
              )}
            </span>
          </div>
          <p className="cb-layer-desc">
            自动降级模型：Opus → Sonnet → Haiku。定时任务强制使用最便宜模型。
            {data.degradedModel && <span className="cb-current-model">当前：{data.degradedModel}</span>}
          </p>
        </div>

        <div className={`cb-layer ${data.activeLayer === 'tripped' ? 'cb-layer-active' : ''}`}>
          <div className="cb-layer-header">
            <span className="cb-layer-icon" style={{ color: LAYER_CONFIG.tripped.color }}>🛑</span>
            <span className="cb-layer-name">熔断层</span>
            <span className="cb-layer-threshold">
              {editing ? (
                <input
                  type="number"
                  value={thresholds.trip}
                  onChange={e => setThresholds(t => ({ ...t, trip: Number(e.target.value) }))}
                  onBlur={() => onThresholdChange?.('trip', thresholds.trip)}
                  min={80} max={100}
                />
              ) : (
                `${data.tripThreshold}%`
              )}
            </span>
          </div>
          <p className="cb-layer-desc">
            暂停所有非手动会话。仅保留用户发起的聊天。
            {data.pausedSessions > 0 && <span className="cb-paused">已暂停 {data.pausedSessions} 个会话</span>}
          </p>
        </div>
      </div>

      <div className="cb-actions">
        <button className="btn-edit-thresholds" onClick={() => setEditing(!editing)}>
          {editing ? '完成编辑' : '⚙️ 编辑阈值'}
        </button>
        {data.activeLayer === 'tripped' && (
          <button className="btn-reset-breaker" onClick={onReset}>
            🔓 解除熔断
          </button>
        )}
      </div>
    </section>
  );
}
