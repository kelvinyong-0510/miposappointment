import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { TrendingUp, ArrowDownRight, FileText, XCircle, Receipt, PhoneCall } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STAGE_COLORS = ['#3B82F6','#6366F1','#FF6600','#8B5CF6','#EAB308','#EC4899','#10B981','#EF4444','#06B6D4','#A78BFA'];

const FUNNEL_STAGES = [
  { key: 'New Lead',     label: 'New Lead',   color: '#e2e8f0', text: '#64748b' },
  { key: 'Contacted',   label: 'Contacted',  color: '#bfdbfe', text: '#1d4ed8' },
  { key: 'Quotation sent', label: 'Quotation', color: '#fed7aa', text: '#c2410c' },
  { key: 'Invoice sent', label: 'Invoice',   color: '#ddd6fe', text: '#6d28d9' },
  { key: 'Closed Won',  label: 'Won',        color: '#bbf7d0', text: '#15803d' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,.08)', fontSize:'.8rem' }}>
      <p style={{ fontWeight:700, color:'#111827', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight:600, margin:'2px 0' }}>
          {p.name}: <span style={{ color:'#374151' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const fmt  = (n) => (n ?? 0).toLocaleString('en-MY');
const pct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

export default function Analytics() {
  const [leads,      setLeads]      = useState([]);
  const [funnel,     setFunnel]     = useState([]);
  const [monthly,    setMonthly]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [graphMonth, setGraphMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [timeFilter, setTimeFilter] = useState('Monthly'); // 'Today', 'Yesterday', 'Weekly', 'Monthly'

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/leads`),
      axios.get(`${API_URL}/analytics/funnel`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/analytics/monthly`).catch(() => ({ data: [] })),
    ]).then(([leadsRes, funnelRes, monthlyRes]) => {
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      setFunnel(Array.isArray(funnelRes.data) ? funnelRes.data : []);
      setMonthly(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ── KPI calculations ── */
  const totalLeads = leads.length;
  const won        = leads.filter(l => l.stage === 'Closed Won').length;
  const lost       = leads.filter(l => l.stage === 'Closed Lost' || l.stage === 'Lost').length;
  const contacted  = leads.filter(l => l.stage === 'Contacted').length;
  const quotation  = leads.filter(l => l.stage === 'Quotation sent' || l.quotation_no).length;
  const invoice    = leads.filter(l => l.stage === 'Invoice sent'   || l.invoice_no).length;
  const convRate   = pct(won, totalLeads);

  /* ── Dynamic Walk-ins Comparison (Time Filter) ── */
  const todayObj = new Date();
  const getISO = d => d.toISOString().slice(0, 10);
  const todayStr = getISO(todayObj);
  const yesterdayStr = getISO(new Date(todayObj.getTime() - 86400000));
  const twoDaysAgoStr = getISO(new Date(todayObj.getTime() - 2 * 86400000));

  const [yearStr, monthStr] = graphMonth.split('-');
  const prevDate = new Date(parseInt(yearStr), parseInt(monthStr) - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  let walkInChartData = [];
  let chartTitle = "Walk-ins Comparison";
  let chartSub = "";
  let currentLegend = "Current";
  let prevLegend = "Previous";

  if (timeFilter === 'Monthly') {
    chartTitle = "Monthly Walk-ins Comparison";
    chartSub = "This month vs previous month";
    currentLegend = graphMonth;
    prevLegend = prevMonthStr;
    const monthLeads = leads.filter(l => l.date?.startsWith(graphMonth));
    const prevMonthLeads  = leads.filter(l => l.date?.startsWith(prevMonthStr));
    const countWeeks = arr => [
      arr.filter(l => { const d = parseInt(l.date?.slice(8) || 0); return d >= 1  && d <= 7;  }).length,
      arr.filter(l => { const d = parseInt(l.date?.slice(8) || 0); return d >= 8  && d <= 14; }).length,
      arr.filter(l => { const d = parseInt(l.date?.slice(8) || 0); return d >= 15 && d <= 21; }).length,
      arr.filter(l => { const d = parseInt(l.date?.slice(8) || 0); return d >= 22; }).length,
    ];
    const [cw1,cw2,cw3,cw4] = countWeeks(monthLeads);
    const [pw1,pw2,pw3,pw4] = countWeeks(prevMonthLeads);
    walkInChartData = [
      { name: 'Week 1', current: cw1, previous: pw1 },
      { name: 'Week 2', current: cw2, previous: pw2 },
      { name: 'Week 3', current: cw3, previous: pw3 },
      { name: 'Week 4', current: cw4, previous: pw4 },
    ];
  } else if (timeFilter === 'Weekly') {
    chartTitle = "Weekly Walk-ins Comparison";
    chartSub = "Last 7 days vs previous 7 days";
    currentLegend = "Last 7 days";
    prevLegend = "Previous 7 days";
    for(let i=6; i>=0; i--) {
      const cD = new Date(todayObj.getTime() - i*86400000);
      const pD = new Date(todayObj.getTime() - (i+7)*86400000);
      walkInChartData.push({
        name: cD.toLocaleDateString('en-US', {weekday:'short'}),
        current: leads.filter(l => l.date?.startsWith(getISO(cD))).length,
        previous: leads.filter(l => l.date?.startsWith(getISO(pD))).length
      });
    }
  } else if (timeFilter === 'Yesterday') {
    chartTitle = "Yesterday's Walk-ins";
    chartSub = "Yesterday vs day before";
    currentLegend = "Yesterday";
    prevLegend = "Day before";
    const getPeriod = t => {
      const h = parseInt((t||'12').split(':')[0]);
      if (h < 12) return 'Morning';
      if (h < 16) return 'Afternoon';
      return 'Evening';
    };
    const cLeads = leads.filter(l => l.date?.startsWith(yesterdayStr));
    const pLeads = leads.filter(l => l.date?.startsWith(twoDaysAgoStr));
    ['Morning','Afternoon','Evening'].forEach(p => {
      walkInChartData.push({
        name: p,
        current: cLeads.filter(l => getPeriod(l.time_slot) === p).length,
        previous: pLeads.filter(l => getPeriod(l.time_slot) === p).length
      });
    });
  } else {
    chartTitle = "Today's Walk-ins";
    chartSub = "Today vs yesterday";
    currentLegend = "Today";
    prevLegend = "Yesterday";
    const getPeriod = t => {
      const h = parseInt((t||'12').split(':')[0]);
      if (h < 12) return 'Morning';
      if (h < 16) return 'Afternoon';
      return 'Evening';
    };
    const cLeads = leads.filter(l => l.date?.startsWith(todayStr));
    const pLeads = leads.filter(l => l.date?.startsWith(yesterdayStr));
    ['Morning','Afternoon','Evening'].forEach(p => {
      walkInChartData.push({
        name: p,
        current: cLeads.filter(l => getPeriod(l.time_slot) === p).length,
        previous: pLeads.filter(l => getPeriod(l.time_slot) === p).length
      });
    });
  }

  const monthlyChart = monthly.map(m => ({ name: m.month?.slice(0, 7) || m.month, count: m.count }));

  /* ── Funnel counts from leads ── */
  const stageCounts = FUNNEL_STAGES.map(s => ({
    ...s,
    count: leads.filter(l => l.stage === s.key).length,
    pct:   totalLeads > 0 ? Math.round((leads.filter(l => l.stage === s.key).length / totalLeads) * 100) : 0,
  }));
  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

  /* Purpose breakdown */
  const allPurposes = [
    'POS System', 'Hardware Devices (Sunmi)', 'Technical Support',
    'LED Board', 'Pager System', 'Queue System', 'Calling System', 'Others'
  ];
  const purposeMap = {};
  allPurposes.forEach(p => purposeMap[p] = 0);
  leads.forEach(l => {
    const p = l.purpose || 'Others';
    if (purposeMap[p] !== undefined) purposeMap[p]++;
    else purposeMap['Others']++;
  });
  const purposeChart = Object.entries(purposeMap).sort((a,b) => b[1]-a[1])
    .map(([name, value]) => ({ name, value }));

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:'#9ca3af', fontSize:'.9rem' }}>
      <div style={{ width:20, height:20, border:'2px solid #e5e7eb', borderTopColor:'#ff6500', borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:10 }} />
      Loading analytics...
    </div>
  );

  /* ── Shared card style ── */
  const card = (extra={}) => ({ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,.04)', ...extra });

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:18 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:'1rem', color:'#111827', margin:0 }}>Analytics Overview</h2>
          <p style={{ fontSize:'.76rem', color:'#9ca3af', margin:'3px 0 0', fontWeight:500 }}>Real-time performance metrics · MIPOS</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:'.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em' }}>Month:</label>
          <input type="month" value={graphMonth} onChange={e => setGraphMonth(e.target.value)}
            style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'5px 10px', fontSize:'.8rem', color:'#374151', background:'#f9fafb', outline:'none', fontFamily:'inherit' }} />
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>

        {/* Contacted */}
        <div style={card({ borderTop: '3px solid #6366f1' })}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <p style={{ fontSize:'.68rem', fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', margin:0 }}>Contacted</p>
            <div style={{ width:32, height:32, borderRadius:8, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <PhoneCall size={15} color="#6366f1" />
            </div>
          </div>
          <p style={{ fontSize:'2rem', fontWeight:900, color:'#6366f1', margin:'0 0 4px', lineHeight:1 }}>{contacted}</p>
          <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:0, fontWeight:500 }}>Stage: Contacted</p>
        </div>

        {/* Quotation */}
        <div style={card({ borderTop: '3px solid #ca8a04' })}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <p style={{ fontSize:'.68rem', fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', margin:0 }}>Quotation</p>
            <div style={{ width:32, height:32, borderRadius:8, background:'#fefce8', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={15} color="#ca8a04" />
            </div>
          </div>
          <p style={{ fontSize:'2rem', fontWeight:900, color:'#ca8a04', margin:'0 0 4px', lineHeight:1 }}>{quotation}</p>
          <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:0, fontWeight:500 }}>Sent / with no.</p>
        </div>

        {/* Invoice */}
        <div style={card({ borderTop: '3px solid #16a34a' })}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <p style={{ fontSize:'.68rem', fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', margin:0 }}>Invoice</p>
            <div style={{ width:32, height:32, borderRadius:8, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={15} color="#16a34a" />
            </div>
          </div>
          <p style={{ fontSize:'2rem', fontWeight:900, color:'#16a34a', margin:'0 0 4px', lineHeight:1 }}>{invoice}</p>
          <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:0, fontWeight:500 }}>Sent / with no.</p>
        </div>

        {/* Lost */}
        <div style={card({ borderTop: '3px solid #ef4444' })}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <p style={{ fontSize:'.68rem', fontWeight:700, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', margin:0 }}>Lost</p>
            <div style={{ width:32, height:32, borderRadius:8, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <XCircle size={15} color="#ef4444" />
            </div>
          </div>
          <p style={{ fontSize:'2rem', fontWeight:900, color:'#ef4444', margin:'0 0 4px', lineHeight:1 }}>{lost}</p>
          <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:0, fontWeight:500 }}>Closed lost</p>
        </div>
      </div>

      {/* WEEKLY WALK-INS COMPARISON */}
      <div style={card({ borderTop: '3px solid #ff6500' })}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ fontWeight:800, fontSize:'.88rem', color:'#111827', margin:0 }}>{chartTitle}</h3>
              <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:'3px 0 0' }}>{chartSub}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', background:'#f8fafc', padding:4, borderRadius:8, border:'1px solid #e2e8f0', marginRight:12 }}>
                {['Today', 'Yesterday', 'Weekly', 'Monthly'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    style={{
                      padding:'4px 12px', fontSize:'.7rem', fontWeight:600, border:'none', cursor:'pointer', borderRadius:6,
                      background: timeFilter === f ? '#ff6500' : 'transparent',
                      color: timeFilter === f ? '#fff' : '#64748b',
                      boxShadow: timeFilter === f ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >{f}</button>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:'.7rem', fontWeight:600 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:4, borderRadius:2, background:'#ff6500', display:'inline-block' }} />
                  {currentLegend}
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:4, borderRadius:2, background:'#94a3b8', display:'inline-block' }} />
                  {prevLegend}
                </span>
              </div>
            </div>
          </div>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={walkInChartData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6500" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ff6500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="previous" stroke="#9ca3af" fill="transparent" name="Previous" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="current"  stroke="#ff6500" fillOpacity={1} fill="url(#colorCurrent)" name="Current" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* ═══════════════════════════════
          PURPOSE BREAKDOWN BAR CHART
      ═══════════════════════════════ */}
      {purposeChart.length > 0 && (
        <div style={card({ borderTop: '3px solid #ff6500' })}>
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:800, fontSize:'.88rem', color:'#111827', margin:0 }}>Appointments by Purpose</h3>
            <p style={{ fontSize:'.72rem', color:'#9ca3af', margin:'3px 0 0' }}>All appointment purposes</p>
          </div>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purposeChart} margin={{ top:15, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#374151', fontWeight:600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4,4,0,0]} barSize={40}>
                  {purposeChart.map((_, i) => (
                    <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#f43f5e', '#eab308', '#06b6d4', '#84cc16'][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
