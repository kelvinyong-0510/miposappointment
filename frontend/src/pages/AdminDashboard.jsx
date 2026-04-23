import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import LeadsTable from '../components/LeadsTable';
import Analytics from '../components/Analytics';
import CalendarView from '../components/CalendarView';
import { Users, BarChart2, LogOut, CalendarDays, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Leads Pipeline', path: '/admin', icon: Users, desc: 'All appointments' },
    { name: 'Calendar View', path: '/admin/calendar', icon: CalendarDays, desc: 'Schedule overview' },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart2, desc: 'Performance stats' },
  ];

  const pageTitles = {
    '/admin': 'Leads Pipeline',
    '/admin/calendar': 'Calendar View',
    '/admin/analytics': 'Analytics',
  };
  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="flex bg-[#0B0F19] min-h-screen">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div className="w-64 hidden md:flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)' }}>

        {/* Logo block */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6600] flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-base leading-none tracking-wide">MIPOS</p>
              <p className="text-orange-400/80 text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5">Admin Portal</p>
            </div>
          </div>
          <div className="mt-6 h-px bg-white/10" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-3">Menu</p>
          {navItems.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative
                  ${isActive
                    ? 'bg-white/15 shadow-lg'
                    : 'hover:bg-white/8 hover:bg-opacity-10'
                  }`}
                style={isActive ? { background: 'rgba(255,102,0,0.2)' } : {}}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FF6600] rounded-r-full" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-[#FF6600] shadow-md shadow-orange-500/30' : 'bg-white/10 group-hover:bg-white/15'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-none ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{item.name}</p>
                  <p className={`text-[10px] mt-0.5 ${isActive ? 'text-orange-300/70' : 'text-white/30'}`}>{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="p-4 mx-4 mb-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-sm font-black">{(user.name || 'A')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name || 'Admin'}</p>
              <p className="text-white/40 text-xs truncate capitalize">{user.role || 'admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/30 hover:text-red-400 text-white/40 flex items-center justify-center transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-[#151C2C]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 relative z-10">
          <div>
            <h1 className="text-lg font-bold text-white">{currentTitle}</h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Mobile logout */}
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">{(user.name || 'A')[0].toUpperCase()}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          {/* Desktop: MIPOS pill badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-orange-600">Live System</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
          <Routes>
            <Route path="/" element={<LeadsTable />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
