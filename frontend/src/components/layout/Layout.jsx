import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiUser, FiSend, FiClock,
  FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiMessageCircle
} from 'react-icons/fi';
import { useState } from 'react';
import useStore from '../../context/store';

const NAV = [
  { to: '/dashboard',  icon: FiGrid,          label: 'Dashboard'  },
  { to: '/companies',  icon: FiUsers,          label: 'Companies'  },
  { to: '/contacts',   icon: FiUser,           label: 'Contacts'   },
  { to: '/send',       icon: FiSend,           label: 'Send Message' },
  { to: '/history',    icon: FiClock,          label: 'History'    },
];

export default function Layout() {
  const { user, theme, toggleTheme, logout, setTheme } = useStore();
  const [open, setOpen] = useState(false);
  const navigate        = useNavigate();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      className="flex flex-col h-full w-64">

      {/* Logo */}
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <FiMessageCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>SMS Platform</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rwanda 🇷🇼</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-indigo-600 text-white'
                : 'hover:opacity-100 opacity-70'}`
            }
            style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme + user + logout */}
      <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
          {theme === 'dark'
            ? <><FiSun size={17} className="text-amber-400" /> Light Mode</>
            : <><FiMoon size={17} className="text-indigo-400" /> Dark Mode</>}
          <div className={`ml-auto w-10 h-5 rounded-full relative transition-all ${theme === 'light' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${theme === 'light' ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="p-1.5 rounded-lg transition-all hover:text-red-400"
            style={{ color: 'var(--text-muted)' }}>
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <Sidebar />
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setOpen(true)} style={{ color: 'var(--text-secondary)' }}>
            <FiMenu size={22} />
          </button>
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>SMS Platform</p>
          <button onClick={toggleTheme} style={{ color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
