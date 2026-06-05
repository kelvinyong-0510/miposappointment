import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Phone, Delete, ArrowRight, ArrowLeft, CheckCircle2, Clock, Users, Tag, Check, X,
  Calendar, Footprints,
} from 'lucide-react';
import { PURPOSES, purposeLabel, teamsForPurposes } from '../purposes';
import { normalizePhone } from '../phone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IDLE_MS = 45000;

/* ── Kiosk i18n ─────────────────────────────────────────────────────────── */
const T = {
  en: {
    flag: '🇬🇧', label: 'EN',
    attractTitle: 'Welcome to MIPOS', attractSub: 'How can we help you today?',
    cardFindTitle: 'Find my booking', cardFindSub: 'I have an appointment',
    cardWalkTitle: 'Walk-in check-in', cardWalkSub: 'I just arrived',
    checkIn: 'Check In', enterPhone: 'Enter your phone number', findBooking: 'Find My Booking',
    back: 'Back', notFoundTitle: "We couldn't find a booking", notFoundSub: 'No appointment today for that number.',
    walkIn: 'Walk in instead', tryAgain: 'Try again',
    confirmTitle: 'Is this you?', yourAppt: 'Your appointment', team: 'Team', confirmBtn: 'Yes, check me in',
    notMe: 'Not me / Walk in', welcome: 'Welcome', queue: 'Your number', seat: 'Please have a seat — we’ll call you shortly.',
    servedBy: 'You’ll be served by', done: 'Done', posTeam: 'POS Team', csTeam: 'Customer Success',
    walkTitle: 'Walk-in check-in', walkSub: 'We’ll serve you on the spot.', optional: '(optional)',
    name: 'Your name', phoneLabel: 'Phone number',
    purpose: 'What can we help with?', pickSlot: 'Pick a time today', noSlots: 'No slots left today — please see our staff.',
    register: 'Register & Check In', booking: 'Booking…', slotFull: 'That time is full — please pick another.',
    needName: 'Please enter your name.', needPhone: 'Please enter your phone number.', needPurpose: 'Please pick at least one.',
    needSlot: 'Please pick a time.',
  },
  my: {
    flag: '🇲🇾', label: 'MY',
    attractTitle: 'Selamat datang ke MIPOS', attractSub: 'Bagaimana kami boleh bantu?',
    cardFindTitle: 'Cari temujanji', cardFindSub: 'Saya ada temujanji',
    cardWalkTitle: 'Daftar walk-in', cardWalkSub: 'Saya baru tiba',
    checkIn: 'Daftar Masuk', enterPhone: 'Masukkan nombor telefon anda', findBooking: 'Cari Temujanji',
    back: 'Kembali', notFoundTitle: 'Temujanji tidak dijumpai', notFoundSub: 'Tiada temujanji hari ini untuk nombor itu.',
    walkIn: 'Daftar walk-in', tryAgain: 'Cuba lagi',
    confirmTitle: 'Ini anda?', yourAppt: 'Temujanji anda', team: 'Pasukan', confirmBtn: 'Ya, daftar masuk',
    notMe: 'Bukan saya / Walk in', welcome: 'Selamat datang', queue: 'Nombor anda', seat: 'Sila duduk — kami akan panggil anda sebentar lagi.',
    servedBy: 'Anda akan dilayan oleh', done: 'Selesai', posTeam: 'Pasukan POS', csTeam: 'Customer Success',
    walkTitle: 'Daftar walk-in', walkSub: 'Kami akan layan anda terus.', optional: '(pilihan)',
    name: 'Nama anda', phoneLabel: 'Nombor telefon',
    purpose: 'Apa yang boleh kami bantu?', pickSlot: 'Pilih masa hari ini', noSlots: 'Tiada slot hari ini — sila jumpa staf kami.',
    register: 'Daftar & Masuk', booking: 'Memproses…', slotFull: 'Masa itu penuh — sila pilih yang lain.',
    needName: 'Sila masukkan nama anda.', needPhone: 'Sila masukkan nombor telefon.', needPurpose: 'Sila pilih sekurang-kurangnya satu.',
    needSlot: 'Sila pilih masa.',
  },
  zh: {
    flag: '🇨🇳', label: '中文',
    attractTitle: '欢迎光临 MIPOS', attractSub: '请问需要什么协助？',
    cardFindTitle: '查找我的预约', cardFindSub: '我有预约',
    cardWalkTitle: '现场登记', cardWalkSub: '我刚到',
    checkIn: '登到', enterPhone: '请输入您的电话号码', findBooking: '查找我的预约',
    back: '返回', notFoundTitle: '找不到预约', notFoundSub: '该号码今天没有预约。',
    walkIn: '改为现场登记', tryAgain: '重试',
    confirmTitle: '是您吗？', yourAppt: '您的预约', team: '团队', confirmBtn: '是的，为我登到',
    notMe: '不是我 / 现场登记', welcome: '欢迎', queue: '您的号码', seat: '请就座，我们很快会叫您。',
    servedBy: '为您服务的团队', done: '完成', posTeam: 'POS 团队', csTeam: '客户成功团队',
    walkTitle: '现场登记', walkSub: '我们将立即为您服务。', optional: '（可选）',
    name: '您的姓名', phoneLabel: '电话号码',
    purpose: '需要什么帮助？', pickSlot: '选择今天的时间', noSlots: '今天没有空位，请联系我们的工作人员。',
    register: '登记并登到', booking: '处理中…', slotFull: '该时间已满，请选择其他时间。',
    needName: '请输入您的姓名。', needPhone: '请输入电话号码。', needPurpose: '请至少选择一项。',
    needSlot: '请选择时间。',
  },
};

const NAVY = '#0a1628';
const ORANGE = '#ff6500';

export default function Kiosk() {
  const [lang, setLang] = useState('en');
  const [screen, setScreen] = useState('home'); // home|phone|confirm|notfound|success|walkin
  const [digits, setDigits] = useState('');
  const [match, setMatch] = useState(null);     // matched appointment
  const [result, setResult] = useState(null);   // checkin result {name,team,queue_number}
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const t = T[lang];

  /* Idle auto-reset */
  const idleRef = useRef(null);
  const reset = useCallback(() => {
    setScreen('home'); setDigits(''); setMatch(null); setResult(null); setErr(''); setLang('en');
  }, []);
  const kick = useCallback(() => {
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(reset, IDLE_MS);
  }, [reset]);
  useEffect(() => {
    if (screen === 'home') { clearTimeout(idleRef.current); return; }
    kick();
    return () => clearTimeout(idleRef.current);
  }, [screen, digits, kick]);

  /* ── Lookup ── */
  const lookup = async () => {
    setBusy(true); setErr('');
    try {
      const res = await axios.post(`${API_URL}/checkin/lookup`, { phone: digits });
      const appts = (res.data?.appointments || []).filter(a => a.attendance !== 'attended');
      if (appts.length) { setMatch(appts[0]); setScreen('confirm'); }
      else setScreen('notfound');
    } catch { setErr('Connection problem. Please tell our staff.'); }
    finally { setBusy(false); }
  };

  /* ── Confirm check-in ── */
  const doCheckin = async () => {
    setBusy(true); setErr('');
    try {
      const res = await axios.post(`${API_URL}/checkin`, { id: match.id });
      setResult(res.data); setScreen('success');
      setTimeout(reset, 9000); // linger on success then reset
    } catch { setErr('Connection problem. Please tell our staff.'); }
    finally { setBusy(false); }
  };

  return (
    <div onPointerDown={kick} style={{ position: 'fixed', inset: 0, fontFamily: 'var(--font-sans)', overflow: 'hidden', userSelect: 'none', background: screen === 'home' ? NAVY : '#f4f6f9' }}>
      <LangSwitch lang={lang} setLang={setLang} dark={screen === 'home'} />
      {screen === 'home'     && <Home t={t} onFind={() => setScreen('phone')} onWalk={() => setScreen('walkin')} />}
      {screen === 'phone'    && <PhonePad t={t} digits={digits} setDigits={setDigits} onBack={reset} onSubmit={lookup} busy={busy} err={err} />}
      {screen === 'confirm'  && <Confirm t={t} lang={lang} appt={match} onBack={reset} onConfirm={doCheckin} onWalk={() => setScreen('walkin')} busy={busy} err={err} />}
      {screen === 'notfound' && <NotFound t={t} onWalk={() => setScreen('walkin')} onRetry={() => { setDigits(''); setScreen('phone'); }} />}
      {screen === 'success'  && <Success t={t} lang={lang} result={result} onDone={reset} />}
      {screen === 'walkin'   && <WalkIn t={t} lang={lang} prefillPhone={digits} onBack={reset} onDone={(r) => { setResult(r); setScreen('success'); setTimeout(reset, 9000); }} />}
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */
function LangSwitch({ lang, setLang, dark }) {
  return (
    <div style={{ position: 'absolute', top: 28, right: 28, display: 'flex', gap: 8, zIndex: 10 }}>
      {Object.entries(T).map(([code, info]) => {
        const on = lang === code;
        return (
          <button key={code} onClick={() => setLang(code)} style={{
            padding: '10px 18px', borderRadius: 99, cursor: 'pointer', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-sans)',
            border: on ? `2px solid ${ORANGE}` : `2px solid ${dark ? 'rgba(255,255,255,.25)' : '#e2e8f0'}`,
            background: on ? ORANGE : (dark ? 'rgba(255,255,255,.06)' : '#fff'),
            color: on ? '#fff' : (dark ? 'rgba(255,255,255,.8)' : '#4a5568'),
          }}>{info.flag} {info.label}</button>
        );
      })}
    </div>
  );
}

const bigBtn = (extra = {}) => ({
  width: '100%', minHeight: 104, borderRadius: 16, border: 'none', cursor: 'pointer',
  background: ORANGE, color: '#fff', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-sans)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, ...extra,
});
const ghostBtn = (extra = {}) => ({
  width: '100%', minHeight: 80, borderRadius: 16, cursor: 'pointer',
  background: 'transparent', border: '2px solid #cbd5e0', color: '#4a5568', fontSize: 22, fontWeight: 600,
  fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, ...extra,
});
const shell = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' };
const errBox = (msg) => msg ? <p style={{ color: '#dc2626', fontSize: 20, fontWeight: 600, marginTop: 16 }}>{msg}</p> : null;

/* ── Home (two choices) ── */
function Home({ t, onFind, onWalk }) {
  const card = (bg) => ({
    flex: 1, minHeight: 240, borderRadius: 24, cursor: 'pointer', border: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '28px 20px', fontFamily: 'var(--font-sans)', color: '#fff', textAlign: 'center',
    background: bg, boxShadow: '0 14px 40px rgba(0,0,0,.35)',
  });
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: NAVY, overflow: 'hidden' }}>
      {/* Showroom product photo (Sunmi range) — portrait crop keeps the products centered */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/kiosk-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center 36%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,22,40,.35) 0%, rgba(10,22,40,.12) 26%, rgba(10,22,40,.78) 58%, rgba(10,22,40,.98) 100%)' }} />
      <div style={{ position: 'relative', maxWidth: 880, width: '100%', margin: '0 auto', padding: '0 40px 9vh', textAlign: 'center' }}>
        <img src="/mipos-logo.png" alt="MIPOS" style={{ height: 56, marginBottom: 22, borderRadius: 8 }} />
        <h1 style={{ fontSize: 'clamp(44px,7vw,72px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-.03em', margin: '0 0 12px', textShadow: '0 4px 30px rgba(0,0,0,.5)' }}>{t.attractTitle}</h1>
        <p style={{ fontSize: 26, color: 'rgba(255,255,255,.8)', margin: '0 0 40px' }}>{t.attractSub}</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={onFind} style={card('linear-gradient(135deg,#ff6500,#e05500)')}>
            <Calendar size={52} />
            <span style={{ fontSize: 30, fontWeight: 800 }}>{t.cardFindTitle}</span>
            <span style={{ fontSize: 19, opacity: .9 }}>{t.cardFindSub}</span>
          </button>
          <button onClick={onWalk} style={card('rgba(255,255,255,.1)')}>
            <Footprints size={52} />
            <span style={{ fontSize: 30, fontWeight: 800 }}>{t.cardWalkTitle}</span>
            <span style={{ fontSize: 19, opacity: .9 }}>{t.cardWalkSub}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Phone keypad ── */
function PhonePad({ t, digits, setDigits, onBack, onSubmit, busy, err }) {
  const press = (d) => setDigits(s => (s + d).slice(0, 11));
  const del = () => setDigits(s => s.slice(0, -1));
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1a202c', textAlign: 'center', margin: '0 0 8px' }}>{t.enterPhone}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', margin: '24px 0 28px', minHeight: 40 }}>
          <Phone size={28} color="#a0aec0" />
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '2px', color: digits ? '#1a202c' : '#cbd5e0' }}>{digits || '0XX-XXXXXXX'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {keys.map((k, i) => k === '' ? <div key={i} /> : (
            <button key={i} onClick={() => k === 'del' ? del() : press(k)} style={{
              minHeight: 96, borderRadius: 16, border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer',
              fontSize: 34, fontWeight: 700, color: '#1a202c', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{k === 'del' ? <Delete size={32} color="#718096" /> : k}</button>
          ))}
        </div>
        {errBox(err)}
        <button onClick={onSubmit} disabled={busy || digits.length < 7} style={bigBtn({ marginTop: 24, opacity: (busy || digits.length < 7) ? .5 : 1 })}>
          {busy ? '…' : <>{t.findBooking} <ArrowRight size={28} /></>}
        </button>
        <button onClick={onBack} style={ghostBtn({ marginTop: 14, minHeight: 64, fontSize: 20 })}><ArrowLeft size={22} /> {t.back}</button>
      </div>
    </div>
  );
}

/* ── Confirm ── */
function Confirm({ t, lang, appt, onBack, onConfirm, onWalk, busy, err }) {
  const labels = (() => { try { const k = appt.purposes ? JSON.parse(appt.purposes) : []; return k.length ? k.map(x => purposeLabel(x, lang)) : (appt.purpose ? [appt.purpose] : []); } catch { return appt.purpose ? [appt.purpose] : []; } })();
  const team = appt.needs_pos ? t.posTeam : t.csTeam;
  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1a202c', margin: '0 0 24px' }}>{t.confirmTitle}</h1>
        <div style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: 20, padding: 32, textAlign: 'left', marginBottom: 28 }}>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#1a202c', margin: '0 0 18px' }}>{appt.name || '—'}</p>
          <Row icon={Clock} text={appt.time_slot || '—'} />
          <Row icon={Tag} text={labels.join(', ') || '—'} />
          <Row icon={Users} text={team} accent />
        </div>
        {errBox(err)}
        <button onClick={onConfirm} disabled={busy} style={bigBtn({ background: '#22c55e', opacity: busy ? .6 : 1 })}>
          {busy ? '…' : <><Check size={30} /> {t.confirmBtn}</>}
        </button>
        <button onClick={onWalk} style={ghostBtn({ marginTop: 14 })}>{t.notMe}</button>
        <button onClick={onBack} style={ghostBtn({ marginTop: 12, minHeight: 60, fontSize: 19, border: 'none' })}><ArrowLeft size={20} /> {t.back}</button>
      </div>
    </div>
  );
}
function Row({ icon: Icon, text, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', fontSize: 26, color: accent ? ORANGE : '#4a5568', fontWeight: accent ? 800 : 500 }}>
      <Icon size={26} color={accent ? ORANGE : '#a0aec0'} /> {text}
    </div>
  );
}

/* ── Not found ── */
function NotFound({ t, onWalk, onRetry }) {
  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,101,0,.1)', display: 'grid', placeItems: 'center', margin: '0 auto 28px' }}>
          <X size={52} color={ORANGE} />
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1a202c', margin: '0 0 10px' }}>{t.notFoundTitle}</h1>
        <p style={{ fontSize: 24, color: '#718096', margin: '0 0 40px' }}>{t.notFoundSub}</p>
        <button onClick={onWalk} style={bigBtn()}>{t.walkIn} <ArrowRight size={28} /></button>
        <button onClick={onRetry} style={ghostBtn({ marginTop: 14 })}>{t.tryAgain}</button>
      </div>
    </div>
  );
}

/* ── Success ── */
function Success({ t, lang, result, onDone }) {
  const team = result?.team === 'POS' ? t.posTeam : t.csTeam;
  return (
    <div style={{ ...shell, background: '#f0fdf4' }}>
      <div style={{ textAlign: 'center', maxWidth: 640 }}>
        <CheckCircle2 size={96} color="#22c55e" style={{ marginBottom: 24 }} />
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#15803d', margin: '0 0 8px', letterSpacing: '-.02em' }}>{t.welcome}{result?.name ? `, ${result.name}!` : '!'}</h1>
        {result?.queue_number && (
          <>
            <p style={{ fontSize: 24, color: '#4a5568', margin: '24px 0 0', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>{t.queue}</p>
            <p style={{ fontSize: 120, fontWeight: 900, color: ORANGE, lineHeight: 1, margin: '4px 0 16px', fontVariantNumeric: 'tabular-nums' }}>{result.queue_number}</p>
          </>
        )}
        <p style={{ fontSize: 26, color: '#4a5568', margin: '0 0 6px' }}>{t.servedBy} <strong>{team}</strong></p>
        <p style={{ fontSize: 24, color: '#718096', margin: '0 0 40px' }}>{t.seat}</p>
        <button onClick={onDone} style={ghostBtn({ maxWidth: 320, margin: '0 auto' })}>{t.done}</button>
      </div>
    </div>
  );
}

/* ── Walk-in (no slot — served on the spot) ── */
function WalkIn({ t, lang, prefillPhone, onBack, onDone }) {
  const [form, setForm] = useState({ name: '', phone: prefillPhone ? normalizePhone(prefillPhone) : '', purposes: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const toggle = key => setForm(f => ({ ...f, purposes: f.purposes.includes(key) ? f.purposes.filter(k => k !== key) : [...f.purposes, key] }));

  const submit = async () => {
    if (!form.name.trim()) return setErr(t.needName);
    if (!form.phone.trim()) return setErr(t.needPhone);
    setBusy(true); setErr('');
    try {
      const res = await axios.post(`${API_URL}/checkin/walkin`, {
        name: form.name, phone: form.phone, purposes: form.purposes,
      });
      onDone(res.data);
    } catch {
      setErr('Connection problem. Please tell our staff.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ ...shell, justifyContent: 'flex-start', paddingTop: 88, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1a202c', textAlign: 'center', margin: '0 0 8px' }}>{t.walkTitle}</h1>
        <p style={{ fontSize: 22, color: '#718096', textAlign: 'center', margin: '0 0 28px' }}>{t.walkSub}</p>

        <label style={lbl}>{t.name}</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={field} />
        <label style={lbl}>{t.phoneLabel}</label>
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} onBlur={e => setForm(f => ({ ...f, phone: normalizePhone(e.target.value) }))} inputMode="tel" style={field} />

        <label style={lbl}>{t.purpose} <span style={{ fontWeight: 500, color: '#a0aec0' }}>{t.optional}</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {PURPOSES.map(p => {
            const on = form.purposes.includes(p.key);
            return <button key={p.key} onClick={() => toggle(p.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-sans)',
              border: on ? `2px solid ${ORANGE}` : '2px solid #e2e8f0', background: on ? 'rgba(255,101,0,.08)' : '#fff', color: on ? ORANGE : '#4a5568',
            }}>{on ? <Check size={18} /> : <Tag size={18} style={{ opacity: .5 }} />}{p[lang]}</button>;
          })}
        </div>

        {errBox(err)}
        <button onClick={submit} disabled={busy} style={bigBtn({ marginTop: 8, opacity: busy ? .6 : 1 })}>{busy ? t.booking : <>{t.register} <ArrowRight size={28} /></>}</button>
        <button onClick={onBack} style={ghostBtn({ marginTop: 14, minHeight: 64, fontSize: 20, marginBottom: 40 })}><ArrowLeft size={22} /> {t.back}</button>
      </div>
    </div>
  );
}
const lbl = { display: 'block', fontSize: 20, fontWeight: 700, color: '#4a5568', margin: '0 0 8px' };
const field = { width: '100%', boxSizing: 'border-box', padding: '18px 20px', fontSize: 26, border: '2px solid #e2e8f0', borderRadius: 14, outline: 'none', marginBottom: 20, fontFamily: 'var(--font-sans)', color: '#1a202c', background: '#fff' };
