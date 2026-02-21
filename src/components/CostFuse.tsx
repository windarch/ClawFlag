/**
 * CostFuse 三层成本熔断器组件
 * - 70% 警告层：黄色
 * - 90% 降级层：橙色 + 模型降级指令
 * - 100% 熔断层：红色全屏 + 解除按钮
 */

import { useState, useEffect, useCallback } from 'react';
import { useCostContext } from '../contexts/CostContext';
import { useGatewayContext } from '../contexts/GatewayContext';
import { getDowngradeModel } from '../services/costAdvisor';
import './CostFuse.css';

interface CostFuseProps {
  compact?: boolean;
}

export default function CostFuse({ compact }: CostFuseProps) {
  const { summary, dailyBudget, setDailyBudget, fuseLevel, fusePercent, fuseTripped, resetFuse: _resetFuse, fuseAcknowledged, acknowledgeFuse } = useCostContext();
  void _resetFuse;
  const { client } = useGatewayContext();
  const [showWarning, setShowWarning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(dailyBudget));
  const [degradeSent, setDegradeSent] = useState(false);

  // Show warning popup at 70%
  useEffect(() => {
    if (fuseLevel === 'warning' && !showWarning) {
      setShowWarning(true);
    }
  }, [fuseLevel, showWarning]);

  // Auto-degrade at 90%
  useEffect(() => {
    if (fuseLevel === 'degraded' && !degradeSent && client?.connected) {
      const currentModel = 'claude-opus-4'; // TODO: get from config
      const downgrade = getDowngradeModel(currentModel);
      if (downgrade) {
        client.request('config.apply', {
          config: { 'agents.defaults.model': downgrade },
        }).catch(() => {});
        setDegradeSent(true);
      }
    }
  }, [fuseLevel, degradeSent, client]);

  // Auto-pause at 100%
  useEffect(() => {
    if (fuseTripped && client?.connected && !fuseAcknowledged) {
      // Send pause to gateway
      client.request('config.apply', {
        config: { 'agents.defaults.paused': true },
      }).catch(() => {});
    }
  }, [fuseTripped, client, fuseAcknowledged]);

  const handleUnfuse = useCallback(() => {
    acknowledgeFuse();
    // Unpause
    if (client?.connected) {
      client.request('config.apply', {
        config: { 'agents.defaults.paused': false },
      }).catch(() => {});
    }
  }, [acknowledgeFuse, client]);

  const handleSaveBudget = () => {
    const val = Number(budgetInput);
    if (val > 0) setDailyBudget(val);
    setEditing(false);
  };

  // Full-screen trip overlay
  if (fuseTripped && !fuseAcknowledged) {
    return (
      <div className="fuse-fullscreen">
        <div className="fuse-fullscreen-content">
          <div className="fuse-icon-large">🛑</div>
          <h2>成本熔断！</h2>
          <p>今日成本 ¥{summary.totalCostCNY.toFixed(2)} 已达到预算上限 ¥{dailyBudget}</p>
          <p className="fuse-sub">所有非手动会话已暂停</p>
          <button className="btn btn-danger btn-large" onClick={handleUnfuse}>
            🔓 解除熔断
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`fuse-compact fuse-${fuseLevel}`}>
        <span className="fuse-dot"></span>
        <span>¥{summary.totalCostCNY.toFixed(2)}</span>
        <span className="fuse-pct">{fusePercent.toFixed(0)}%</span>
      </div>
    );
  }

  return (
    <div className={`cost-fuse fuse-${fuseLevel}`}>
      <div className="fuse-header">
        <h3>💰 成本熔断器</h3>
        <div className="fuse-budget">
          {editing ? (
            <span className="fuse-edit">
              ¥<input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveBudget()} autoFocus />
              <button className="btn-sm" onClick={handleSaveBudget}>✓</button>
            </span>
          ) : (
            <span onClick={() => { setEditing(true); setBudgetInput(String(dailyBudget)); }} className="fuse-budget-click">
              日预算: ¥{dailyBudget}  ✏️
            </span>
          )}
        </div>
      </div>

      {/* Progress bar with threshold markers */}
      <div className="fuse-bar-container">
        <div className="fuse-bar">
          <div className="fuse-fill" style={{ width: `${Math.min(100, fusePercent)}%` }}></div>
          <div className="fuse-marker fuse-marker-70" style={{ left: '70%' }}>
            <span className="marker-label">70%</span>
          </div>
          <div className="fuse-marker fuse-marker-90" style={{ left: '90%' }}>
            <span className="marker-label">90%</span>
          </div>
          <div className="fuse-marker fuse-marker-100" style={{ left: '100%' }}>
            <span className="marker-label">100%</span>
          </div>
        </div>
        <div className="fuse-values">
          <span>¥{summary.totalCostCNY.toFixed(2)}</span>
          <span>{fusePercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Three tier indicators */}
      <div className="fuse-tiers">
        <div className={`fuse-tier ${fusePercent >= 70 ? 'active' : ''}`}>
          <span className="tier-icon">⚠️</span>
          <span>警告 70%</span>
        </div>
        <div className={`fuse-tier ${fusePercent >= 90 ? 'active' : ''}`}>
          <span className="tier-icon">🔻</span>
          <span>降级 90%</span>
        </div>
        <div className={`fuse-tier ${fusePercent >= 100 ? 'active' : ''}`}>
          <span className="tier-icon">🛑</span>
          <span>熔断 100%</span>
        </div>
      </div>

      {/* Warning popup */}
      {showWarning && fuseLevel === 'warning' && (
        <div className="fuse-warning-popup">
          ⚠️ 今日成本已达预算 {fusePercent.toFixed(0)}%
          <button className="btn-sm" onClick={() => setShowWarning(false)}>知道了</button>
        </div>
      )}
    </div>
  );
}
