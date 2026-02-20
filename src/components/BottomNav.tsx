import { NavLink } from 'react-router-dom';
import './BottomNav.css';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '💬', label: '对话' },
  { path: '/pulse', icon: '📊', label: '脉搏' },
  { path: '/brain', icon: '🧠', label: '大脑' },
  { path: '/router', icon: '⚡', label: '路由' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
