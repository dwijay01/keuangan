import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
  { path: '/transactions', icon: Receipt, label: 'Transaksi', emoji: '📝' },
  { path: '/goals', icon: Target, label: 'Kantong Target', emoji: '🎯' },
  { path: '/projections', icon: TrendingUp, label: 'Proyeksi', emoji: '📈' },
  { path: '/settings', icon: Settings, label: 'Pengaturan', emoji: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Wallet size={20} color="#000" />
            </div>
            <span className="sidebar-logo-text">Keuangan</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
            <button
              className="btn-icon btn-ghost"
              onClick={logout}
              title="Logout"
              style={{ marginLeft: 'auto' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
