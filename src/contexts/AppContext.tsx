/**
 * 应用全局状态上下文
 * 管理通知、审批、主题等全局状态
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Notification } from '../components/NotificationBell';
import type { ApprovalRequest } from '../components/ApprovalModal';

interface AppContextValue {
  // Notifications
  notifications: Notification[];
  markRead: (id: string) => void;
  clearAll: () => void;
  addNotification: (n: Omit<Notification, 'id'>) => void;

  // Approvals
  approvalRequest: ApprovalRequest | null;
  showApproval: (req: ApprovalRequest) => void;
  handleApproval: (id: string, approved: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'approval', title: '危险操作待批准',
    description: 'Agent 请求删除 3 个过期的内存文件',
    timestamp: new Date(Date.now() - 300000), read: false,
  },
  {
    id: 'n2', type: 'cost', title: '成本预警',
    description: '今日开销已达预算 75%',
    timestamp: new Date(Date.now() - 1800000), read: false,
  },
  {
    id: 'n3', type: 'info', title: '任务完成',
    description: '周报生成任务已完成，共 12 条消息',
    timestamp: new Date(Date.now() - 3600000), read: true,
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    setNotifications(prev => [{ ...n, id: `n_${Date.now()}` }, ...prev]);
  }, []);

  const showApproval = useCallback((req: ApprovalRequest) => {
    setApprovalRequest(req);
  }, []);

  const handleApproval = useCallback((id: string, approved: boolean) => {
    console.log(approved ? 'Approved:' : 'Rejected:', id);
    setApprovalRequest(null);
    // TODO: send approval/rejection to Gateway
  }, []);

  return (
    <AppContext.Provider value={{
      notifications, markRead, clearAll, addNotification,
      approvalRequest, showApproval, handleApproval,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
