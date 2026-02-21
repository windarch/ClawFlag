import { Routes, Route } from 'react-router-dom';
import { GatewayProvider } from './contexts/GatewayContext';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { CostProvider } from './contexts/CostContext';
import { RequireConnection } from './components/RequireConnection';
import BottomNav from './components/BottomNav';
import EmergencyStop from './components/EmergencyStop';
import NotificationBell from './components/NotificationBell';
import ApprovalModal from './components/ApprovalModal';
import Connect from './pages/Connect';
import Chat from './pages/Chat';
import Pulse from './pages/Pulse';
import Brain from './pages/Brain';
import Router from './pages/Router';
import './styles/global.css';

function AppShell() {
  const {
    notifications, markRead, clearAll,
    approvalRequest, showApproval, handleApproval,
  } = useAppContext();

  return (
    <div className="app-container">
      <div className="top-bar">
        <span className="top-bar-title">ClawFlag</span>
        <NotificationBell
          notifications={notifications}
          onMarkRead={(id) => {
            markRead(id);
            if (id === 'n1') {
              showApproval({
                id: 'apr-1',
                action: '删除过期内存文件',
                description: 'Agent 请求删除 memory/2025-12-01.md 等 3 个超过 30 天未引用的文件。',
                riskLevel: 'medium',
                details: 'rm memory/2025-12-01.md\nrm memory/2025-12-02.md\nrm memory/2025-12-03.md',
              });
            }
          }}
          onClearAll={clearAll}
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

      <ApprovalModal
        request={approvalRequest}
        onApprove={(id) => handleApproval(id, true)}
        onReject={(id) => handleApproval(id, false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <GatewayProvider>
      <AppProvider>
        <CostProvider>
        <Routes>
          <Route path="/connect" element={<Connect />} />
          <Route path="/*" element={
            <RequireConnection>
              <AppShell />
            </RequireConnection>
          } />
        </Routes>
        </CostProvider>
      </AppProvider>
    </GatewayProvider>
  );
}
