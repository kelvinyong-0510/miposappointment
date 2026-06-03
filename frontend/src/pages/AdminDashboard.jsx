import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Analytics    from '../components/Analytics';
import CalendarView from '../components/CalendarView';
import SlotManager  from '../components/SlotManager';
import NewAppointmentModal from '../components/NewAppointmentModal';
import axios from 'axios';
import {
  LogOut, MessageCircle, Edit2, Trash2, Plus, Check, X,
  Search, UserCheck, UserX, Clock, Save,
} from 'lucide-react';
import { leadPurposeLabels, teamLabel, PURPOSES } from '../purposes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const fmtWA = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.startsWith('0')) return '6' + d;
  if (!d.startsWith('60') && d.length > 8) return '60' + d;
  return d;
};

const STAGE_PILL = {
  'New Lead':              { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'New' },
  'Appointment Confirmed': { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6', label: 'Confirmed' },
  'Walk-In Arrived':       { bg: '#fff7ed', text: '#c2410c', dot: '#f97316', label: 'Arrived' },
  'Demo Done':             { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4', label: 'Demo Done' },
  'Contacted':             { bg: '#fdf4ff', text: '#7c3aed', dot: '#a855f7', label: 'Contacted' },
  'Quotation sent':        { bg: '#fefce8', text: '#a16207', dot: '#eab308', label: 'Quotation' },
  'Invoice sent':          { bg: '#f0fdfa', text: '#0f766e', dot: '#14b8a6', label: 'Invoice' },
  'Closed Won':            { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Won' },
  'Closed Lost':           { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444', label: 'Cancelled' },
  'Lost':                  { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', label: 'No Response' },
};
const STAGE_OPTIONS = Object.keys(STAGE_PILL);

function StagePill({ stage }) {
  const s = STAGE_PILL[stage] || { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', label: stage || '—' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap', background: s.bg, color: s.text, border: `1px solid ${s.dot}33` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

function TeamBadge({ lead }) {
  const label = teamLabel(lead);
  if (label === '—') return <span style={{ color: '#d1d5db' }}>—</span>;
  const both = label === 'POS + CS';
  const pos  = label === 'POS Team';
  const bg = both ? '#f3e8ff' : pos ? 'rgba(255,101,0,.1)' : 'rgba(14,165,233,.1)';
  const fg = both ? '#7c3aed' : pos ? '#c2410c' : '#0369a1';
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: '.68rem', fontWeight: 800, background: bg, color: fg, whiteSpace: 'nowrap' }}>{label}</span>;
}

/* ═══ Date ranges ═══ */
const RANGES = [
  { key: 'today',     label: 'Today' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d',        label: 'Last 7 Days' },
  { key: '30d',       label: 'Last 30 Days' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'year',      label: 'This Year' },
  { key: 'all',       label: 'All' },
];
const DAY = 86400000;
function inRange(dateStr, key) {
  if (!dateStr) return key === 'all';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return key === 'all';
  const t = new Date(); t.setHours(0, 0, 0, 0);
  switch (key) {
    case 'today':     return d.getTime() === t.getTime();
    case 'upcoming':  return d.getTime() > t.getTime();
    case 'yesterday': return d.getTime() === t.getTime() - DAY;
    case '7d':        return d.getTime() <= t.getTime() && d.getTime() > t.getTime() - 7 * DAY;
    case '30d':       return d.getTime() <= t.getTime() && d.getTime() > t.getTime() - 30 * DAY;
    case 'lastMonth': { const lm = new Date(t.getFullYear(), t.getMonth() - 1, 1); return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth(); }
    case 'year':      return d.getFullYear() === t.getFullYear();
    case 'all':       return true;
    default:          return true;
  }
}
const timeMin = (s) => { const m = String(s || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if (!m) return 9999; let h = +m[1]; if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12; if (m[3].toUpperCase() === 'AM' && h === 12) h = 0; return h * 60 + (+m[2]); };

/* ═══════════════════════════════════════════════════════════════
   SHELL
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const NAV = [
    { to: '/admin',           label: 'Appointments', emoji: '📋', exact: true },
    { to: '/admin/calendar',  label: 'Calendar',     emoji: '📅' },
    { to: '/admin/slots',     label: 'Time Slots',   emoji: '🕐' },
    { to: '/admin/analytics', label: 'Analysis',     emoji: '📊' },
  ];
  const active = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)', background: '#f4f6f9' }}>
      <aside style={{ width: 212, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0a1628' }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <img src="/mipos-logo.png" alt="MIPOS" style={{ height: 32, borderRadius: 4 }} />
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV.map(n => {
            const on = active(n.to, n.exact);
            return (
              <button key={n.to} onClick={() => navigate(n.to)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                background: on ? 'rgba(255,101,0,.16)' : 'transparent', color: on ? '#ff8c42' : 'rgba(255,255,255,.62)', fontFamily: 'var(--font-sans)', fontSize: '.83rem', fontWeight: on ? 700 : 500,
              }}><span style={{ fontSize: '1rem' }}>{n.emoji}</span>{n.label}</button>
            );
          })}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ff6500', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#fff', fontSize: '.75rem' }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '.75rem', color: 'rgba(255,255,255,.85)', margin: 0 }}>Admin</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.35)', margin: 0 }}>MIPOS ShopTech</p>
          </div>
          <a href="https://appointment.mipos.me" title="Booking page" style={{ color: 'rgba(255,255,255,.3)', display: 'flex' }}><LogOut size={14} /></a>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/"          element={<AppointmentsView />} />
          <Route path="/calendar"  element={<CalendarView />} />
          <Route path="/slots"     element={<SlotManager />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENTS VIEW
═══════════════════════════════════════════════════════════════ */
function AppointmentsView() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState('today');
  const [search, setSearch]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead]     = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API_URL}/leads`).then(r => setLeads(Array.isArray(r.data) ? r.data : [])).catch(() => setLeads([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const counts = {};
  RANGES.forEach(r => { counts[r.key] = leads.filter(l => inRange(l.date, r.key)).length; });

  const q = search.toLowerCase();
  const filtered = leads
    .filter(l => inRange(l.date, range))
    .filter(l => !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q) || (l.purpose || '').toLowerCase().includes(q))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || timeMin(a.time_slot) - timeMin(b.time_slot));

  const attended = filtered.filter(l => l.attendance === 'attended').length;
  const noShow   = filtered.filter(l => l.attendance === 'no_show').length;
  const posCount = filtered.filter(l => l.needs_pos).length;
  const csCount  = filtered.filter(l => l.needs_cs).length;

  const setAttendance = async (lead, value) => {
    const next = lead.attendance === value ? null : value;
    setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, attendance: next } : l));
    try { await axios.put(`${API_URL}/leads/${lead.id}`, { attendance: next }); } catch { load(); }
  };
  const removeLead = async (lead) => {
    if (!window.confirm(`Delete appointment for "${lead.name || lead.phone}"? This cannot be undone.`)) return;
    await axios.delete(`${API_URL}/leads/${lead.id}`); load();
  };

  return (
    <div style={{ padding: '22px 24px', maxWidth: 1180, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a202c', letterSpacing: '-.02em', margin: 0 }}>Appointments</h1>
          <p style={{ color: '#6b7280', fontSize: '.85rem', margin: '3px 0 0' }}>Walk-in bookings, attendance & scheduling</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-brand" style={{ padding: '11px 20px', borderRadius: 24 }}>
          <Plus size={16} /> New Appointment
        </button>
      </div>

      {/* Range pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {RANGES.map(r => {
          const on = range === r.key;
          return (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '.8rem', fontWeight: 700,
              border: on ? '1.5px solid #ff6500' : '1.5px solid #e5e7eb', background: on ? '#ff6500' : '#fff', color: on ? '#fff' : '#4a5568', transition: 'all .15s',
            }}>
              {r.label}
              <span style={{ padding: '0 7px', borderRadius: 99, fontSize: '.7rem', fontWeight: 800, background: on ? 'rgba(255,255,255,.25)' : '#f3f4f6', color: on ? '#fff' : '#6b7280' }}>{counts[r.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Appointments" value={filtered.length} color="#1a202c" />
        <Stat label="Attended" value={attended} color="#059669" />
        <Stat label="No-show" value={noShow} color="#dc2626" />
        <Stat label="POS Team" value={posCount} color="#ff6500" />
        <Stat label="CS Team" value={csCount} color="#0ea5e9" />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input placeholder="Search name, phone, company, purpose…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 38px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '.86rem', outline: 'none', fontFamily: 'var(--font-sans)', background: '#fff', color: '#111827' }} />
      </div>

      {/* List */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
            <thead>
              <tr style={{ background: '#0a1628' }}>
                {['When', 'Customer', 'Purpose', 'Team', 'Attendance', 'Stage', ''].map((h, i) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: i === 4 ? 'center' : 'left', color: 'rgba(255,255,255,.85)', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#9ca3af' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#9ca3af' }}>No appointments in this range.</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  {/* When */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#1a202c' }}>{lead.date || '—'}</div>
                    <div style={{ fontSize: '.74rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{lead.time_slot || '—'}</div>
                  </td>
                  {/* Customer */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#1a202c', cursor: 'pointer' }} onClick={() => setEditLead(lead)}>{lead.name || '—'}</div>
                    {lead.phone && (
                      <a href={`https://wa.me/${fmtWA(lead.phone)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.74rem', color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
                        <MessageCircle size={11} />{lead.phone}
                      </a>
                    )}
                    {lead.company && <div style={{ fontSize: '.72rem', color: '#9ca3af' }}>{lead.company}</div>}
                  </td>
                  {/* Purpose */}
                  <td style={{ padding: '11px 14px', maxWidth: 200 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {leadPurposeLabels(lead).slice(0, 3).map((p, i) => (
                        <span key={i} style={{ padding: '2px 8px', borderRadius: 6, fontSize: '.68rem', fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>{p}</span>
                      ))}
                    </div>
                  </td>
                  {/* Team */}
                  <td style={{ padding: '11px 14px' }}><TeamBadge lead={lead} /></td>
                  {/* Attendance */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setAttendance(lead, 'attended')} title="Attended" style={attBtn(lead.attendance === 'attended', 'green')}>
                        <UserCheck size={14} />{lead.attendance === 'attended' ? 'Attended' : ''}
                      </button>
                      <button onClick={() => setAttendance(lead, 'no_show')} title="No-show" style={attBtn(lead.attendance === 'no_show', 'red')}>
                        <UserX size={14} />{lead.attendance === 'no_show' ? 'No-show' : ''}
                      </button>
                    </div>
                  </td>
                  {/* Stage */}
                  <td style={{ padding: '11px 14px' }}><StagePill stage={lead.stage} /></td>
                  {/* Actions */}
                  <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setEditLead(lead)} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fff7ed', color: '#ff6500', cursor: 'pointer', marginRight: 6 }}><Edit2 size={13} /></button>
                    <button onClick={() => removeLead(lead)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <NewAppointmentModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {editLead   && <EditModal lead={editLead} onClose={() => setEditLead(null)} onSaved={load} />}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color, letterSpacing: '-.02em', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const attBtn = (on, color) => {
  const c = color === 'green' ? { bg: 'rgba(16,185,129,.12)', fg: '#059669', bd: 'rgba(16,185,129,.4)' } : { bg: 'rgba(239,68,68,.1)', fg: '#dc2626', bd: 'rgba(239,68,68,.4)' };
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: on ? '5px 11px' : '5px 8px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '.72rem', fontWeight: 700,
    border: on ? `1.5px solid ${c.bd}` : '1.5px solid #e5e7eb', background: on ? c.bg : '#fff', color: on ? c.fg : '#9ca3af', transition: 'all .15s',
  };
};

/* ═══ Edit modal ═══ */
const einp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: '.85rem', fontFamily: 'var(--font-sans)', outline: 'none', background: '#f9fafb', color: '#111827' };
const ELabel = ({ children }) => <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{children}</label>;

function EditModal({ lead, onClose, onSaved }) {
  const initialPurposes = (() => { try { return lead.purposes ? JSON.parse(lead.purposes) : []; } catch { return []; } })();
  const [f, setF] = useState({
    name: lead.name || '', phone: lead.phone || '', company: lead.company || '',
    date: lead.date || '', time_slot: lead.time_slot || '',
    purposes: Array.isArray(initialPurposes) ? initialPurposes : [],
    stage: lead.stage || 'New Lead', attendance: lead.attendance || '',
    quotation_no: lead.quotation_no || '', invoice_no: lead.invoice_no || '', notes: lead.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const togglePurpose = key => setF(p => ({ ...p, purposes: p.purposes.includes(key) ? p.purposes.filter(k => k !== key) : [...p.purposes, key] }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/leads/${lead.id}`, {
        name: f.name, phone: f.phone, company: f.company, date: f.date, time_slot: f.time_slot,
        purposes: f.purposes, purpose: f.purposes.map(k => PURPOSES.find(p => p.key === k)?.en || k).join(', '),
        stage: f.stage, attendance: f.attendance || null,
        quotation_no: f.quotation_no, invoice_no: f.invoice_no, notes: f.notes,
      });
      onSaved?.(); onClose?.();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>Edit Appointment #{lead.id}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 22, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><ELabel>Full Name</ELabel><input style={einp} value={f.name} onChange={e => set('name', e.target.value)} /></div>
            <div><ELabel>Phone</ELabel><input style={einp} value={f.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><ELabel>Company</ELabel><input style={einp} value={f.company} onChange={e => set('company', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><ELabel>Date</ELabel><input type="date" style={einp} value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div><ELabel>Time Slot</ELabel><input style={einp} value={f.time_slot} onChange={e => set('time_slot', e.target.value)} placeholder="e.g. 10:00 AM" /></div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <ELabel>Purpose</ELabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PURPOSES.map(p => {
                const on = f.purposes.includes(p.key);
                return <button type="button" key={p.key} onClick={() => togglePurpose(p.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '.76rem', fontWeight: 600, fontFamily: 'var(--font-sans)', border: on ? '1.5px solid #ff6500' : '1.5px solid #e5e7eb', background: on ? 'rgba(255,101,0,.08)' : '#fff', color: on ? '#ff6500' : '#4a5568' }}>{on && <Check size={11} />}{p.en}</button>;
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <ELabel>Attendance</ELabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['attended', 'Attended', 'green'], ['no_show', 'No-show', 'red']].map(([v, lbl, col]) => (
                  <button key={v} type="button" onClick={() => set('attendance', f.attendance === v ? '' : v)} style={{ ...attBtn(f.attendance === v, col), flex: 1, justifyContent: 'center', padding: '8px' }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <ELabel>Stage</ELabel>
              <select style={{ ...einp, cursor: 'pointer' }} value={f.stage} onChange={e => set('stage', e.target.value)}>
                {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><ELabel>Quotation No</ELabel><input style={einp} value={f.quotation_no} onChange={e => set('quotation_no', e.target.value)} placeholder="QT-0001" /></div>
            <div><ELabel>Invoice No</ELabel><input style={einp} value={f.invoice_no} onChange={e => set('invoice_no', e.target.value)} placeholder="INV-0001" /></div>
          </div>
          <div><ELabel>Notes</ELabel><textarea rows={2} style={{ ...einp, resize: 'vertical' }} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" /></div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} className="btn-brand" style={{ padding: '9px 22px', borderRadius: 8, opacity: saving ? .7 : 1 }}><Save size={15} />{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
