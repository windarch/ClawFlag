/**
 * Pulse 页面 - 概览与监控
 */

import { useState, useCallback } from 'react';
import GlanceView from '../components/GlanceView';
import SecurityCheck from '../components/SecurityCheck';
import AgentStatsCard from '../components/AgentStatsCard';
import EmptyState from '../components/EmptyState';
import {
  useSessions,
  useCostData,
  useCronJobs,
  useSecurityStatus,
} from '../hooks/useGatewayData';
import type { GlanceData } from '../utils/mockData';
import { mockGlanceData } from '../utils/mockData';
import '../styles/pages.css';

type PulseTab = 'overview' | 'sessions' | 'cron' | 'security';

export default function Pulse() {
  const [activeTab, setActiveTab] = useState<PulseTab>('overview');
  const { sessions, refresh: refreshSessions } = useSessions();
  const { cost } = useCostData();
  const { jobs, toggleJob, runJob, refresh: refreshCron } = useCronJobs();
  const { security, rescan, loading: secLoading } = useSecurityStatus();

  const [glanceData, setGlanceData] = useState<GlanceData>(mockGlanceData);

  const refreshGlance = useCallback(async () => {
    const activeSessions = sessions.filter(s => s.status === 'active');
    setGlanceData(prev => ({
      ...prev,
      agentStatus: activeSessions.length > 0 ? 'busy' as const : 'online' as const,
      todayCost: cost.todayCost,
      yesterdayCost: cost.yesterdayCost,
      dailyBudget: cost.dailyBudget,
      pendingApprovals: 0,
      currentTask: activeSessions[0]?.label || '无活跃任务',
    }));
    await refreshSessions();
  }, [sessions, cost, refreshSessions]);

  const tabs: { id: PulseTab; label: string; icon: string }[] = [
    { id: 'overview', label: '概览', icon: '📊' },
    { id: 'sessions', label: '会话', icon: '💬' },
    { id: 'cron', label: '定时', icon: '⏰' },
    { id: 'security', label: '安全', icon: '🛡️' },
  ];

  return (
    <div className="page pulse-page">
      <div className="pulse-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`pulse-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pulse-content">
        {activeTab === 'overview' && (
          <div className="pulse-overview">
            <GlanceView data={glanceData} onRefresh={refreshGlance} />
            <AgentStatsCard stats={{
              agentName: '龙虾',
              agentEmoji: '🦞',
              periodLabel: '本月',
              tasksCompleted: sessions.reduce((s, se) => s + se.messageCount, 0),
              totalCost: `¥${cost.monthlyCost.toFixed(2)}`,
              primaryModel: cost.breakdown[0]?.model || 'unknown',
              totalTokens: `${(sessions.reduce((s, se) => s + se.inputTokens + se.outputTokens, 0) / 1000).toFixed(0)}K`,
              uptime: '7d 14h',
              topSkills: ['coding-agent', 'weather', 'session-logs'],
            }} />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="pulse-sessions">
            <div className="section-header">
              <h3>活跃会话</h3>
              <button className="btn btn-icon" onClick={() => refreshSessions()} title="刷新">🔄</button>
            </div>
            {sessions.length === 0 ? (
              <EmptyState icon="💬" title="暂无会话" description="Agent 还没有活跃会话" />
            ) : (
              <div className="session-list">
                {sessions.map(s => (
                  <div key={s.id} className={`session-item ${s.status}`}>
                    <div className="session-header">
                      <span className={`status-dot ${s.status === 'active' ? 'green' : 'gray'}`}></span>
                      <span className="session-label">{s.label}</span>
                      <span className="session-kind">{s.kind}</span>
                    </div>
                    <div className="session-body">
                      <span>{s.model}</span>
                      <span>{s.messageCount} 条消息</span>
                      <span>¥{s.cost.toFixed(2)}</span>
                    </div>
                    <div className="session-bar">
                      <div className="session-bar-fill" style={{ width: `${s.tokenUsage}%` }}></div>
                      <span className="session-bar-label">{s.tokenUsage}% context</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cron' && (
          <div className="pulse-cron">
            <div className="section-header">
              <h3>定时任务</h3>
              <button className="btn btn-icon" onClick={() => refreshCron()} title="刷新">🔄</button>
            </div>
            {jobs.length === 0 ? (
              <EmptyState icon="⏰" title="暂无定时任务" description="还没有配置定时任务" />
            ) : (
              <div className="cron-list">
                {jobs.map(job => (
                  <div key={job.id} className={`cron-item ${job.status}`}>
                    <div className="cron-item-header">
                      <span className={`cron-status-dot ${job.status === 'enabled' ? 'green' : job.status === 'running' ? 'blue' : 'gray'}`}></span>
                      <span className="cron-name">{job.name}</span>
                      <span className="cron-schedule">{job.schedule}</span>
                    </div>
                    <div className="cron-item-body">
                      <span className="cron-payload">{job.payload}</span>
                      <span className="cron-target">{job.sessionTarget}</span>
                    </div>
                    {job.lastRun && (
                      <div className="cron-item-meta">
                        <span className={`cron-last-result ${job.lastResult}`}>
                          {job.lastResult === 'success' ? '✅' : job.lastResult === 'error' ? '❌' : '⏳'}
                        </span>
                      </div>
                    )}
                    <div className="cron-item-actions">
                      <button className="btn btn-small" onClick={() => toggleJob(job.id)}>
                        {job.status === 'disabled' ? '启用' : '禁用'}
                      </button>
                      <button className="btn btn-small btn-primary" onClick={() => runJob(job.id)} disabled={job.status === 'running'}>
                        ▶ 运行
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="pulse-security">
            <SecurityCheck
              result={{
                overallScore: security.overallScore,
                checks: security.checks.map(c => ({
                  id: c.id,
                  name: c.name,
                  level: c.status as 'pass' | 'warn' | 'fail',
                  message: c.description,
                  detail: c.detail,
                })),
                timestamp: security.lastScan.getTime(),
              }}
              onRescan={rescan}
              loading={secLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
