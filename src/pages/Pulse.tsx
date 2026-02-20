import { useState, useCallback } from 'react';
import GlanceView from '../components/GlanceView';
import SecurityCheck from '../components/SecurityCheck';
import type { SessionData, SecurityAlert, GlanceData } from '../utils/mockData';
import type { SecurityCheckResult } from '../types/security';
import {
  mockGlanceData,
  mockSessions,
  mockSecurityAlerts,
  mockSecurityCheckResult,
  formatCurrency,
  formatRelativeTime,
} from '../utils/mockData';
import '../styles/pages.css';

// 会话状态文本映射
const sessionStatusText: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
};

// 会话状态颜色类名映射
const sessionStatusClass: Record<string, string> = {
  active: 'session-active',
  completed: 'session-completed',
  paused: 'session-paused',
};

export default function Pulse() {
  const [glanceData, setGlanceData] = useState<GlanceData>(mockGlanceData);
  const [sessions] = useState<SessionData[]>(mockSessions);
  const [alerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [securityResult, setSecurityResult] = useState<SecurityCheckResult>(mockSecurityCheckResult);

  // 模拟刷新数据
  const handleRefresh = useCallback(async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 更新数据（实际应从 Gateway 获取）
    setGlanceData(prev => ({
      ...prev,
      lastUpdated: new Date(),
      todayCost: prev.todayCost + Math.random() * 0.5,
    }));
  }, []);

  return (
    <div className="page pulse-page">
      <h1 className="page-title">📊 脉搏</h1>
      <p className="page-subtitle">实时监控 Agent 状态</p>

      {/* 安全警告横幅 */}
      {alerts.length > 0 && (
        <div className="security-alerts">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-banner alert-${alert.level}`}>
              <span className="alert-icon">
                {alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-description">{alert.description}</div>
              </div>
              {alert.actionLabel && (
                <button className="alert-action">{alert.actionLabel}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 概览视图组件 */}
      <GlanceView data={glanceData} onRefresh={handleRefresh} />

      {/* Gateway 安全检查 */}
      <SecurityCheck
        result={securityResult}
        onRecheck={() => {
          // 模拟重新检查
          setSecurityResult(prev => ({ ...prev, timestamp: new Date() }));
        }}
      />

      {/* 会话列表 */}
      <section className="sessions-section">
        <div className="section-header">
          <h2 className="section-title">💬 会话列表</h2>
          <span className="session-count">{sessions.length} 个会话</span>
        </div>
        
        <div className="sessions-list">
          {sessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-main">
                <div className="session-title">{session.title}</div>
                <div className="session-meta">
                  <span className="session-model">{session.model}</span>
                  <span className="session-messages">{session.messageCount} 条消息</span>
                </div>
              </div>
              <div className="session-stats">
                <div className="session-cost">{formatCurrency(session.cost)}</div>
                <div className="session-time">{formatRelativeTime(session.startTime)}</div>
                <span className={`session-status ${sessionStatusClass[session.status]}`}>
                  {sessionStatusText[session.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
