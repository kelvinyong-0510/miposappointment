import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Plus, Trash2, Check, X, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.05)' };
const inp = { border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: '.85rem', fontFamily: 'var(--font-sans)', outline: 'none', background: '#f9fafb', color: '#111827' };

export default function SlotManager() {
  const [slots, setSlots]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [draft, setDraft]   = useState({});          // per-time edited {pos,cs}
  const [adding, setAdding] = useState({ time: '', pos_capacity: 1, cs_capacity: 2 });
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');

  const load = () => {
    setLoad(true);
    axios.get(`${API_URL}/slots`)
      .then(r => setSlots(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoad(false));
  };
  useEffect(load, []);

  const toggleActive = async (s) => {
    await axios.put(`${API_URL}/slots/${encodeURIComponent(s.time)}`, { active: s.active ? 0 : 1 });
    load();
  };
  const saveCap = async (time) => {
    const d = draft[time]; if (!d) return;
    await axios.put(`${API_URL}/slots/${encodeURIComponent(time)}`, { pos_capacity: Number(d.pos), cs_capacity: Number(d.cs) });
    setDraft(p => { const n = { ...p }; delete n[time]; return n; });
    load();
  };
  const removeSlot = async (time) => {
    if (!window.confirm(`Remove the ${time} slot? Existing bookings keep their time but the slot won't be offered to new customers.`)) return;
    await axios.delete(`${API_URL}/slots/${encodeURIComponent(time)}`);
    load();
  };
  const addSlot = async () => {
    setErr('');
    const t = adding.time.trim();
    if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(t)) { setErr('Enter time like "10:00 AM" or "2:30 PM".'); return; }
    setBusy(true);
    try {
      await axios.post(`${API_URL}/slots`, { time: t.toUpperCase().replace(/\s+/, ' '), pos_capacity: Number(adding.pos_capacity), cs_capacity: Number(adding.cs_capacity) });
      setAdding({ time: '', pos_capacity: 1, cs_capacity: 2 });
      load();
    } catch (e) { setErr(e?.response?.data?.error || 'Failed to add slot.'); }
    finally { setBusy(false); }
  };

  const Stepper = ({ value, onChange, color }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 800, color: '#6b7280' }}>−</button>
      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, color, fontSize: '.95rem' }}>{value}</span>
      <button onClick={() => onChange(value + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 800, color: '#6b7280' }}>+</button>
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 920, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a202c', letterSpacing: '-.02em', margin: 0 }}>Time Slots</h2>
        <p style={{ color: '#6b7280', fontSize: '.85rem', margin: '4px 0 0' }}>
          Set how many <strong style={{ color: '#ff6500' }}>POS</strong> and <strong style={{ color: '#0ea5e9' }}>CS</strong> appointments each slot can take. Disable a slot to stop offering it without deleting it.
        </p>
      </div>

      {/* Add new slot */}
      <div style={{ ...card, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>New slot time</label>
          <input style={{ ...inp, width: 150 }} placeholder="e.g. 5:00 PM" value={adding.time} onChange={e => setAdding(a => ({ ...a, time: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>POS cap</label>
          <input type="number" min={0} style={{ ...inp, width: 70 }} value={adding.pos_capacity} onChange={e => setAdding(a => ({ ...a, pos_capacity: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>CS cap</label>
          <input type="number" min={0} style={{ ...inp, width: 70 }} value={adding.cs_capacity} onChange={e => setAdding(a => ({ ...a, cs_capacity: e.target.value }))} />
        </div>
        <button onClick={addSlot} disabled={busy} className="btn-brand" style={{ padding: '9px 18px', borderRadius: 8, opacity: busy ? .7 : 1 }}>
          <Plus size={15} /> Add Slot
        </button>
        {err && <span style={{ color: '#dc2626', fontSize: '.8rem', fontWeight: 600, width: '100%' }}>{err}</span>}
      </div>

      {/* Slots table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
          <thead>
            <tr style={{ background: '#ff6500' }}>
              {['Time', 'POS capacity', 'CS capacity', 'Status', ''].map((h, i) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: i > 0 && i < 4 ? 'center' : 'left', color: '#fff', fontSize: '.7rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</td></tr>
            ) : slots.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No slots configured. Add one above.</td></tr>
            ) : slots.map(s => {
              const d = draft[s.time] || { pos: s.pos_capacity, cs: s.cs_capacity };
              const dirty = draft[s.time] && (Number(d.pos) !== s.pos_capacity || Number(d.cs) !== s.cs_capacity);
              return (
                <tr key={s.time} style={{ borderTop: '1px solid #f3f4f6', opacity: s.active ? 1 : .55 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a202c', whiteSpace: 'nowrap' }}>
                    <Clock size={13} style={{ verticalAlign: -2, marginRight: 6, color: '#ff6500' }} />{s.time}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Stepper value={Number(d.pos)} color="#ff6500" onChange={v => setDraft(p => ({ ...p, [s.time]: { pos: v, cs: Number(d.cs) } }))} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Stepper value={Number(d.cs)} color="#0ea5e9" onChange={v => setDraft(p => ({ ...p, [s.time]: { pos: Number(d.pos), cs: v } }))} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => toggleActive(s)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, cursor: 'pointer', fontSize: '.72rem', fontWeight: 700,
                      border: `1px solid ${s.active ? 'rgba(16,185,129,.3)' : '#e5e7eb'}`,
                      background: s.active ? 'rgba(16,185,129,.1)' : '#f3f4f6',
                      color: s.active ? '#059669' : '#9ca3af',
                    }}>
                      {s.active ? <Check size={12} /> : <X size={12} />}{s.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {dirty && (
                      <button onClick={() => saveCap(s.time)} title="Save capacity" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fff7ed', color: '#ff6500', cursor: 'pointer', marginRight: 6 }}>
                        <Save size={14} />
                      </button>
                    )}
                    <button onClick={() => removeSlot(s.time)} title="Delete slot" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
