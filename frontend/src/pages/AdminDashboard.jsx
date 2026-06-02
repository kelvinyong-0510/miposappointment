import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LeadsTable   from '../components/LeadsTable';
import Analytics    from '../components/Analytics';
import CalendarView from '../components/CalendarView';
import axios from 'axios';
import {
  Users, Calendar, BarChart2, LogOut, Menu, X,
  Search, Plus, Trash2, RefreshCw, MessageCircle,
  Edit2, Save, ChevronDown,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* ── Stage definitions matching the template layout ────────────────────── */
const LEAD_STAGES = [
  { key: 'New Lead',              label: 'New Lead',         color: '#3b82f6', dot: '#3b82f6' },
  { key: 'Appointment Confirmed', label: 'Appt Confirmed',  color: '#8b5cf6', dot: '#8b5cf6' },
  { key: 'Walk-In Arrived',       label: 'Walk-In Arrived', color: '#f59e0b', dot: '#f59e0b' },
  { key: 'Contacted',             label: 'Contacted',       color: '#ec4899', dot: '#ec4899' },
  { key: 'Demo Done',             label: 'Demo Done',       color: '#06b6d4', dot: '#06b6d4' },
];
const DEAL_STAGES = [
  { key: 'Quotation sent',  label: 'Quotation Sent', color: '#3b82f6', dot: '#3b82f6' },
  { key: 'Invoice sent',    label: 'Invoice Sent',   color: '#f59e0b', dot: '#f59e0b' },
  { key: 'Closed Won',      label: 'Won',            color: '#22c55e', dot: '#22c55e' },
  { key: 'Closed Lost',     label: 'Lost',           color: '#ef4444', dot: '#ef4444' },
  { key: 'Lost',            label: 'No Response',    color: '#9ca3af', dot: '#9ca3af' },
];

/* ── Pipeline funnel stages (template chevrons) ─────────────────────────── */
const FUNNEL_STAGES = [
  { key: 'New Lead',        label: 'New Lead',   bg: '#e5e7eb', text: '#374151' },
  { key: 'Contacted',       label: 'Contacted',  bg: '#dbeafe', text: '#1d4ed8' },
  { key: 'Walk-In Arrived', label: 'Interested', bg: '#fed7aa', text: '#c2410c' },
  { key: 'Demo Done',       label: 'Demo',       bg: '#ede9fe', text: '#7c3aed' },
  { key: 'Quotation sent',  label: 'Proposal',   bg: '#cffafe', text: '#0e7490' },
  { key: 'Closed Won',      label: 'Won',        bg: '#dcfce7', text: '#15803d' },
];

const STAGE_STYLE = {
  'New Lead':              { bg: '#eff6ff', text: '#1d4ed8',  dot: '#3b82f6' },
  'Appointment Confirmed': { bg: '#f5f3ff', text: '#6d28d9',  dot: '#8b5cf6' },
  'Walk-In Arrived':       { bg: '#fff7ed', text: '#c2410c',  dot: '#f97316' },
  'Demo Done':             { bg: '#ecfeff', text: '#0e7490',  dot: '#06b6d4' },
  'Contacted':             { bg: '#fdf4ff', text: '#86198f',  dot: '#d946ef' },
  'Quotation sent':        { bg: '#fefce8', text: '#a16207',  dot: '#eab308' },
  'Invoice sent':          { bg: '#f0fdfa', text: '#0f766e',  dot: '#14b8a6' },
  'Closed Won':            { bg: '#f0fdf4', text: '#15803d',  dot: '#22c55e' },
  'Closed Lost':           { bg: '#fef2f2', text: '#b91c1c',  dot: '#ef4444' },
  'Lost':                  { bg: '#f9fafb', text: '#6b7280',  dot: '#9ca3af' },
};

const ALL_STAGES = [...LEAD_STAGES, ...DEAL_STAGES].map(s => s.key);

const fmt = (n) => (n ?? 0).toLocaleString('en-MY');
const fmtWA = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.startsWith('0')) return '6' + d;
  if (!d.startsWith('60') && d.length > 8) return '60' + d;
  return d;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SHELL
══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({});
  const [stats, setStats]   = useState({});
  const [dark, setDark]     = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  /* fetch counts for sidebar badges */
  useEffect(() => {
    fetch(`${API_URL}/analytics`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
    fetch(`${API_URL}/leads`)
      .then(r => r.json())
      .then(leads => {
        if (!Array.isArray(leads)) return;
        const c = {};
        leads.forEach(l => { c[l.stage] = (c[l.stage] || 0) + 1; });
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const NavItem = ({ to, label, dot, count, icon: Icon }) => {
    const active = isActive(to);
    return (
      <button
        onClick={() => { navigate(to); setOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          width: '100%', padding: '7px 12px', borderRadius: 7,
          border: 'none', cursor: 'pointer', textAlign: 'left',
          background: active ? '#ff6500' : 'transparent',
          color:      active ? '#fff' : '#374151',
          fontFamily: 'var(--font-sans)', fontSize: '.813rem',
          fontWeight: active ? 700 : 500, transition: 'all .15s',
        }}
        className={!active ? 'hover:bg-gray-100' : ''}
      >
        {dot && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'rgba(255,255,255,.7)' : dot, flexShrink: 0, display: 'inline-block' }} />
        )}
        {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{label}</span>
        {count !== undefined && count > 0 && (
          <span style={{
            padding: '1px 7px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
            background: active ? 'rgba(255,255,255,.25)' : '#f3f4f6',
            color:      active ? '#fff' : '#374151',
          }}>{count}</span>
        )}
      </button>
    );
  };

  const SectionLabel = ({ label }) => (
    <p style={{ fontSize: '.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.1em', padding: '14px 12px 4px', margin: 0 }}>
      {label}
    </p>
  );

  /* ── Nav items config with emojis ──────────────────────────────────────── */
  const NAV_ITEMS = [
    { to: '/admin',           label: 'All Appointments', emoji: '🏠', exact: true },
    { to: '/admin/calendar',  label: 'Calendar',         emoji: '📅' },
    { to: '/admin/analytics', label: 'Analysis',         emoji: '📊' },
  ];

  const isExactActive = (to) => location.pathname === to;
  const isPrefixActive = (to) => location.pathname.startsWith(to) && to !== '/admin';

  const DarkNavItem = ({ to, label, emoji, count, exact }) => {
    const active = exact ? isExactActive(to) : (to === '/admin' ? isExactActive('/admin') : isPrefixActive(to));
    return (
      <button
        onClick={() => { navigate(to); setOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: 'none', cursor: 'pointer', textAlign: 'left',
          background: active ? 'rgba(180,70,20,0.35)' : 'transparent',
          color: active ? '#ff9a6c' : 'rgba(255,255,255,.65)',
          fontFamily: 'var(--font-sans)', fontSize: '.825rem',
          fontWeight: active ? 700 : 400, transition: 'all .15s',
          marginBottom: 1,
        }}
        className={!active ? 'hover:!bg-white/5 hover:!text-white' : ''}
      >
        <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>{emoji}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count > 0 && (
          <span style={{
            padding: '1px 8px', borderRadius: 99, fontSize: '.7rem', fontWeight: 700,
            background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)',
            minWidth: 24, textAlign: 'center',
          }}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)', background: '#f9fafb' }}>

      {/* ── Sidebar (always in flex flow on desktop) ─────────────────── */}
      <aside style={{
        width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#141822',
      }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center' }}>
          <img src="/mipos-logo.png" alt="MIPOS" style={{ height: 32, width: 'auto', borderRadius: 4 }} />
        </div>

        {/* Nav scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px 12px' }}>
          {NAV_ITEMS.map(n => <DarkNavItem key={n.to} to={n.to} label={n.label} emoji={n.emoji} exact={n.exact} />)}
        </div>

        {/* User area */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ff6500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '.75rem', flexShrink: 0 }}>
            {(user.name || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '.75rem', color: 'rgba(255,255,255,.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Admin'}</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.35)', margin: 0, textTransform: 'capitalize' }}>{user.role || 'staff'}</p>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.25)', padding: 4, display: 'flex', flexShrink: 0 }} title="Sign out"
            className="hover:!text-red-400">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', background: dark ? '#1e293b' : '#fff', borderBottom: dark ? '1px solid #334155' : '1px solid #e5e7eb', flexShrink: 0, transition: 'background .2s' }}>
          <h1 style={{ fontWeight: 700, fontSize: '.95rem', color: dark ? '#f1f5f9' : '#111827', margin: 0 }}>
            Customers Appointments Dashboard
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setDark(d => !d)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                border: dark ? '1px solid #475569' : '1px solid #e5e7eb',
                background: dark ? '#0f172a' : '#f9fafb',
                color: dark ? '#94a3b8' : '#6b7280',
                cursor: 'pointer', fontSize: '.75rem', fontWeight: 600,
                transition: 'all .2s',
              }}
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', background: dark ? '#0f172a' : '#f8fafc', transition: 'background .2s' }}>
          <Routes>
            <Route path="/"          element={<DashboardHome stats={stats} counts={counts} />} />
            <Route path="/leads"     element={<LeadsTable />} />
            <Route path="/calendar"  element={<CalendarView />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD HOME — redesigned appointment table
══════════════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

const STAGE_OPTIONS = ['New Lead','Appointment Confirmed','Walk-In Arrived','Contacted','Demo Done','Quotation sent','Invoice sent','Closed Won','Closed Lost','Lost'];
const FROM_OPTIONS  = ['Shopee','TikTok','Lazada','WhatsApp','Facebook','Others'];
const INDUSTRY_OPTIONS = ['F&B','Retail','Education','Healthcare','Wholesale','Others - Fish / Seafood','Others'];
const PURPOSE_OPTIONS  = ['POS System','Calling System','LED Board','Queue System','Cash Register','Others'];
const LANGUAGE_OPTIONS = ['English','Malay (Bahasa Melayu)','Mandarin','Tamil','Others'];
const STATE_OPTIONS    = ['Kuala Lumpur','Selangor','Johor','Penang','Kedah','Perak','Kelantan','Terengganu','Pahang','Negeri Sembilan','Melaka','Sabah','Sarawak','Perlis','Putrajaya','Labuan'];

const STAGE_PILL = {
  'New Lead':              { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6',  label: 'New Lead' },
  'Appointment Confirmed': { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6',  label: 'Appt Confirmed' },
  'Walk-In Arrived':       { bg: '#fff7ed', text: '#c2410c', dot: '#f97316',  label: 'Walk-In' },
  'Demo Done':             { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4',  label: 'Demo Done' },
  'Contacted':             { bg: '#fdf4ff', text: '#7c3aed', dot: '#a855f7',  label: 'Contacted' },
  'Quotation sent':        { bg: '#fefce8', text: '#a16207', dot: '#eab308',  label: 'Quotation' },
  'Invoice sent':          { bg: '#f0fdfa', text: '#0f766e', dot: '#14b8a6',  label: 'Invoice' },
  'Closed Won':            { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e',  label: 'Won' },
  'Closed Lost':           { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444',  label: 'Lost' },
  'Lost':                  { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af',  label: 'No Response' },
};

function StagePill({ stage }) {
  const s = STAGE_PILL[stage] || { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', label: stage || '—' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 99, fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap',
      background: s.bg, color: s.text, border: `1px solid ${s.dot}33`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function DashboardHome() {
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [editLead, setEditLead] = useState(null);   // lead being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);

  const fmtWA = (p) => {
    if (!p) return '';
    const d = p.replace(/\D/g, '');
    if (d.startsWith('0')) return '6' + d;
    if (!d.startsWith('60') && d.length > 8) return '60' + d;
    return d;
  };

  const loadLeads = () => {
    setLoading(true);
    fetch(`${API_URL}/leads`)
      .then(r => r.json())
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLeads(); }, []);

  const deleteLead = async (lead) => {
    if (!window.confirm(`Delete "${lead.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API_URL}/leads/${lead.id}`, { method: 'DELETE' });
      loadLeads();
    } catch(e) { console.error(e); }
  };

  const openEdit = (lead) => {
    const hasPOS = !!(lead.products_interest?.trim());
    setEditLead(lead);
    setEditForm({
      name:              lead.name || '',
      phone:             lead.phone || '',
      purpose:           lead.purpose || '',
      status:            lead.status || '',          // "From" field
      company:           lead.company || '',          // Industry
      stage:             lead.stage || 'New Lead',
      time_slot:         lead.time_slot || '',        // State/Location
      notes:             lead.notes || '',
      usedPOS:           hasPOS ? 'yes' : 'no',
      products_interest: lead.products_interest || '',
      quotation_no:      lead.quotation_no || '',
      invoice_no:        lead.invoice_no || '',
      date:              lead.date || '',
    });
  };

  const closeEdit = () => { setEditLead(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editLead) return;
    setSaving(true);
    try {
      const payload = {
        name:              editForm.name,
        phone:             editForm.phone,
        purpose:           editForm.purpose,
        status:            editForm.status,
        company:           editForm.company,
        stage:             editForm.stage,
        time_slot:         editForm.time_slot,
        notes:             editForm.notes,
        products_interest: editForm.usedPOS === 'yes' ? editForm.products_interest : '',
        quotation_no:      editForm.quotation_no,
        invoice_no:        editForm.invoice_no,
        date:              editForm.date,
      };
      const res = await fetch(`${API_URL}/leads/${editLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { closeEdit(); loadLeads(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !q
      || l.name?.toLowerCase().includes(q)
      || l.phone?.includes(q)
      || l.company?.toLowerCase().includes(q)
      || l.purpose?.toLowerCase().includes(q)
      || l.status?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goPage     = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const HEADERS = ['#', 'NAME', 'COMPANY', 'PURPOSE', 'DATE', 'TIME', 'STAGE', 'FROM', 'QUOTATION', 'INVOICE', 'PHONE', 'ACTIONS'];

  const th = (extra = {}) => ({
    padding: '10px 14px', textAlign: 'left', fontSize: '.68rem', fontWeight: 800,
    color: '#fff', whiteSpace: 'nowrap', letterSpacing: '.07em',
    background: '#ff6500', userSelect: 'none', ...extra,
  });

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb',
    borderRadius: 8, padding: '9px 12px', fontSize: '.85rem', color: '#111827',
    fontFamily: 'var(--font-sans)', outline: 'none', background: '#f8fafc',
    transition: 'border-color .15s', ...extra,
  });

  const sel = (extra = {}) => ({ ...inp(extra), cursor: 'pointer', appearance: 'auto' });

  /* ── field label ── */
  const FL = ({ children }) => (
    <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, color: '#374151', marginBottom: 5, letterSpacing: '.02em' }}>
      {children}
    </label>
  );

  return (
    <div style={{ padding: '20px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════════════════════════════
          TODAY'S APPOINTMENTS PANEL
      ══════════════════════════════════════════ */}
      {(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayLeads = leads.filter(l => l.date === todayStr);
        const dayName = new Date().toLocaleDateString('en-MY', { weekday: 'long' });
        const dateLabel = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });

        return (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
            marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
          }}>
            {/* Header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderBottom: todayLeads.length > 0 ? '1px solid #f3f4f6' : 'none',
              background: 'linear-gradient(90deg,#ff6500 0%,#ff8c40 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '.9rem', color: '#fff' }}>Today's Appointments</p>
                  <p style={{ margin: 0, fontSize: '.72rem', color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{dayName}, {dateLabel}</p>
                </div>
              </div>
              <span style={{
                background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 800,
                fontSize: '.8rem', padding: '3px 12px', borderRadius: 99,
                border: '1px solid rgba(255,255,255,.35)',
              }}>
                {todayLeads.length} {todayLeads.length === 1 ? 'appointment' : 'appointments'}
              </span>
            </div>

            {/* Cards row */}
            {todayLeads.length === 0 ? (
              <div style={{ padding: '20px 18px', textAlign: 'center', color: '#9ca3af', fontSize: '.83rem', fontWeight: 500 }}>
                🎉 No appointments scheduled for today
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, padding: '14px 18px', overflowX: 'auto', scrollbarWidth: 'thin' }}>
                {todayLeads.map((lead, i) => {
                  const sp = STAGE_PILL[lead.stage] || { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', label: lead.stage || 'Unknown' };
                  return (
                    <div key={lead.id} style={{
                      minWidth: 200, maxWidth: 220, flexShrink: 0,
                      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6,
                      boxShadow: '0 1px 3px rgba(0,0,0,.04)', transition: 'box-shadow .15s, border-color .15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,101,0,.12)'; e.currentTarget.style.borderColor = '#ff6500'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    onClick={() => openEdit(lead)}
                    >
                      {/* Row: number + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#ff6500', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '.68rem', fontWeight: 900, flexShrink: 0,
                        }}>{i + 1}</div>
                        <span style={{ fontSize: '.83rem', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lead.name || 'Unknown'}
                        </span>
                      </div>

                      {/* Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#6b7280' }}>
                        <span>🕐</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>{lead.time_slot || 'No time set'}</span>
                      </div>

                      {/* Purpose */}
                      {lead.purpose && (
                        <div style={{ fontSize: '.72rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📌 {lead.purpose}
                        </div>
                      )}

                      {/* Stage + WA */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 99, fontSize: '.65rem', fontWeight: 700,
                          background: sp.bg, color: sp.text, border: `1px solid ${sp.dot}33`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sp.dot, display: 'inline-block' }} />
                          {sp.label}
                        </span>
                        {lead.phone && (
                          <a href={`https://wa.me/${fmtWA(lead.phone)}`} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', textDecoration: 'none', flexShrink: 0 }}>
                            <MessageCircle size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Search bar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px 10px 0 0', padding: '10px 16px', borderBottom: 'none' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            placeholder="🔍  Search by name, phone number, purpose, company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '.83rem', color: '#111827', outline: 'none', fontFamily: 'var(--font-sans)', background: '#f9fafb' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0 0 10px 10px', overflow: 'hidden', flex: 1 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {HEADERS.map((h, i) => (
                  <th key={h} style={th(
                    i === 0  ? { width: 54, textAlign: 'center' } :
                    h === 'ACTIONS' ? { textAlign: 'center', width: 90 } : {}
                  )}>
                    {i === 0
                      ? <input type="checkbox" style={{ accentColor: '#fff' }} />
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {h}
                          {['STAGE','DATE','FROM'].includes(h) && <span style={{ opacity: .65, fontSize: '.6rem' }}>▼</span>}
                        </span>
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={HEADERS.length} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#ff6500', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading...
                  </div>
                </td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={HEADERS.length} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                  No records found
                </td></tr>
              ) : pageItems.map((lead, idx) => {
                const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;
                return (
                  <tr key={lead.id}
                    style={{ borderBottom: '1px solid #f3f4f6', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {/* # */}
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <input type="checkbox" style={{ accentColor: '#ff6500' }} />
                    </td>

                    {/* NAME */}
                    <td style={{ padding: '11px 14px', minWidth: 150 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '.72rem', color: '#9ca3af', fontWeight: 500, minWidth: 16 }}>{rowNum}</span>
                        <span
                          style={{ fontSize: '.83rem', fontWeight: 700, color: '#ff6500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onClick={() => openEdit(lead)}
                        >{lead.name || '—'}</span>
                      </div>
                    </td>

                    {/* COMPANY */}
                    <td style={{ padding: '11px 14px' }}>
                      {lead.company
                        ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: '.72rem', fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{lead.company}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                      }
                    </td>

                    {/* PURPOSE */}
                    <td style={{ padding: '11px 14px', fontSize: '.78rem', color: '#374151', maxWidth: 140 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.purpose || '—'}
                      </span>
                    </td>

                    {/* DATE */}
                    <td style={{ padding: '11px 14px', fontSize: '.78rem', color: '#374151', whiteSpace: 'nowrap' }}>
                      {lead.date || '—'}
                    </td>

                    {/* TIME */}
                    <td style={{ padding: '11px 14px', fontSize: '.78rem', color: '#374151', whiteSpace: 'nowrap' }}>
                      {lead.time_slot || '—'}
                    </td>

                    {/* STAGE */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <StagePill stage={lead.stage} />
                    </td>

                    {/* FROM */}
                    <td style={{ padding: '11px 14px', fontSize: '.78rem', color: '#374151', whiteSpace: 'nowrap' }}>
                      {lead.status || '—'}
                    </td>

                    {/* QUOTATION */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {lead.quotation_no
                        ? <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700, background: '#fefce8', color: '#a16207', border: '1px solid #fde68a', fontFamily: 'monospace' }}>{lead.quotation_no}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                      }
                    </td>

                    {/* INVOICE */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {lead.invoice_no
                        ? <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontFamily: 'monospace' }}>{lead.invoice_no}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                      }
                    </td>

                    {/* PHONE */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <a href={`https://wa.me/${fmtWA(lead.phone)}`} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                        <MessageCircle size={13} />{lead.phone || '—'}
                      </a>
                    </td>

                    {/* ACTIONS: edit + delete */}
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          onClick={() => openEdit(lead)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none',
                            background: '#fff7ed', color: '#ff6500', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,.08)', transition: 'all .15s', flexShrink: 0,
                          }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteLead(lead)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none',
                            background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,.08)', transition: 'all .15s', flexShrink: 0,
                          }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={() => goPage(safePage - 1)} disabled={safePage === 1}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: safePage === 1 ? '#d1d5db' : '#374151', fontSize: 14, fontWeight: 700 }}>‹</button>

          {(() => {
            const pages = []; const W = 2;
            for (let p = 1; p <= totalPages; p++) {
              if (p === 1 || p === totalPages || (p >= safePage - W && p <= safePage + W)) pages.push(p);
            }
            const result = []; let prev = null;
            for (const p of pages) { if (prev !== null && p - prev > 1) result.push('…'); result.push(p); prev = p; }
            return result.map((p, i) => p === '…'
              ? <span key={`e${i}`} style={{ color: '#9ca3af', fontSize: '.85rem', padding: '0 4px' }}>…</span>
              : <button key={p} onClick={() => goPage(p)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: p === safePage ? '#ff6500' : 'transparent', color: p === safePage ? '#fff' : '#374151', fontWeight: p === safePage ? 800 : 500, fontSize: '.83rem', cursor: 'pointer' }}>{p}</button>
            );
          })()}

          <button onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: safePage === totalPages ? '#d1d5db' : '#374151', fontSize: 14, fontWeight: 700 }}>›</button>

          <span style={{ marginLeft: 12, fontSize: '.75rem', color: '#9ca3af' }}>Page {safePage} of {totalPages}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {editLead && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Backdrop */}
          <div onClick={closeEdit} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,.45)', backdropFilter: 'blur(2px)' }} />

          {/* Modal card */}
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
            margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>
                Edit Appointment #{editLead.id}
              </h3>
            </div>

            {/* Body (scrollable) */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Row 1: Full Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FL>Full Name</FL>
                  <input style={inp()} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
                </div>
                <div>
                  <FL>Phone Number</FL>
                  <input style={inp()} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+601xxxxxxxx" />
                </div>
              </div>

              {/* Row 2: Needs Type + Lead Source (From) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FL>Needs Type</FL>
                  <select style={sel()} value={editForm.purpose} onChange={e => setEditForm(p => ({ ...p, purpose: e.target.value }))}>
                    <option value="">Select...</option>
                    {PURPOSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FL>From (Lead Source)</FL>
                  <select style={sel()} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="">Select...</option>
                    {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Industry + State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FL>Industry</FL>
                  <select style={sel()} value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}>
                    <option value="">Select...</option>
                    {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FL>Stage</FL>
                  <select style={sel()} value={editForm.stage} onChange={e => setEditForm(p => ({ ...p, stage: e.target.value }))}>
                    {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FL>Appointment Date</FL>
                  <input type="date" style={inp()} value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <FL>Time Slot</FL>
                  <input style={inp()} value={editForm.time_slot} onChange={e => setEditForm(p => ({ ...p, time_slot: e.target.value }))} placeholder="e.g. 10:00 AM" />
                </div>
              </div>

              {/* Row 5: Quotation No + Invoice No */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FL>Quotation No</FL>
                  <input style={inp({ background: '#fefce8', borderColor: '#fde68a' })} value={editForm.quotation_no} onChange={e => setEditForm(p => ({ ...p, quotation_no: e.target.value }))} placeholder="QT-0001" />
                </div>
                <div>
                  <FL>Invoice No</FL>
                  <input style={inp({ background: '#f0fdf4', borderColor: '#bbf7d0' })} value={editForm.invoice_no} onChange={e => setEditForm(p => ({ ...p, invoice_no: e.target.value }))} placeholder="INV-0001" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <FL>Internal Notes</FL>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Staff notes..."
                  style={{ ...inp(), resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
              <button onClick={closeEdit} style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#ff6500', color: '#fff', fontSize: '.85rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}