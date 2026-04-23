import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, Trophy, Target, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STAGE_COLORS = ['#3B82F6','#6366F1','#FF6600','#8B5CF6','#EAB308','#EC4899','#10B981','#EF4444','#06B6D4','#A78BFA'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E293B] rounded-xl shadow-lg border border-slate-700/50 px-4 py-3 text-sm">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-bold text-slate-200">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const fmt = (n) => (n ?? 0).toLocaleString('en-MY');
const fmtRM = (n) => `RM ${(n ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export default function Analytics() {
  const [stats, setStats]       = useState({});
  const [funnel, setFunnel]     = useState([]);
  const [monthly, setMonthly]   = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [leads, setLeads]       = useState([]);
  const [graphMonth, setGraphMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/analytics`),
      axios.get(`${API_URL}/analytics/funnel`),
      axios.get(`${API_URL}/analytics/monthly`),
      axios.get(`${API_URL}/analytics/staff`),
      axios.get(`${API_URL}/leads`),
    ]).then(([statsRes, funnelRes, monthlyRes, staffRes, leadsRes]) => {
      setStats(statsRes.data);
      setFunnel(funnelRes.data);
      setMonthly(monthlyRes.data);
      setStaffPerf(staffRes.data);
      setLeads(leadsRes.data);
      setLoading(false);
    }).catch(err => {
      console.error('Analytics fetch error:', err);
      setLoading(false);
    });
  }, []);

  // Build weekly chart data for selected vs previous month
  const [yearStr, monthStr] = graphMonth.split('-');
  const prevMonthDate = new Date(parseInt(yearStr), parseInt(monthStr) - 2, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthLeads = leads.filter(l => l.date?.startsWith(graphMonth));
  const prevMonthLeads = leads.filter(l => l.date?.startsWith(prevMonthStr));

  const countWeeks = (arr) => {
    return [
      arr.filter(l => { const d = parseInt(l.date.slice(8)); return d >= 1  && d <= 7;  }).length,
      arr.filter(l => { const d = parseInt(l.date.slice(8)); return d >= 8  && d <= 14; }).length,
      arr.filter(l => { const d = parseInt(l.date.slice(8)); return d >= 15 && d <= 21; }).length,
      arr.filter(l => { const d = parseInt(l.date.slice(8)); return d >= 22; }).length,
    ];
  };

  const [cw1,cw2,cw3,cw4] = countWeeks(monthLeads);
  const [pw1,pw2,pw3,pw4] = countWeeks(prevMonthLeads);

  const weeklyChart = [
    { name: 'W1', walkins: cw1, prevWalkins: pw1 },
    { name: 'W2', walkins: cw2, prevWalkins: pw2 },
    { name: 'W3', walkins: cw3, prevWalkins: pw3 },
    { name: 'W4', walkins: cw4, prevWalkins: pw4 },
  ];

  // Monthly trend chart (from API)
  const monthlyChart = monthly.map(m => ({
    name: m.month?.slice(0, 7) || m.month,
    count: m.count,
  }));

  // Funnel pie data
  const pieData = funnel.map(f => ({ name: f.stage, value: f.count }));

  // KPI cards config
  const kpis = [
    { label: 'Monthly Walk-ins',  value: fmt(stats.monthlyWalkIns), icon: Users,      color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Conversion Rate',   value: `${stats.conversionRate ?? 0}%`, icon: Target,  color: '#FF6600', bg: 'rgba(249,115,22,0.15)' },
    { label: 'Total Won',         value: fmt(stats.won),            icon: Trophy,     color: '#22C55E', bg: 'rgba(34,197,94,0.15)'  },
    { label: 'Total Revenue',     value: fmtRM(stats.totalRevenue), icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Pending Revenue',   value: fmtRM(stats.pendingRevenue),icon: Activity,  color: '#EAB308', bg: 'rgba(234,179,8,0.15)'  },
    { label: 'Lost Leads',        value: fmt(stats.lost),           icon: AlertCircle, color:'#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <div className="w-8 h-8 border-2 border-[#FF6600]/40 border-t-[#FF6600] rounded-full animate-spin mr-3" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Analytics Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">Real-time performance metrics for MIPOS</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Month:</label>
          <input
            type="month"
            value={graphMonth}
            onChange={e => setGraphMonth(e.target.value)}
            className="bg-[#151C2C] text-sm text-white font-semibold border border-slate-700/50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#FF6600]/40 focus:border-[#FF6600] [color-scheme:dark] transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#151C2C] rounded-2xl p-5 shadow-sm border border-slate-800 hover:bg-[#1E293B] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" /> Live
              </div>
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Walk-ins chart + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area Chart */}
        <div className="lg:col-span-2 bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Walk-ins</h3>
              <p className="text-xs text-slate-400">Selected month vs previous month</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-[#FF6600] inline-block" /> This Month</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-white inline-block" /> Prev Month</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gWalkins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6600" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="prevWalkins" stroke="#FFFFFF" strokeWidth={2} fill="url(#gPrev)" name="Prev Month" dot={{ fill: '#0B0F19', stroke: '#FFFFFF', strokeWidth: 2, r: 4 }} />
                <Area type="monotone" dataKey="walkins" stroke="#FF6600" strokeWidth={2.5} fill="url(#gWalkins)" name="This Month" dot={{ fill: '#0B0F19', stroke: '#FF6600', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Pie */}
        <div className="bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 p-6">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white">Pipeline Breakdown</h3>
            <p className="text-xs text-slate-400">Current lead stages</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} stroke="none" dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.slice(0, 5).map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                      <span className="text-slate-400 truncate max-w-[110px]">{entry.name}</span>
                    </div>
                    <span className="font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Monthly Trend Bar Chart */}
      {monthlyChart.length > 0 && (
        <div className="bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 p-6">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white">Monthly Trend</h3>
            <p className="text-xs text-slate-400">Total walk-ins per month (all-time)</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#FF6600" name="Walk-ins" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Staff Performance Table */}
      {staffPerf.length > 0 && (
        <div className="bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Staff Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Leads assigned and close rates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-800/30">
                  {['Staff Member', 'Total Leads', 'Closed Won', 'Lost', 'Conversion Rate'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {staffPerf.map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6600] to-orange-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-black">{(s.name || 'A')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{s.name}</p>
                          {i === 0 && <span className="text-[10px] text-amber-400 font-bold">🏆 Top Performer</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-semibold">{s.total_leads}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-green-400">{s.won ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-red-400">{s.lost ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px] bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-[#FF6600] to-orange-400"
                            style={{ width: `${Math.min(s.conversion_rate ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white whitespace-nowrap">{s.conversion_rate ?? 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
