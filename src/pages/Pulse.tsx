import { useState, useCallback } from 'react';
import GlanceView from '../components/GlanceView';
import SecurityCheck from '../components/SecurityCheck';
import AgentStatsCard from '../components/AgentStatsCard';
import type { AgentStats } from '../components/AgentStatsCard';
import type { SecurityCheckResult } from '../types/security';
import { useSessions, useCostData, useCronJobs } from '../hooks/useGatewayData';
import type { SessionInfo, CronJob } from '../hooks/useGatewayData';
import { mockGlanceData, mockSecurityAlerts, mockSecurityCheckResult } from '../utils/mockData';
import type { SecurityAlert, GlanceData } from '../utils/mockData';
import '../styles/pages.css';

// ============ Sub-components ============

function SessionList({ sessions }: { sessions: SessionInfo[] }) {
  const kindEmoji = { main: '🏠', isolated: '🔀', cron: '⏰' };
  const statusColor = { active: 'var(--color-status-online)', idle: 'var(--color-status-warning)', completed: 'var(--color-status-offline)' };
  const statusLabel = { active: '运行中', idle: '空闲', completed: '已完成' };

  return (
    <section style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>💬 会话列表</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sessions.length} 个</span>
      </div>
      {sessions.map(s => (
        <div key={s.id} className="card" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {kindEmoji[s.kind]} {s.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {s.model} · {s.messageCount} 条消息
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                ${s.cost.toFixed(2)}
              </div>
              <span style={{
                fontSize: '0.65rem', padding: '1px 6px', borderRadius: 6,
                background: `${statusColor[s.status]}20`, color: statusColor[s.status],
              }}>
                {statusLabel[s.status]}
              </span>
            </div>
          </div>
          {/* Token usage bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
              <span>Token 使用</span>
              <span>{s.tokenUsage}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${s.tokenUsage}%`, borderRadius: 2,
                background: s.tokenUsage > 80 ? 'var(--color-status-error)' : s.tokenUsage > 60 ? 'var(--color-status-warning)' : 'var(--color-status-online)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function CronJobPanel({ jobs, onToggle, onRun }: {
  jobs: CronJob[];
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
}) {
  const statusEmoji = { enabled: '🟢', disabled: '⚪', running: '🔄' };
  const resultEmoji = { success: '✅', error: '❌', pending: '⏳' };

  return (
    <section style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>⏰ 定时任务</h2>
      {jobs.map(job => (
        <div key={job.id} className="card" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {statusEmoji[job.status]} {job.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {job.schedule} · {resultEmoji[job.lastResult]} {job.lastRun ? formatTimeAgo(job.lastRun) : '从未运行'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {job.payload}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={() => onRun(job.id)} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6,
                padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}>▶</button>
              <button onClick={() => onToggle(job.id)} style={{
                background: job.status === 'enabled' ? 'var(--color-status-online)' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: 12, width: 36, height: 20,
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  left: job.status === 'enabled' ? 18 : 2,
                }} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ContextMeter({ tokenUsage, inputTokens, outputTokens }: {
  tokenUsage: number; inputTokens: number; outputTokens: number;
}) {
  const color = tokenUsage > 80 ? 'var(--color-status-error)' : tokenUsage > 60 ? 'var(--color-status-warning)' : 'var(--color-status-online)';
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>📐 上下文窗口</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Ring */}
        <svg width={60} height={60} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx={30} cy={30} r={24} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - tokenUsage / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
            {tokenUsage}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            输入 {(inputTokens / 1000).toFixed(0)}K · 输出 {(outputTokens / 1000).toFixed(0)}K
          </div>
        </div>
      </div>
    </div>
  );
}

function CostAnomalyAlert() {
  return (
    <div className="card" style={{
      marginBottom: '1rem', padding: '0.75rem',
      borderLeft: '3px solid var(--color-status-warning)',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-status-warning)', fontWeight: 600 }}>
            成本异常检测
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            会话 #clawflag-phase1 消耗了平均 3.2 倍的 token。可能存在循环或提示注入。
          </div>
          <button style={{
            marginTop: '0.5rem', background: 'rgba(245,158,11,0.15)', border: 'none',
            borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem',
            color: 'var(--color-status-warning)', cursor: 'pointer',
          }}>
            审查会话 →
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export default function Pulse() {
  const [glanceData, setGlanceData] = useState<GlanceData>(mockGlanceData);
  const [alerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [securityResult, setSecurityResult] = useState<SecurityCheckResult>(mockSecurityCheckResult);
  const { sessions } = useSessions();
  const { cost } = useCostData();
  const { jobs, toggleJob, runJob } = useCronJobs();
  const [agentStats] = useState<AgentStats>({
    agentName: '龙虾',
    agentEmoji: '🦞',
    periodLabel: '本周统计',
    tasksCompleted: 47,
    totalCost: '¥85.20',
    primaryModel: 'Claude Opus',
    totalTokens: '1.2M',
    uptime: '168h',
    topSkills: ['coding-agent', 'weather', 'brave-search'],
  });

  const mainSession = sessions.find(s => s.kind === 'main');

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setGlanceData(prev => ({
      ...prev,
      lastUpdated: new Date(),
      todayCost: cost.todayCost,
    }));
  }, [cost.todayCost]);

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

      {/* 概览视图 */}
      <GlanceView data={glanceData} onRefresh={handleRefresh} />

      {/* 成本异常警报 */}
      <CostAnomalyAlert />

      {/* 上下文窗口计量器 */}
      {mainSession && (
        <ContextMeter
          tokenUsage={mainSession.tokenUsage}
          inputTokens={mainSession.inputTokens}
          outputTokens={mainSession.outputTokens}
        />
      )}

      {/* Gateway 安全检查 */}
      <SecurityCheck
        result={securityResult}
        onRecheck={() => setSecurityResult(prev => ({ ...prev, timestamp: new Date() }))}
      />

      {/* 会话列表 */}
      <SessionList sessions={sessions} />

      {/* 定时任务 */}
      <CronJobPanel jobs={jobs} onToggle={toggleJob} onRun={runJob} />

      {/* Agent 统计社交卡片 */}
      <AgentStatsCard stats={agentStats} />
    </div>
  );
}
