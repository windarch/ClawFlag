import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GatewayProvider } from './contexts/GatewayContext';
import { RequireConnection } from './components/RequireConnection';
import BottomNav from './components/BottomNav';
import EmergencyStop from './components/EmergencyStop';
import NotificationBell from './components/NotificationBell';
import ApprovalModal from './components/ApprovalModal';
import type { Notification } from './components/NotificationBell';
import type { ApprovalRequest } from './components/ApprovalModal';
import Connect from './pages/Connect';
import Chat from './pages/Chat';
import Pulse from './pages/Pulse';
import Brain from './pages/Brain';
import Router from './pages/Router';
import './styles/global.css';

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'approval',
    title: '危险操作待批准',
    description: 'Agent 请求删除 3 个过期的内存文件',
    timestamp: new Date(Date.now() - 300000),
    read: false,
  },
  {
    id: 'n2',
    type: 'cost',
    title: '成本预警',
    description: '今日开销已达预算 75%',
    timestamp: new Date(Date.now() - 1800000),
    read: false,
  },
  {
    id: 'n3',
    type: 'info',
    title: '任务完成',
    description: '周报生成任务已完成，共 12 条消息',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
  },
];

export default function App() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Demo: show approval modal from notification
  const handleDemoApproval = () => {
    setApprovalRequest({
      id: 'apr-1',
      action: '删除过期内存文件',
      description: 'Agent 请求删除 memory/2025-12-01.md、memory/2025-12-02.md、memory/2025-12-03.md，这些文件超过 30 天未被引用。',
      riskLevel: 'medium',
      details: 'rm memory/2025-12-01.md\nrm memory/2025-12-02.md\nrm memory/2025-12-03.md',
    });
  };

  return (
    <GatewayProvider>
      <Routes>
        <Route path="/connect" element={<Connect />} />
        <Route
          path="/*"
          element={
            <RequireConnection>
              <div className="app-container">
                {/* 顶部通知栏 */}
                <div className="top-bar">
                  <span className="top-bar-title">ClawFlag</span>
                  <NotificationBell
                    notifications={notifications}
                    onMarkRead={(id) => {
                      handleMarkRead(id);
                      if (id === 'n1') handleDemoApproval();
                    }}
                    onClearAll={handleClearAll}
                  />
                </div>

                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Chat />} />
                    <Route path="/pulse" element={<Pulse />} />
                    <Route path="/brain" element={<Brain />} />
                    <Route path="/router" element={<Router />} />
                  </Routes>
                </main>

                <EmergencyStop onStop={() => console.log('Emergency stop triggered')} />
                <BottomNav />

                {/* 批准模态框 */}
                <ApprovalModal
                  request={approvalRequest}
                  onApprove={(id) => {
                    console.log('Approved:', id);
                    setApprovalRequest(null);
                  }}
                  onReject={(id) => {
                    console.log('Rejected:', id);
                    setApprovalRequest(null);
                  }}
                />
              </div>
            </RequireConnection>
          }
        />
      </Routes>
    </GatewayProvider>
  );
}
