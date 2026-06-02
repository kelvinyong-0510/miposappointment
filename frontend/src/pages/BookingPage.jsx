import { useState } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, User, Phone, Briefcase, Tag,
  CheckCircle, MapPin, Copy, Check, Navigation,
  MessageCircle, ChevronDown, ArrowRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* ── i18n ────────────────────────────────────────────────────────────────── */
const LANG = {
  en: {
    label: 'EN', flag: '🇬🇧',
    hero: 'Book a Walk-In Appointment',
    sub: 'Schedule a visit to our POS & technology showroom in Cheras, Kuala Lumpur.',
    name: 'Full Name', phone: 'Phone Number',
    company: 'Company Name', optional: '(Optional)',
    date: 'Preferred Date', time: 'Time Slot',
    purpose: 'Purpose of Visit',
    selTime: 'Select a time slot', selPurpose: 'Select purpose',
    submit: 'Confirm Appointment', submitting: 'Booking…',
    successTitle: 'Appointment Confirmed!',
    successSub: 'We look forward to seeing you on',
    successAt: 'at',
    bookAgain: 'Book Another Appointment',
    whatsapp: 'Confirm via WhatsApp',
    location: 'Our Location',
    hours: 'Operation Hours',
    monFri: 'Mon – Fri', sat: 'Saturday', sun: 'Sunday',
    closed: 'Closed', copyAddr: 'Copy Address', copied: 'Copied!',
    openMaps: 'Open in Maps',
    purposes: ['POS System', 'Hardware Devices (Sunmi)', 'Technical Support', 'LED Board', 'Pager System', 'Queue System', 'Calling System', 'Others'],
  },
  my: {
    label: 'MY', flag: '🇲🇾',
    hero: 'Tempah Temujanji Walk-In',
    sub: 'Jadualkan lawatan ke pusat demo POS & teknologi kami di Cheras, Kuala Lumpur.',
    name: 'Nama Penuh', phone: 'Nombor Telefon',
    company: 'Nama Syarikat', optional: '(Pilihan)',
    date: 'Tarikh', time: 'Slot Masa',
    purpose: 'Tujuan Kunjungan',
    selTime: 'Pilih slot masa', selPurpose: 'Pilih tujuan',
    submit: 'Sahkan Temujanji', submitting: 'Mengesahkan…',
    successTitle: 'Temujanji Disahkan!',
    successSub: 'Kami berharap bertemu anda pada',
    successAt: 'jam',
    bookAgain: 'Tempah Temujanji Lain',
    whatsapp: 'Sahkan melalui WhatsApp',
    location: 'Lokasi Kami',
    hours: 'Waktu Operasi',
    monFri: 'Isnin – Jumaat', sat: 'Sabtu', sun: 'Ahad',
    closed: 'Tutup', copyAddr: 'Salin Alamat', copied: 'Disalin!',
    openMaps: 'Buka dalam Peta',
    purposes: ['Sistem POS', 'Perkakasan (Sunmi)', 'Sokongan Teknikal', 'Papan LED', 'Sistem Pager', 'Sistem Giliran', 'Sistem Panggilan', 'Lain-lain'],
  },
  zh: {
    label: '中文', flag: '🇨🇳',
    hero: '预约到店参观',
    sub: '预约参观我们位于吉隆坡 Cheras 的 POS 系统及技术展示中心。',
    name: '姓名', phone: '联络电话',
    company: '公司名称', optional: '（可选）',
    date: '日期', time: '时间段',
    purpose: '来访目的',
    selTime: '选择时间', selPurpose: '选择目的',
    submit: '确认预约', submitting: '处理中…',
    successTitle: '预约确认！',
    successSub: '期待在',
    successAt: '与您见面，时间：',
    bookAgain: '再次预约',
    whatsapp: '通过 WhatsApp 确认',
    location: '我们的地址',
    hours: '营业时间',
    monFri: '周一 – 周五', sat: '周六', sun: '周日',
    closed: '休息', copyAddr: '复制地址', copied: '已复制！',
    openMaps: '打开地图',
    purposes: ['POS 收银系统', '硬件设备 (Sunmi)', '技术支持', 'LED 显示板', '呼叫器系统', '排队管理系统', '叫号系统', '其他'],
  },
};

const SLOTS = ['10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
const ADDRESS = '29, Jalan 2, Taman Len Seng Cheras,\n56000 Kuala Lumpur,\nWilayah Persekutuan Kuala Lumpur';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Mipos+Shoptech+Centre+29+Jalan+2+Taman+Len+Seng+Cheras+56000+Kuala+Lumpur';
const MAPS_EMBED = 'https://maps.google.com/maps?q=Mipos+Shoptech+Centre,+29+Jalan+2,+Taman+Len+Seng,+56000+Cheras,+Kuala+Lumpur&output=embed&z=16';

/* ── Field wrapper ────────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none', flexShrink: 0, zIndex: 1 }} />
        {children}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function BookingPage() {
  const [lang, setLang]     = useState('en');
  const [form, setForm]     = useState({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: '' });
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);
  const t = LANG[lang];

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${API_URL}/leads`, form);
      setDone(true);
    } catch { setError('Failed to submit. Please try again.'); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setDone(false);
    setForm({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: '' });
  };

  const copy = () => {
    navigator.clipboard.writeText(ADDRESS.replace(/\n/g, ' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* Success screen */
  if (done) return (
    <PageShell lang={lang} setLang={setLang} t={t}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div className="card fade-up" style={{ maxWidth: 440, width: '100%', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={36} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>{t.successTitle}</h2>
          <p style={{ color: '#718096', marginBottom: 4 }}>
            {t.successSub} <strong style={{ color: '#ff6500' }}>{form.date}</strong> {t.successAt} <strong style={{ color: '#ff6500' }}>{form.time_slot}</strong>
          </p>
          <p style={{ color: '#a0aec0', fontSize: '.875rem', marginBottom: 32 }}>{form.purpose}</p>

          <a
            href={`https://wa.me/60103167320?text=${encodeURIComponent(`Hi MIPOS! I've booked a walk-in appointment for ${form.date} at ${form.time_slot}. Purpose: ${form.purpose}`)}`}
            target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 24px', background: '#25D366', color: '#fff', fontWeight: 700, borderRadius: 8, textDecoration: 'none', marginBottom: 12, fontSize: '.9rem' }}
          >
            <MessageCircle size={18} className="fill-current" style={{ fill: '#fff' }} />
            {t.whatsapp}
          </a>
          <button onClick={reset}
            style={{ width: '100%', padding: '11px 24px', background: '#f4f6f9', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#4a5568', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '.875rem' }}>
            {t.bookAgain}
          </button>
        </div>
      </div>
    </PageShell>
  );

  /* Booking form */
  return (
    <PageShell lang={lang} setLang={setLang} t={t}>
      {/* Hero banner */}
      <div style={{ background: 'var(--color-navy)', padding: '56px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(255,101,0,.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(255,101,0,.15)', border: '1px solid rgba(255,101,0,.3)', borderRadius: 99, fontSize: '.75rem', fontWeight: 700, color: '#ff8c42', marginBottom: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6500', display: 'inline-block' }} />
            Walk-In Appointment System
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-.02em' }}>
            {t.hero}
          </h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>{t.sub}</p>
        </div>

        {/* Falling Products Animation */}
        <div className="falling-container">
          <div className="falling-item"><img src="/products/pos_4k.png" alt="POS" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/queue_4k.png" alt="Queue" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/pos_4k.png" alt="POS" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/queue_4k.png" alt="Queue" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/pos_4k.png" alt="POS" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/queue_4k.png" alt="Queue" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
          <div className="falling-item"><img src="/products/pos_4k.png" alt="POS" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.7))' }} /></div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ background: 'var(--color-bg-soft)', padding: '0 16px 60px', marginTop: -1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24, paddingTop: 40, flexWrap: 'wrap' }}>

          {/* Booking form */}
          <div className="card fade-up" style={{ flex: '1 1 560px', overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc' }}>
              <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.08em' }}>Appointment Details</span>
              {/* Language picker */}
              <div style={{ display: 'flex', gap: 4, padding: '3px', background: '#eef0f4', borderRadius: 8 }}>
                {Object.entries(LANG).map(([code, info]) => (
                  <button key={code} type="button" onClick={() => setLang(code)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: '.72rem', fontWeight: 700,
                      background: lang === code ? '#fff' : 'transparent',
                      color: lang === code ? '#ff6500' : '#718096',
                      boxShadow: lang === code ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                      transition: 'all .15s',
                    }}>
                    {info.flag} {info.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '28px 24px' }}>
              {error && (
                <div style={{ marginBottom: 20, padding: '10px 14px', background: 'rgba(239,68,68,.06)', border: '1.5px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#dc2626', fontSize: '.875rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-grid-2">
                  <Field label={t.name} icon={User}>
                    <input className="field-input" type="text" name="name" required placeholder="John Doe" value={form.name} onChange={set} />
                  </Field>
                  <Field label={`${t.phone} *`} icon={Phone}>
                    <input className="field-input" type="tel" name="phone" required placeholder="012-3456789" value={form.phone} onChange={set} />
                  </Field>
                </div>

                <Field label={`${t.company} ${t.optional}`} icon={Briefcase}>
                  <input className="field-input" type="text" name="company" placeholder="Your Company Name" value={form.company} onChange={set} />
                </Field>

                <div className="form-grid-2">
                  <Field label={t.date} icon={Calendar}>
                    <input className="field-input" type="date" name="date" required min={new Date().toISOString().split('T')[0]} value={form.date} onChange={set} onClick={(e) => { try { e.target.showPicker() } catch {} }} />
                  </Field>
                  <Field label={t.time} icon={Clock}>
                    <select className="field-input" name="time_slot" required value={form.time_slot} onChange={set} style={{ appearance: 'none', cursor: 'pointer', paddingRight: 32 }}>
                      <option value="">{t.selTime}</option>
                      {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
                  </Field>
                </div>

                <Field label={t.purpose} icon={Tag}>
                  <select className="field-input" name="purpose" required value={form.purpose} onChange={set} style={{ appearance: 'none', cursor: 'pointer', paddingRight: 32 }}>
                    <option value="">{t.selPurpose}</option>
                    {t.purposes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
                </Field>

                <button type="submit" disabled={loading} className="btn-brand"
                  style={{ width: '100%', padding: '13px 24px', fontSize: '.95rem', marginTop: 4, opacity: loading ? .7 : 1 }}>
                  {loading
                    ? <><div className="spin" style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} />{t.submitting}</>
                    : <>{t.submit} <ArrowRight size={16} /></>
                  }
                </button>
              </form>
            </div>
          </div>

          {/* Info sidebar */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Location */}
            <div className="card fade-up delay-1">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,101,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} style={{ color: '#ff6500' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '.875rem', color: '#1a202c' }}>{t.location}</span>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 14, border: '1px solid var(--color-border)', height: 150 }}>
                  <iframe title="MIPOS Map" width="100%" height="100%" style={{ border: 0, display: 'block' }}
                    loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={MAPS_EMBED} />
                </div>
                <p style={{ fontSize: '.813rem', color: '#718096', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 14 }}>{ADDRESS}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={copy}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 0',
                      background: copied ? 'rgba(34,197,94,.08)' : '#f4f6f9',
                      border: `1.5px solid ${copied ? 'rgba(34,197,94,.3)' : '#e2e8f0'}`,
                      borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      fontSize: '.75rem', fontWeight: 700, color: copied ? '#16a34a' : '#4a5568',
                      transition: 'all .18s',
                    }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? t.copied : t.copyAddr}
                  </button>
                  <a href={MAPS_URL} target="_blank" rel="noreferrer" className="btn-brand"
                    style={{ padding: '8px 0', fontSize: '.75rem', justifyContent: 'center' }}>
                    <Navigation size={13} />{t.openMaps}
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="card fade-up delay-2">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,101,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} style={{ color: '#ff6500' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '.875rem', color: '#1a202c' }}>{t.hours}</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { day: t.monFri, hours: '9:30 AM – 4:30 PM', closed: false },
                  { day: t.sat,    hours: '10:00 AM – 12:30 PM', closed: false },
                  { day: t.sun,    hours: t.closed, closed: true },
                ].map(({ day, hours, closed: isClosed }) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.813rem' }}>
                    <span style={{ color: '#718096', fontWeight: 500 }}>{day}</span>
                    {isClosed
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px', background: 'rgba(239,68,68,.08)', borderRadius: 99, color: '#dc2626', fontWeight: 700 }}>
                          <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                          {hours}
                        </span>
                      : <span style={{ fontWeight: 700, color: '#1a202c' }}>{hours}</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/60103167320" target="_blank" rel="noreferrer" className="fade-up delay-3"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'box-shadow .18s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={20} style={{ color: '#fff', fill: '#fff' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '.875rem', color: '#1a202c' }}>Chat with us</p>
                <p style={{ fontSize: '.75rem', color: '#718096' }}>+60 10-316 7320</p>
              </div>
              <ArrowRight size={16} style={{ color: '#a0aec0', marginLeft: 'auto' }} />
            </a>

          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Page Shell ──────────────────────────────────────────────────────────── */
function PageShell({ children, lang, setLang, t }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-soft)' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 24px', display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0 }}>
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0', height: 64 }}>
          {/* Logo */}
          <a href="https://mipos.com.my" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/mipos-logo.png" alt="MIPOS" style={{ height: 40, width: 'auto', borderRadius: 6 }} />
          </a>
          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="https://mipos.com.my" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.825rem', fontWeight: 500, textDecoration: 'none' }}>mipos.com.my</a>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer style={{ background: 'var(--color-navy)', padding: '20px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.75rem' }}>
          © {new Date().getFullYear()} MIPOS ShopTech Centre · Cheras, Kuala Lumpur · All rights reserved
        </p>
      </footer>
    </div>
  );
}
