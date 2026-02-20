import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Chat from './pages/Chat';
import Pulse from './pages/Pulse';
import Brain from './pages/Brain';
import Router from './pages/Router';
import './styles/global.css';

export default function App() {
  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/router" element={<Router />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
