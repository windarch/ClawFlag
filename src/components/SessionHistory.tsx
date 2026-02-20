import { useState } from 'react';
import { formatCurrency, formatRelativeTime } from '../utils/mockData';
import './SessionHistory.css';

export interface HistorySession {
  id: string;
  title: string;
  model: string;
  tokenCount: number;
  cost: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'paused';
  messageCount: number;
  channel?: string;
}

interface SessionHistoryProps {
  sessions: HistorySession[];
  onSessionClick?: (id: string) => void;
}

const statusIcon: Record<string, string> = {
  active: '🟢',
  completed: '✅',
  paused: '⏸️',
};


export default function SessionHistory({ sessions, onSessionClick }: SessionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = filter === 'all'
    ? sessions
    : sessions.filter(s => s.status === filter);

  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokenCount, 0);

  return (
    <div className="session-history">
      <div className="history-header">
        <div className="history-title-row">
          <span className="history-icon">📋</span>
          <span className="history-title">会话历史</span>
          <span className="history-stats">
            {sessions.length} 会话 · {formatCurrency(totalCost)} · {(totalTokens / 1000).toFixed(0)}K tokens
          </span>
        </div>
        <div className="history-filters">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
            </button>
          ))}
        </div>
      </div>

      <div className="history-list">
        {filtered.map(session => (
          <div
            key={session.id}
            className="history-card"
            onClick={() => onSessionClick?.(session.id)}
          >
            <div className="history-main">
              <div className="history-left">
                <span className="history-status-icon">{statusIcon[session.status]}</span>
                <div className="history-info">
                  <div className="history-session-title">{session.title}</div>
                  <div className="history-meta">
                    <span className="meta-model">{session.model}</span>
                    <span className="meta-sep">·</span>
                    <span>{session.messageCount} 条</span>
                    {session.channel && (
                      <>
                        <span className="meta-sep">·</span>
                        <span>{session.channel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="history-right">
                <div className="history-cost">{formatCurrency(session.cost)}</div>
                <div className="history-time">{formatRelativeTime(session.startTime)}</div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="history-empty">暂无{filter === 'active' ? '进行中的' : '已完成的'}会话</div>
        )}
      </div>
    </div>
  );
}
