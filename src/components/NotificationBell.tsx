import { useState } from 'react';
import './NotificationBell.css';

export interface Notification {
  id: string;
  type: 'approval' | 'alert' | 'info' | 'cost';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onClearAll?: () => void;
}

const typeIcon: Record<string, string> = {
  approval: '📋',
  alert: '🚨',
  info: 'ℹ️',
  cost: '💰',
};

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

export default function NotificationBell({ notifications, onMarkRead, onClearAll }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-bell-wrapper">
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="bell-overlay" onClick={() => setOpen(false)} />
          <div className="bell-dropdown">
            <div className="bell-header">
              <span className="bell-title">通知</span>
              {notifications.length > 0 && onClearAll && (
                <button className="clear-all-btn" onClick={onClearAll}>全部已读</button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="bell-empty">暂无通知</div>
            ) : (
              <div className="bell-list">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`bell-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      onMarkRead?.(n.id);
                      n.onAction?.();
                    }}
                  >
                    <span className="bell-item-icon">{typeIcon[n.type] || 'ℹ️'}</span>
                    <div className="bell-item-content">
                      <div className="bell-item-title">{n.title}</div>
                      <div className="bell-item-desc">{n.description}</div>
                      <div className="bell-item-time">{timeAgo(n.timestamp)}</div>
                    </div>
                    {!n.read && <span className="unread-dot" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
