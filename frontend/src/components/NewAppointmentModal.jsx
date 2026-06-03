import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, Tag, ArrowRight } from 'lucide-react';
import { PURPOSES, purposeLabel } from '../purposes';
import { normalizePhone } from '../phone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const inp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: '.88rem', fontFamily: 'var(--font-sans)', outline: 'none', background: '#f9fafb', color: '#111827' };
const FL = ({ children }) => <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{children}</label>;

export default function NewAppointmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', company: '', date: '', time_slot: '', purposes: [] });
  const [slotsData, setSlotsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const needsPos = form.purposes.includes('pos');
  const needsCs  = form.purposes.some(k => k !== 'pos');
  const slotFull = s => (needsPos && s.pos_booked >= s.pos_capacity) || (needsCs && s.cs_booked >= s.cs_capacity);

  const togglePurpose = key => setForm(f => ({ ...f, purposes: f.purposes.includes(key) ? f.purposes.filter(k => k !== key) : [...f.purposes, key] }));

  useEffect(() => {
    if (!form.date) { setSlotsData([]); return; }
    axios.get(`${API_URL}/availability`, { params: { date: form.date } })
      .then(r => setSlotsData(r.data?.slots || []))
      .catch(() => setSlotsData([]));
  }, [form.date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone) { setErr('Phone number is required.'); return; }
    if (!form.purposes.length) { setErr('Select at least one purpose.'); return; }
    setLoading(true); setErr('');
    try {
      await axios.post(`${API_URL}/leads`, {
        name: form.name, phone: form.phone, company: form.company,
        date: form.date, time_slot: form.time_slot,
        purposes: form.purposes,
        purpose: form.purposes.map(k => purposeLabel(k, 'en')).join(', '),
        source: 'admin',
      });
      onCreated?.();
      onClose?.();
    } catch (e2) {
      setErr(e2?.response?.status === 409 ? (e2.response.data?.message || 'That slot is full for this service.') : 'Failed to create. Try again.');
      if (form.date) axios.get(`${API_URL}/availability`, { params: { date: form.date } }).then(r => setSlotsData(r.data?.slots || [])).catch(() => {});
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,.45)', backdropFilter: 'blur(2px)' }} />
      <form onSubmit={submit} style={{ position: 'relative', background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>New Walk-In Appointment</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 22, overflowY: 'auto' }}>
          {err && <div style={{ marginBottom: 16, padding: '9px 13px', background: 'rgba(239,68,68,.06)', border: '1.5px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#dc2626', fontSize: '.83rem', fontWeight: 600 }}>{err}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div><FL>Full Name</FL><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" /></div>
            <div><FL>Phone *</FL><input style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} onBlur={e => setForm(f => ({ ...f, phone: normalizePhone(e.target.value) }))} placeholder="012-3456789" /></div>
          </div>
          <div style={{ marginBottom: 16 }}><FL>Company (optional)</FL><input style={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company" /></div>

          <div style={{ marginBottom: 16 }}>
            <FL>Purpose (one or more)</FL>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {PURPOSES.map(p => {
                const on = form.purposes.includes(p.key);
                return (
                  <button type="button" key={p.key} onClick={() => togglePurpose(p.key)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
                    border: on ? '1.5px solid #ff6500' : '1.5px solid #e5e7eb', background: on ? 'rgba(255,101,0,.08)' : '#fff', color: on ? '#ff6500' : '#4a5568',
                  }}>{on ? <Check size={12} /> : <Tag size={12} style={{ opacity: .5 }} />}{p.en}</button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><FL>Date</FL><input type="date" style={inp} min={new Date().toISOString().split('T')[0]} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value, time_slot: '' }))} /></div>
            <div>
              <FL>Time Slot</FL>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.time_slot} disabled={!form.date || !form.purposes.length}
                onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}>
                <option value="">{!form.date ? 'Pick a date first' : (!form.purposes.length ? 'Pick a purpose first' : 'Select a time')}</option>
                {form.date && form.purposes.length > 0 && slotsData.map(s => {
                  const full = slotFull(s);
                  return <option key={s.time} value={s.time} disabled={full}>{full ? `${s.time} — Full` : s.time}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} className="btn-brand" style={{ padding: '9px 22px', borderRadius: 8, opacity: loading ? .7 : 1 }}>
            {loading ? 'Booking…' : <>Create Appointment <ArrowRight size={15} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
