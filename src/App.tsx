import { Routes, Route } from 'react-router-dom';
import { GatewayProvider } from './contexts/GatewayContext';
import { RequireConnection } from './components/RequireConnection';
import BottomNav from './components/BottomNav';
import EmergencyStop from './components/EmergencyStop';
import Connect from './pages/Connect';
import Chat from './pages/Chat';
import Pulse from './pages/Pulse';
import Brain from './pages/Brain';
import Router from './pages/Router';
import './styles/global.css';

export default function App() {
  return (
    <GatewayProvider>
      <Routes>
        {/* 连接页面 - 不需要认证 */}
        <Route path="/connect" element={<Connect />} />
        
        {/* 需要连接的页面 */}
        <Route
          path="/*"
          element={
            <RequireConnection>
              <div className="app-container">
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
              </div>
            </RequireConnection>
          }
        />
      </Routes>
    </GatewayProvider>
  );
}
