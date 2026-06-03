import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, MessageCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { normalizePhone } from '../phone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* ── Purpose → colour mapping (matches second pic options) ── */
const PURPOSE_COLORS = {
  'POS System':              { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6',  bar: '#3b82f6'  },
  'Hardware Devices (Sunmi)':{ bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6',  bar: '#8b5cf6'  },
  'Technical Support':       { bg: '#fff7ed', text: '#c2410c', dot: '#f97316',  bar: '#f97316'  },
  'LED Board':               { bg: '#fefce8', text: '#a16207', dot: '#eab308',  bar: '#eab308'  },
  'Pager System':            { bg: '#fdf4ff', text: '#7c3aed', dot: '#a855f7',  bar: '#a855f7'  },
  'Queue System':            { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4',  bar: '#06b6d4'  },
  'Calling System':          { bg: '#f0fdfa', text: '#0f766e', dot: '#14b8a6',  bar: '#14b8a6'  },
  'Others':                  { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af',  bar: '#9ca3af'  },
};

const PURPOSE_LIST = Object.keys(PURPOSE_COLORS);

/* Fallback colour for unknown purposes */
function getPurposeColor(purpose) {
  if (!purpose) return PURPOSE_COLORS['Others'];
  return PURPOSE_COLORS[purpose] || PURPOSE_COLORS['Others'];
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_HEADERS = ['SU','MO','TU','WE','TH','FR','SA'];

function toDateStr(d) { return d.toISOString().slice(0, 10); }
function parseLocal(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtWA(p) {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.startsWith('0')) return '6' + d;
  if (!d.startsWith('60') && d.length > 8) return '60' + d;
  return d;
}

const STAGE_OPTIONS = ['New Lead','Appointment Confirmed','Walk-In Arrived','Contacted',
                       'Demo Done','Quotation sent','Invoice sent','Closed Won','Closed Lost','Lost'];

export default function CalendarView() {
  const [leads,       setLeads]       = useState([]);
  const [today]                       = useState(new Date());
  const [viewDate,    setViewDate]    = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [dragLead,    setDragLead]    = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  /* Add modal */
  const [showAdd,  setShowAdd]  = useState(false);
  const [addForm,  setAddForm]  = useState({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: 'POS System', stage: 'New Lead', status: '' });
  const [addSaving, setAddSaving] = useState(false);

  /* Edit modal */
  const [editLead, setEditLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchLeads = useCallback((silent = false) => {
    fetch(`${API_URL}/leads`)
      .then(r => r.json())
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .catch(() => { if (!silent) setLeads([]); });
  }, []);

  // Initial load + auto-refresh every 15s so the calendar stays current.
  useEffect(() => {
    fetchLeads();
    const id = setInterval(() => fetchLeads(true), 15000);
    return () => clearInterval(id);
  }, [fetchLeads]);

  // Drag-to-reschedule: move an appointment to another day (keeps its time slot).
  const reschedule = async (lead, newDate) => {
    if (!lead || !newDate || lead.date === newDate) return;
    setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, date: newDate } : l)); // optimistic
    try {
      await fetch(`${API_URL}/leads/${lead.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });
    } finally { fetchLeads(true); }
  };
  const primaryPurpose = (lead) => (lead.purpose || '').split(',')[0].trim();

  /* ── Calendar maths ── */
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth  = new Date(year, month, 1);
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  /* Sunday-first */
  const startOffset   = firstOfMonth.getDay();

  const leadsByDate = leads.reduce((acc, l) => {
    if (!l.date) return acc;
    const key = l.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  const todayStr   = toDateStr(today);
  const prevMonth  = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth  = () => setViewDate(new Date(year, month + 1, 1));
  const goToday    = () => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr); };

  const dayLeads = selectedDay ? (leadsByDate[selectedDay] || []).slice().sort((a,b) => (a.time_slot||'').localeCompare(b.time_slot||'')) : [];

  /* ── Add appointment ── */
  const submitAdd = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      await fetch(`${API_URL}/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      setShowAdd(false);
      setAddForm({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: 'POS System', stage: 'New Lead', status: '' });
      fetchLeads();
    } catch(e){ console.error(e); }
    finally { setAddSaving(false); }
  };

  /* ── Edit appointment ── */
  const openEdit = (lead) => {
    setEditLead(lead);
    setEditForm({ name: lead.name||'', phone: lead.phone||'', company: lead.company||'', purpose: lead.purpose||'', stage: lead.stage||'New Lead', status: lead.status||'', date: lead.date||'', time_slot: lead.time_slot||'', notes: lead.notes||'' });
  };
  const submitEdit = async () => {
    if (!editLead) return;
    setEditSaving(true);
    try {
      await fetch(`${API_URL}/leads/${editLead.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setEditLead(null);
      fetchLeads(true);
    } catch(e){ console.error(e); }
    finally { setEditSaving(false); }
  };

  /* ── Delete appointment (syncs to DB + Google Calendar) ── */
  const deleteLead = async (lead) => {
    if (!lead) return;
    if (!window.confirm(`Delete appointment for "${lead.name || lead.phone}"? This also removes it from Google Calendar.`)) return;
    try {
      await fetch(`${API_URL}/leads/${lead.id}`, { method: 'DELETE' });
      setEditLead(null);
      fetchLeads(true);
    } catch(e){ console.error(e); }
  };

  /* ── Styles ── */
  const inp = (extra={}) => ({
    width:'100%', boxSizing:'border-box', border:'1px solid #e5e7eb',
    borderRadius:8, padding:'8px 12px', fontSize:'.85rem', color:'#111827',
    fontFamily:'inherit', outline:'none', background:'#f8fafc', ...extra,
  });
  const sel = (extra={}) => ({ ...inp(extra), cursor:'pointer' });
  const FL  = ({ children }) => (
    <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', marginBottom:4, letterSpacing:'.03em', textTransform:'uppercase' }}>{children}</label>
  );

  /* cells: null for empty prefix, number for day */
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  /* pad to full rows */
  while (cells.length % 7 !== 0) cells.push(null);

  /* ── RENDER ── */
  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)', overflow:'hidden', background:'#f4f6f8' }}>

      {/* ══════════════════════════════════════════
          CALENDAR GRID COLUMN
      ══════════════════════════════════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'14px 16px', gap:12 }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          {/* Left: nav */}
          <div style={{ display:'flex', alignItems:'center', gap:16, paddingLeft: 8 }}>
            <button onClick={prevMonth} style={{ border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
              <ChevronLeft size={22} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <select value={month} onChange={e => setViewDate(new Date(year, parseInt(e.target.value), 1))} style={{ fontSize:'1.2rem', fontWeight:800, border:'none', background:'transparent', outline:'none', cursor:'pointer', color:'#111827', appearance:'none', paddingRight:18, backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right center' }}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.substring(0,3)}</option>)}
              </select>
              <select value={year} onChange={e => setViewDate(new Date(parseInt(e.target.value), month, 1))} style={{ fontSize:'1.2rem', fontWeight:800, border:'none', background:'transparent', outline:'none', cursor:'pointer', color:'#111827', appearance:'none', paddingRight:18, backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right center' }}>
                {[2024,2025,2026,2027,2028,2029].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={nextMonth} style={{ border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Right: Today + Add */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={goToday} style={{ padding:'6px 16px', borderRadius:8, border:'none', background:'#111827', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer' }}>Today</button>
            <button onClick={() => setShowAdd(true)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#ff6500', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        {/* Calendar card */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>

          {/* Day-of-week headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
            {DAY_HEADERS.map(h => (
              <div key={h} style={{ padding:'9px 0', textAlign:'center', fontSize:'.68rem', fontWeight:800, color:'#ff6500', letterSpacing:'.08em' }}>{h}</div>
            ))}
          </div>

          {/* Grid — rows fill remaining height */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {(() => {
              /* split cells into rows of 7 */
              const rows = [];
              for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
              const rowH = `${100 / rows.length}%`;
              return rows.map((row, rIdx) => (
                <div key={rIdx} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flex:'1 0 0', borderBottom: rIdx < rows.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  {row.map((day, cIdx) => {
                    if (!day) return (
                      <div key={`e-${rIdx}-${cIdx}`} style={{ borderRight: cIdx < 6 ? '1px solid #e2e8f0' : 'none', background:'#f8fafb' }} />
                    );

                    const ds      = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const dLeads  = leadsByDate[ds] || [];
                    const isToday = ds === todayStr;
                    const isSel   = ds === selectedDay;
                    const isDragOver = dragOverDay === ds;

                    return (
                      <div key={ds}
                        onClick={() => setSelectedDay(isSel ? null : ds)}
                        onDragOver={e => { e.preventDefault(); if (dragOverDay !== ds) setDragOverDay(ds); }}
                        onDragLeave={() => setDragOverDay(d => d === ds ? null : d)}
                        onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setDragOverDay(null); setDragLead(null); const lead = leads.find(l => String(l.id) === id); if (lead) reschedule(lead, ds); }}
                        style={{
                          borderRight: cIdx < 6 ? '1px solid #e2e8f0' : 'none',
                          padding:'8px 10px', cursor:'pointer', overflow:'hidden',
                          background: isSel ? '#fff7f0' : '#fff',
                          boxShadow: isDragOver ? 'inset 0 0 0 2px #ff6500, inset 0 0 0 999px rgba(255,101,0,.09)' : isSel ? 'inset 0 0 0 2px #ff6500' : 'none',
                          transition:'background .1s', display:'flex', flexDirection:'column',
                        }}
                        onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='#fff7f0'; }}
                        onMouseLeave={e => { if(!isSel) e.currentTarget.style.background='#fff'; }}
                      >
                        {/* Day number */}
                        <div style={{
                          width:26, height:26, borderRadius:'50%', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'.82rem', fontWeight: isToday ? 800 : 700,
                          color: isToday ? '#fff' : isSel ? '#ff6500' : '#111827',
                          background: isToday ? '#ff6500' : 'transparent',
                          marginBottom:4,
                        }}>{day}</div>

                        {/* Event pills */}
                        <div style={{ display:'flex', flexDirection:'column', gap:2, flex:1, overflow:'hidden' }}>
                          {dLeads.slice(0, 3).map(lead => {
                            const c = getPurposeColor(primaryPurpose(lead));
                            const dragging = dragLead?.id === lead.id;
                            return (
                              <div key={lead.id}
                                draggable
                                onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', String(lead.id)); e.dataTransfer.effectAllowed = 'move'; setDragLead(lead); }}
                                onDragEnd={() => { setDragLead(null); setDragOverDay(null); }}
                                onClick={e => { e.stopPropagation(); openEdit(lead); }}
                                title={`${lead.name} · ${lead.time_slot || 'no time'} — drag to another day to reschedule`}
                                style={{
                                  display:'flex', alignItems:'center',
                                  background: c.bg, color: c.text,
                                  borderLeft: `3px solid ${c.bar}`,
                                  padding:'1px 5px', borderRadius:'0 3px 3px 0',
                                  fontSize:'.63rem', fontWeight:600,
                                  overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                                  cursor:'grab', opacity: dragging ? .4 : 1,
                                }}>
                                <span style={{ overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{lead.name}</span>
                              </div>
                            );
                          })}
                          {dLeads.length > 3 && (
                            <span style={{ fontSize:'.6rem', color:'#94a3b8' }}>+{dLeads.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:14, flexShrink:0 }}>
          {PURPOSE_LIST.map(p => {
            const c = PURPOSE_COLORS[p];
            return (
              <div key={p} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.68rem', color:'#374151', fontWeight:600 }}>
                <span style={{ width:9, height:9, borderRadius:2, background:c.bar, flexShrink:0 }} />
                {p}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SIDE PANEL — selected day
      ══════════════════════════════════════════ */}
      <div style={{
        width: selectedDay ? 320 : 0,
        minWidth: selectedDay ? 320 : 0,
        overflow:'hidden', transition:'width .2s ease, min-width .2s ease',
        borderLeft:'1px solid #e5e7eb', background:'#fff', display:'flex', flexDirection:'column',
        flexShrink:0,
      }}>
        {selectedDay && (
          <>
            {/* Panel header */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
              <div>
                <p style={{ fontSize:'.68rem', color:'#9ca3af', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', margin:0 }}>Appointments</p>
                <p style={{ fontWeight:800, fontSize:'.9rem', color:'#111827', margin:'2px 0 0' }}>
                  {parseLocal(selectedDay).toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
                <span style={{ display:'inline-block', marginTop:4, background:'#fff7ed', color:'#ff6500', fontSize:'.7rem', fontWeight:800, padding:'1px 8px', borderRadius:99 }}>
                  {dayLeads.length}
                </span>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', flexShrink:0 }}>
                <X size={14} />
              </button>
            </div>

            {/* Appointment list */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {dayLeads.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', fontSize:'.83rem', textAlign:'center', padding:24 }}>
                  <span style={{ fontSize:'2rem', marginBottom:8 }}>📭</span>
                  No appointments for this day
                </div>
              ) : dayLeads.map(lead => {
                const c = getPurposeColor(lead.purpose);
                return (
                  <div key={lead.id} style={{ borderBottom:'1px solid #f3f4f6', padding:'12px 16px', transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    {/* Time + purpose pill */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:'.75rem', fontWeight:700, color:'#374151' }}>🕐 {lead.time_slot || 'No time'}</span>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:'.62rem', fontWeight:700, background:c.bg, color:c.text, border:`1px solid ${c.dot}44` }}>
                        {lead.purpose || 'Others'}
                      </span>
                    </div>

                    {/* Name */}
                    <p style={{ fontWeight:800, fontSize:'.88rem', color:'#111827', margin:'0 0 4px' }}>{lead.name}</p>

                    {/* Company */}
                    {lead.company && <p style={{ fontSize:'.72rem', color:'#6b7280', margin:'0 0 2px' }}>🏢 {lead.company}</p>}

                    {/* Stage */}
                    <p style={{ fontSize:'.72rem', color:'#6b7280', margin:'0 0 8px' }}>📌 {lead.stage || 'New Lead'}</p>

                    {/* Actions */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {lead.phone && (
                        <a href={`https://wa.me/${fmtWA(lead.phone)}`} target="_blank" rel="noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'#dcfce7', color:'#16a34a', fontSize:'.72rem', fontWeight:700, textDecoration:'none' }}>
                          <MessageCircle size={11} /> {lead.phone}
                        </a>
                      )}
                      <button onClick={() => openEdit(lead)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'#fff7ed', color:'#ff6500', fontSize:'.72rem', fontWeight:700, border:'none', cursor:'pointer' }}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => deleteLead(lead)} title="Delete" style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'#fef2f2', color:'#ef4444', fontSize:'.72rem', fontWeight:700, border:'none', cursor:'pointer' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add from panel */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6', flexShrink:0 }}>
              <button onClick={() => { setAddForm(f => ({ ...f, date: selectedDay })); setShowAdd(true); }}
                style={{ width:'100%', padding:'9px', borderRadius:8, border:'1px dashed #ff6500', background:'#fff7ed', color:'#ff6500', fontWeight:700, fontSize:'.8rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <Plus size={13} /> Add Appointment for this day
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          ADD APPOINTMENT MODAL
      ══════════════════════════════════════════ */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={() => setShowAdd(false)} style={{ position:'absolute', inset:0, background:'rgba(17,24,39,.45)', backdropFilter:'blur(2px)' }} />
          <div style={{ position:'relative', background:'#fff', borderRadius:16, width:'100%', maxWidth:500, margin:'0 16px', boxShadow:'0 20px 60px rgba(0,0,0,.18)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontWeight:800, fontSize:'1rem', color:'#111827', margin:0 }}>Add Appointment</h3>
              <button onClick={() => setShowAdd(false)} style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}><X size={14}/></button>
            </div>
            <form onSubmit={submitAdd} style={{ padding:'18px 22px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'span 2' }}>
                  <FL>Customer Name *</FL>
                  <input required style={inp()} value={addForm.name} onChange={e => setAddForm(p=>({...p,name:e.target.value}))} placeholder="Full Name" />
                </div>
                <div>
                  <FL>Phone *</FL>
                  <input required style={inp()} value={addForm.phone} onChange={e => setAddForm(p=>({...p,phone:e.target.value}))} onBlur={e => setAddForm(p=>({...p,phone:normalizePhone(e.target.value)}))} placeholder="012-3456789" />
                </div>
                <div>
                  <FL>Company / Industry</FL>
                  <input style={inp()} value={addForm.company} onChange={e => setAddForm(p=>({...p,company:e.target.value}))} placeholder="e.g. F&B" />
                </div>
                <div>
                  <FL>Date *</FL>
                  <input required type="date" style={inp()} value={addForm.date} onChange={e => setAddForm(p=>({...p,date:e.target.value}))} />
                </div>
                <div>
                  <FL>Time Slot</FL>
                  <input style={inp()} value={addForm.time_slot} onChange={e => setAddForm(p=>({...p,time_slot:e.target.value}))} placeholder="e.g. 10:00 AM" />
                </div>
                <div>
                  <FL>Purpose</FL>
                  <select style={sel()} value={addForm.purpose} onChange={e => setAddForm(p=>({...p,purpose:e.target.value}))}>
                    {PURPOSE_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FL>Stage</FL>
                  <select style={sel()} value={addForm.stage} onChange={e => setAddForm(p=>({...p,stage:e.target.value}))}>
                    {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding:'8px 20px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontWeight:700, fontSize:'.85rem', cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={addSaving} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#ff6500', color:'#fff', fontWeight:800, fontSize:'.85rem', cursor:'pointer', opacity:addSaving?.7:1 }}>
                  {addSaving ? 'Saving…' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT APPOINTMENT MODAL
      ══════════════════════════════════════════ */}
      {editLead && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={() => setEditLead(null)} style={{ position:'absolute', inset:0, background:'rgba(17,24,39,.45)', backdropFilter:'blur(2px)' }} />
          <div style={{ position:'relative', background:'#fff', borderRadius:16, width:'100%', maxWidth:500, margin:'0 16px', boxShadow:'0 20px 60px rgba(0,0,0,.18)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontWeight:800, fontSize:'1rem', color:'#111827', margin:0 }}>Edit Appointment #{editLead.id}</h3>
              <button onClick={() => setEditLead(null)} style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}><X size={14}/></button>
            </div>
            <div style={{ padding:'18px 22px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <FL>Full Name</FL>
                  <input style={inp()} value={editForm.name} onChange={e => setEditForm(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <FL>Phone</FL>
                  <input style={inp()} value={editForm.phone} onChange={e => setEditForm(p=>({...p,phone:e.target.value}))} onBlur={e => setEditForm(p=>({...p,phone:normalizePhone(e.target.value)}))} />
                </div>
                <div>
                  <FL>Company</FL>
                  <input style={inp()} value={editForm.company} onChange={e => setEditForm(p=>({...p,company:e.target.value}))} />
                </div>
                <div>
                  <FL>Purpose</FL>
                  <select style={sel()} value={editForm.purpose} onChange={e => setEditForm(p=>({...p,purpose:e.target.value}))}>
                    {PURPOSE_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FL>Date</FL>
                  <input type="date" style={inp()} value={editForm.date} onChange={e => setEditForm(p=>({...p,date:e.target.value}))} />
                </div>
                <div>
                  <FL>Time Slot</FL>
                  <input style={inp()} value={editForm.time_slot} onChange={e => setEditForm(p=>({...p,time_slot:e.target.value}))} placeholder="10:00 AM" />
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <FL>Stage</FL>
                  <select style={sel()} value={editForm.stage} onChange={e => setEditForm(p=>({...p,stage:e.target.value}))}>
                    {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <FL>Notes</FL>
                  <textarea rows={2} style={{ ...inp(), resize:'vertical' }} value={editForm.notes} onChange={e => setEditForm(p=>({...p,notes:e.target.value}))} placeholder="Internal notes..." />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, paddingTop:4 }}>
                <button onClick={() => deleteLead(editLead)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontWeight:700, fontSize:'.85rem', cursor:'pointer' }}>
                  <Trash2 size={14} /> Delete
                </button>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setEditLead(null)} style={{ padding:'8px 20px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontWeight:700, fontSize:'.85rem', cursor:'pointer' }}>Cancel</button>
                  <button onClick={submitEdit} disabled={editSaving} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#ff6500', color:'#fff', fontWeight:800, fontSize:'.85rem', cursor:'pointer', opacity:editSaving?.7:1 }}>
                    {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
