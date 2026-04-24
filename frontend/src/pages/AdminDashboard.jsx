import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import LeadsTable from '../components/LeadsTable';
import Analytics from '../components/Analytics';
import CalendarView from '../components/CalendarView';
import {
  LayoutDashboard, Users, Calendar, BarChart2,
  LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';

const NAV = [
  { to: '/admin',           label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/admin/leads',     label: 'Appointments', icon: Users },
  { to: '/admin/calendar',  label: 'Calendar',     icon: Calendar },
  { to: '/admin/analytics', label: 'Analytics',    icon: BarChart2 },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0f172a] text-white transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 orange-gradient shadow-lg shadow-orange-500/30 rounded-xl flex items-center justify-center font-black text-white text-lg">
            M
          </div>
          <div>
            <p className="font-bold text-sm leading-none text-white">MIPOS</p>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">ShopTech Admin</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full orange-gradient flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm">
              {(user.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role || 'staff'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Appointment Management</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full orange-gradient shadow-sm flex items-center justify-center text-xs font-black text-white">
              {(user.name || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/"         element={<DashboardHome />} />
            <Route path="/leads"    element={<LeadsTable />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── Dashboard Home ─────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [todayLeads, setTodayLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      fetch(`${API_URL}/analytics`).then(r => r.json()),
      fetch(`${API_URL}/leads?date=${today}`).then(r => r.json()),
    ]).then(([s, leads]) => {
      setStats(s);
      setTodayLeads(Array.isArray(leads) ? leads : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: "Total Appointments", value: stats.total ?? 0,         color: "bg-blue-500",   light: "bg-blue-50",   text: "text-blue-600"   },
    { label: "This Month",         value: stats.monthlyWalkIns ?? 0, color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
    { label: "Closed Won",         value: stats.won ?? 0,            color: "bg-green-500",  light: "bg-green-50",  text: "text-green-600"  },
    { label: "Pending",            value: stats.pending ?? 0,        color: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-600" },
  ] : [];

  const STAGE_COLOR = {
    'New Lead':             'bg-blue-100 text-blue-700',
    'Appointment Confirmed':'bg-violet-100 text-violet-700',
    'Walk-In Arrived':      'bg-purple-100 text-purple-700',
    'Demo Done':            'bg-amber-100 text-amber-700',
    'Quotation sent':       'bg-yellow-100 text-yellow-700',
    'Invoice sent':         'bg-teal-100 text-teal-700',
    'Closed Won':           'bg-green-100 text-green-700',
    'Closed Lost':          'bg-red-100 text-red-700',
    'Lost':                 'bg-red-100 text-red-700',
    'Contacted':            'bg-cyan-100 text-cyan-700',
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-gray-400">
      <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mr-3" />
      Loading dashboard...
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}! 👋</h2>
        <p className="text-gray-500 mt-1 text-sm">Here's what's happening with MIPOS appointments today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, light, text }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${light} ${text} rounded-xl flex items-center justify-center mb-4`}>
              <div className={`w-5 h-5 ${color} rounded-lg`} />
            </div>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Today's Appointments</h3>
            <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {todayLeads.length} today
          </span>
        </div>
        {todayLeads.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayLeads
              .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''))
              .map(lead => (
                <div key={lead.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full orange-gradient shadow-sm flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                    {(lead.name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.phone} · {lead.purpose || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{lead.time_slot || '—'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_COLOR[lead.stage] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.stage}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Conversion Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Conversion Rate</p>
            <p className="text-4xl font-black text-gray-900 relative z-10">{stats.conversionRate ?? 0}%</p>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden relative z-10">
              <div className="h-2 orange-gradient rounded-full transition-all" style={{ width: `${stats.conversionRate ?? 0}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Revenue (Paid)</p>
            <p className="text-4xl font-black text-green-500 relative z-10">RM {(stats.totalRevenue ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">Pending: RM {(stats.pendingRevenue ?? 0).toLocaleString('en-MY')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Lost Leads</p>
            <p className="text-4xl font-black text-red-500 relative z-10">{stats.lost ?? 0}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">out of {stats.total ?? 0} total leads</p>
          </div>
        </div>
      )}
    </div>
  );
}
