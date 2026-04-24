import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, Phone, Briefcase, Tag, CheckCircle, MapPin, Copy, Check, Globe, Navigation, MessageCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Translations ────────────────────────────────────────────────────────────
const LANGUAGES = {
  en: {
    label: 'English',
    hero: 'Book a Walk-in Visit',
    sub: 'We invite you to visit our experience center for a more immersive experience.',
    name: 'Full Name',
    phone: 'Phone Number',
    company: 'Company Name',
    companyOptional: '(Optional)',
    date: 'Date',
    timeSlot: 'Time Slot',
    selectTime: 'Select Time',
    purpose: 'Purpose of Visit',
    selectPurpose: 'Select Purpose',
    confirm: 'Confirm Appointment',
    confirming: 'Confirming...',
    successTitle: 'Booking Confirmed! 🎉',
    successMsg: 'We look forward to seeing you on',
    successAt: 'at',
    bookAnother: 'Book Another Appointment',
    contactWhatsapp: 'Send a message on WhatsApp',
    addressTitle: 'Mipos ShopTech Centre',
    hoursTitle: 'Operation Hours',
    monFri: 'Mon – Fri',
    sat: 'Saturday',
    closed: 'Closed',
    sun: 'Sunday',
    copied: 'Copied!',
    copyAddress: 'Copy Address',
    openMaps: 'Open in Maps',
    purposes: [
      'POS System',
      'Hardware Devices (Sunmi)',
      'Technical Support',
      'LED Board',
      'Pagers System',
      'Queue System',
      'Calling System',
      'Others',
    ],
  },
  my: {
    label: 'Bahasa Melayu',
    hero: 'Tempah Kunjungan Walk-in',
    sub: 'Kami menjemput anda mengunjungi pusat pengalaman kami untuk pengalaman yang lebih mendalam.',
    name: 'Nama Penuh',
    phone: 'Nombor Telefon',
    company: 'Nama Syarikat',
    companyOptional: '(Pilihan)',
    date: 'Tarikh',
    timeSlot: 'Slot Masa',
    selectTime: 'Pilih Masa',
    purpose: 'Tujuan Kunjungan',
    selectPurpose: 'Pilih Tujuan',
    confirm: 'Sahkan Temujanji',
    confirming: 'Mengesahkan...',
    successTitle: 'Tempahan Disahkan! 🎉',
    successMsg: 'Kami berharap untuk bertemu anda pada',
    successAt: 'jam',
    bookAnother: 'Tempah Temujanji Lain',
    contactWhatsapp: 'Mesej kami di WhatsApp',
    addressTitle: 'Pusat Mipos ShopTech',
    hoursTitle: 'Waktu Operasi',
    monFri: 'Isnin – Jumaat',
    sat: 'Sabtu',
    closed: 'Tutup',
    sun: 'Ahad',
    copied: 'Disalin!',
    copyAddress: 'Salin Alamat',
    openMaps: 'Buka di Peta',
    purposes: [
      'Sistem POS',
      'Peranti Perkakasan (Sunmi)',
      'Sokongan Teknikal',
      'Papan LED',
      'Sistem Pager',
      'Sistem Giliran',
      'Sistem Panggilan',
      'Lain-lain',
    ],
  },
  zh: {
    label: '中文',
    hero: '预约到店参观',
    sub: '我们诚邀您访问我们的体验中心，享受更沉浸式的体验。',
    name: '姓名',
    phone: '联络电话',
    company: '公司名称',
    companyOptional: '（可选）',
    date: '日期',
    timeSlot: '时间段',
    selectTime: '选择时间',
    purpose: '来访目的',
    selectPurpose: '选择目的',
    confirm: '确认预约',
    confirming: '处理中...',
    successTitle: '预约成功！🎉',
    successMsg: '期待在',
    successAt: '与您见面！时间：',
    bookAnother: '再次预约',
    contactWhatsapp: '通过 WhatsApp 联系我们',
    addressTitle: 'Mipos ShopTech 体验中心',
    hoursTitle: '营业时间',
    monFri: '周一 – 周五',
    sat: '周六',
    closed: '休息',
    sun: '周日',
    copied: '已复制！',
    copyAddress: '复制地址',
    openMaps: '打开地图',
    purposes: [
      'POS 收银系统',
      '硬件设备 (Sunmi)',
      '技术支持',
      'LED 显示板',
      '呼叫器系统',
      '排队管理系统',
      '叫号系统',
      '其他',
    ],
  },
};

const TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM',  '2:30 PM',  '3:00 PM',  '3:30 PM',
  '4:00 PM',  '4:30 PM',
];

const ADDRESS = `29, Jalan 2, Taman Len Seng Cheras,\n56000 Kuala Lumpur,\nWilayah Persekutuan Kuala Lumpur`;

// ── Component ────────────────────────────────────────────────────────────────
// ── Shared layout wrapper ─────────────────────────────────────────────────
const PageShell = ({ children }) => (
  <div className="min-h-screen flex flex-col relative bg-[#f8fafc] overflow-hidden">
    {/* Animated Modern Gradient Background */}
    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] z-0 pointer-events-none opacity-40">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" />
      <div className="absolute bottom-0 left-10 w-[700px] h-[700px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-50 rounded-full mix-blend-multiply filter blur-[150px] opacity-70 animate-blob animation-delay-4000" />
    </div>

    {/* Navbar - Simplified */}
    <nav className="relative z-10 flex items-center justify-between px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/30">
          <span className="text-white font-black text-xl">M</span>
        </div>
        <div className="hidden sm:block text-[#0f172a] font-black text-xl leading-none tracking-tight">
          MIPOS <span className="text-orange-500 text-xs font-bold tracking-widest uppercase ml-1">ShopTech</span>
        </div>
      </div>
    </nav>

    {children}
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [lang, setLang]   = useState('en');
  const [formData, setFormData] = useState({
    name: '', phone: '', company: '', date: '', time_slot: '', purpose: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [copied, setCopied]       = useState(false);

  const t = LANGUAGES[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/leads`, formData);
      setSubmitted(true);
    } catch {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: '' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ADDRESS.replace(/\n/g, ' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <PageShell>
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t.successTitle}</h2>
            <p className="text-gray-500 mb-2">
              {t.successMsg}{' '}
              <span className="font-semibold text-[#FF6600]">{formData.date}</span>{' '}
              {t.successAt}{' '}
              <span className="font-semibold text-[#FF6600]">{formData.time_slot}</span>.
            </p>
            <p className="text-gray-400 text-sm mb-6">{formData.purpose}</p>

            <a 
              href={`https://wa.me/60103167320?text=${encodeURIComponent(`Hi MIPOS! I just booked a walk-in appointment for ${formData.date} at ${formData.time_slot}.`)}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20BE59] text-white font-extrabold rounded-xl shadow-lg shadow-[#25D366]/30 transition-all mb-3 text-lg"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              {t.contactWhatsapp || 'WhatsApp Us'}
            </a>

            <button onClick={handleReset}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
              {t.bookAnother}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Booking form ──────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-6 md:py-12">
        <div className="w-full max-w-5xl">

          {/* Hero Section */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="text-4xl md:text-5xl font-black text-[#0f172a] mb-4 tracking-tight">
              {t.hero.split('Walk-in').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i === 0 && <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Walk-in</span>}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-[#475569] text-lg font-medium">{t.sub}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* ── Appointment Form (MAIN FOCUS) ────────────────────────────── */}
            <div className="flex-1 w-full glass-panel rounded-[2rem] overflow-hidden">
              
              {/* Top bar: no longer has language switcher here */}
              <div className="bg-white/50 border-b border-gray-100 px-6 py-4 flex items-center">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Appointment Booking</span>
              </div>

              <div className="px-6 py-8 md:px-10">
                {error && (
                  <div className="mb-6 bg-red-500/20 border border-red-400/40 text-red-100 rounded-xl px-4 py-3 text-sm">{error}</div>
                )}
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.name}</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white transition-all text-gray-900 placeholder:text-gray-300 font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.phone} *</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                          placeholder="012-3456789"
                          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white transition-all text-gray-900 placeholder:text-gray-300 font-medium" />
                      </div>
                    </div>
                  </div>

                  {/* Company Name + Language Switcher on the same row */}
                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {t.company} <span className="text-gray-400 font-normal lowercase">{t.companyOptional}</span>
                      </label>
                      {/* ── Language Switcher (inline) ── */}
                      <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-full border border-gray-200">
                        {Object.entries(LANGUAGES).map(([code, info]) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setLang(code)}
                            className={`flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm
                              ${lang === code 
                                ? 'bg-white text-orange-600 shadow-sm border border-gray-100' 
                                : 'bg-transparent text-gray-500 hover:text-gray-900 border border-transparent'}`}
                          >
                            {info.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative group mt-2">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                      <input type="text" name="company" value={formData.company} onChange={handleChange}
                        placeholder="Your Company Name"
                        className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white transition-all text-gray-900 placeholder:text-gray-300 font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.date}</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                        <input type="date" name="date" required value={formData.date} onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white transition-all text-gray-900 font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.timeSlot}</label>
                      <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                        <select name="time_slot" required value={formData.time_slot} onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white appearance-none transition-all text-gray-900 font-medium cursor-pointer">
                          <option value="" className="text-gray-400">{t.selectTime}</option>
                          {TIME_SLOTS.map(slot => <option key={slot} value={slot} className="text-gray-900">{slot}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.purpose}</label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                      <select name="purpose" required value={formData.purpose} onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white appearance-none transition-all text-gray-900 font-medium cursor-pointer">
                        <option value="" className="text-gray-400">{t.selectPurpose}</option>
                        {t.purposes.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-[#FF6600] hover:bg-[#E65C00] disabled:opacity-60 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-500/40 transition-all duration-300 hover:shadow-orange-500/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                    {loading ? t.confirming : t.confirm}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Showroom Center Panel ─────────────────────────────────── */}
            <div className="lg:w-[320px] flex flex-col gap-5">
              
              {/* Info Detail Card */}
              <div className="glass-panel rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{t.addressTitle}</h3>
                </div>

                <div className="w-full h-40 rounded-2xl overflow-hidden mb-5 border border-gray-100 shadow-inner">
                  <iframe 
                    title="Mipos ShopTech Centre Map"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://maps.google.com/maps?q=Mipos+Shoptech+Centre,+29+Jalan+2,+Taman+Len+Seng,+56000+Cheras,+Kuala+Lumpur&output=embed&z=16"
                  />
                </div>

                <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6 whitespace-pre-line">
                  {ADDRESS}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCopy}
                    className={`flex items-center gap-1.5 justify-center py-3 rounded-xl text-xs font-bold transition-all border shadow-sm
                      ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t.copied : t.copyAddress}
                  </button>
                  <a href="https://www.google.com/maps/search/?api=1&query=Mipos+Shoptech+Centre+29+Jalan+2+Taman+Len+Seng+Cheras+56000+Kuala+Lumpur" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 justify-center py-3 orange-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                    <Navigation className="w-3.5 h-3.5" />
                    {t.openMaps}
                  </a>
                </div>
              </div>

              {/* Hours Card */}
              <div className="glass-panel rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{t.hoursTitle}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-500 font-semibold">{t.monFri}</span>
                    <span className="text-gray-900 font-bold">9:30 AM – 4:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-500 font-semibold">{t.sat}</span>
                    <span className="text-gray-900 font-bold">10:00 AM – 12:30 PM</span>
                  </div>
                  <div className="w-full h-px bg-gray-100 my-2" />
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-500 font-semibold">{t.sun}</span>
                    <span className="text-rose-500 font-bold flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {t.closed}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
