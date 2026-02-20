import { useState, useCallback } from 'react';
import type { GlanceData } from '../utils/mockData';
import {
  getStatusText,
  getStatusColorClass,
  formatCurrency,
  formatRelativeTime,
} from '../utils/mockData';
import './GlanceView.css';

interface GlanceViewProps {
  data: GlanceData;
  onRefresh?: () => Promise<void>;
}

export default function GlanceView({ data, onRefresh }: GlanceViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // 最少显示 500ms 的刷新动画
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isRefreshing, onRefresh]);

  const statusColorClass = getStatusColorClass(data.agentStatus);
  const statusText = getStatusText(data.agentStatus);
  const isOffline = data.agentStatus === 'offline';

  // 成本趋势
  const costDiff = data.todayCost - data.yesterdayCost;
  const costTrendIcon = costDiff > 0 ? '↑' : costDiff < 0 ? '↓' : '→';
  const costTrendClass = costDiff > 0 ? 'trend-up' : costDiff < 0 ? 'trend-down' : 'trend-flat';

  // 预算进度
  const budgetPercent = data.dailyBudget > 0 ? (data.todayCost / data.dailyBudget) * 100 : 0;
  const budgetClass = budgetPercent >= 90 ? 'budget-danger' : budgetPercent >= 70 ? 'budget-warning' : '';

  return (
    <div className="glance-view">
      {/* 标题和刷新按钮 */}
      <div className="glance-header">
        <span className="glance-title">3秒概览</span>
        {onRefresh && (
          <button
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="刷新数据"
          >
            🔄
          </button>
        )}
      </div>

      {/* 三个核心数字卡片 */}
      <div className="glance-cards">
        {/* Agent 状态卡片 */}
        <div className={`glance-card status-card ${statusColorClass}`}>
          <div className="card-icon">🤖</div>
          <div className="card-value">
            <span className="status-indicator" />
            {statusText}
          </div>
          <div className="card-label">{data.agentName}</div>
        </div>

        {/* 今日开销卡片 */}
        <div className={`glance-card cost-card ${budgetClass}`}>
          <div className="card-icon">💰</div>
          <div className="card-value">
            {formatCurrency(data.todayCost)}
            <span className={`cost-trend ${costTrendClass}`}>{costTrendIcon}</span>
          </div>
          <div className="card-label">
            今日开销
            {data.yesterdayCost > 0 && (
              <span className="cost-compare">
                {' '}vs 昨日 {formatCurrency(data.yesterdayCost)}
              </span>
            )}
          </div>
          {data.dailyBudget > 0 && (
            <div className="budget-bar">
              <div
                className={`budget-fill ${budgetClass}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* 待审批事项卡片 */}
        <div className={`glance-card approval-card ${data.pendingApprovals === 0 ? 'no-pending' : ''}`}>
          <div className="card-icon">📋</div>
          <div className="card-value">{data.pendingApprovals}</div>
          <div className="card-label">待审批</div>
        </div>
      </div>

      {/* 当前任务描述 */}
      <div className="current-task">
        <div className="task-label">当前任务</div>
        <div className={`task-description ${isOffline ? 'idle' : ''}`}>
          {data.currentTask}
        </div>
        <div className="last-updated">
          更新于 {formatRelativeTime(data.lastUpdated)}
        </div>
      </div>
    </div>
  );
}
