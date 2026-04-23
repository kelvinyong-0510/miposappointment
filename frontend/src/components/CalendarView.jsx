import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, X, Edit2, Save, Calendar,
  Clock, User, Phone, Briefcase, Tag, DollarSign, Plus
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STAGES = [
  "Contacted", "Quotation sent", "Invoice sent", "Lost", "Cancel"
];

const STAGE_COLORS = {
  "Contacted":      { bg: 'bg-blue-500/20',   text: 'text-blue-300',   dot: 'bg-blue-500'   },
  "Quotation sent": { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  "Invoice sent":   { bg: 'bg-green-500/20',  text: 'text-green-300',  dot: 'bg-green-400'  },
  "Lost":           { bg: 'bg-red-500/20',    text: 'text-red-300',    dot: 'bg-red-500'    },
  "Cancel":         { bg: 'bg-slate-500/20',  text: 'text-slate-300',  dot: 'bg-slate-500'  },
};

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarView() {
  const [leads, setLeads]         = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [today]                   = useState(new Date());
  const [viewDate, setViewDate]   = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesForm, setSalesForm]           = useState({});
  const [showAddModal, setShowAddModal]     = useState(false);
  const [addForm, setAddForm]               = useState({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: '' });

  const fetchData = useCallback(async () => {
    const [leadsRes, staffRes] = await Promise.all([
      axios.get(`${API_URL}/leads`),
      axios.get(`${API_URL}/staff`),
    ]);
    setLeads(leadsRes.data);
    setStaffList(staffRes.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const startDay     = firstOfMonth.getDay(); // 0=Sun

  const leadsByDate = leads.reduce((acc, lead) => {
    if (!lead.date) return acc;
    const key = lead.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {});

  const todayStr = toDateStr(today);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const dayLeads = selectedDay ? (leadsByDate[selectedDay] || []) : [];

  // ── Inline edit ───────────────────────────────────────────────────────────
  const handleEditClick = (lead) => {
    setEditingId(lead.id);
    setEditForm({
      stage: lead.stage,
      status: lead.status,
      assigned_staff: lead.assigned_staff || '',
      products_interest: lead.products_interest || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    if (name === 'stage' && value === 'Closed Won') {
      setSalesForm({ appointment_id: editingId, invoice_no: '', quotation_no: '', amount: '', items: '', payment_status: 'Paid' });
      setShowSalesModal(true);
    }
  };

  const handleSave = async (id) => {
    await axios.put(`${API_URL}/leads/${id}`, editForm);
    setEditingId(null);
    fetchData();
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/sales`, salesForm);
    setShowSalesModal(false);
    handleSave(editingId);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/leads`, addForm);
    setShowAddModal(false);
    setAddForm({ name: '', phone: '', company: '', date: '', time_slot: '', purpose: '' });
    fetchData();
  };

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      <div className="flex-1 bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 bg-[#0B0F19] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FF6600]" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                {MONTH_NAMES[month]} {year}
              </h2>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-[#FF6600] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#E65C00] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Appointment
          </button>
        </div>

        <div className="grid grid-cols-7 bg-[#1E293B]/50 border-b border-slate-800">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-slate-800/50 bg-[#0B0F19]/30" />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeadsList = leadsByDate[dateStr] || [];
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const hasLeads   = dayLeadsList.length > 0;

            return (
              <div
                key={dateStr}
                id={`cal-day-${dateStr}`}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`
                  min-h-[90px] border-b border-r border-slate-800/50 p-2 cursor-pointer transition-all duration-150
                  ${isSelected ? 'bg-[#FF6600]/10 border-[#FF6600]/30 ring-2 ring-inset ring-[#FF6600]/40 z-10 relative' : 'hover:bg-white/5'}
                `}
              >
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1 transition-colors
                  ${isToday    ? 'bg-[#FF6600] text-white shadow-md shadow-orange-500/20'    : ''}
                  ${isSelected && !isToday ? 'bg-[#FF6600]/20 text-[#FF6600]' : ''}
                  ${!isToday && !isSelected ? 'text-slate-300' : ''}
                `}>
                  {day}
                </div>

                {hasLeads && (
                  <div className="flex flex-col gap-1">
                    {dayLeadsList.slice(0, 3).map(lead => {
                      const fallback = { bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-500' };
                      const colors = STAGE_COLORS[lead.stage] || STAGE_COLORS['Contacted'] || fallback;
                      return (
                        <div key={lead.id} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate border border-transparent ${colors.bg} ${colors.text} ${isSelected ? 'border-white/10' : ''}`}>
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 ${colors.dot}`} />
                          <span className="truncate">{lead.name}</span>
                        </div>
                      );
                    })}
                    {dayLeadsList.length > 3 && (
                      <span className="text-[10px] text-slate-500 pl-1">+{dayLeadsList.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0B0F19]/50 flex flex-wrap gap-3">
          {Object.entries(STAGE_COLORS).map(([stage, colors]) => (
            <div key={stage} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {stage}
            </div>
          ))}
        </div>
      </div>

      {selectedDay ? (
        <div className="lg:w-96 bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0B0F19]/50">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Appointments</p>
                <h3 className="text-lg font-bold text-white">
                  {parseLocalDate(selectedDay).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <span className="bg-[#FF6600]/20 text-[#FF6600] text-xs font-bold px-2 py-0.5 rounded-md self-end mb-0.5">{dayLeads.length}</span>
            </div>
            <button
              id="cal-close-panel"
              onClick={() => { setSelectedDay(null); setEditingId(null); }}
              className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {dayLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Calendar className="w-10 h-10 mb-3 opacity-30 text-slate-400" />
                <p className="text-sm font-medium">No appointments this day</p>
              </div>
            ) : (
              dayLeads
                .slice()
                .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''))
                .map(lead => {
                  const isEditing = editingId === lead.id;
                  const fallback  = { bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-500' };
                  const colors    = STAGE_COLORS[lead.stage] || STAGE_COLORS['Contacted'] || fallback;
                  return (
                    <div key={lead.id} className="p-5 hover:bg-white/[0.02] transition-colors group">
                      {/* Time + stage badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{lead.time_slot || 'No time'}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${colors.bg} ${colors.text}`}>
                          {lead.stage}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="font-bold text-white text-base leading-tight mb-1">{lead.name}</p>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />{lead.phone}
                          </div>
                          {lead.company && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Briefcase className="w-3 h-3 text-slate-500" />{lead.company}
                            </div>
                          )}
                          {lead.purpose && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Tag className="w-3 h-3 text-slate-500" />{lead.purpose}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Stage</label>
                            <select name="stage" value={editForm.stage} onChange={handleEditChange} className="w-full text-sm border border-slate-700/50 rounded-xl px-3 py-2 bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/40 focus:border-[#FF6600] outline-none transition-all">
                              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => handleSave(lead.id)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-[#FF6600] text-white text-xs font-bold rounded-lg hover:bg-[#E65C00]">
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/50">
                          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-70" />
                            {lead.assigned_staff_name || 'Unassigned'}
                          </div>
                          <button
                            id={`cal-edit-lead-${lead.id}`}
                            onClick={() => handleEditClick(lead)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[#FF6600] text-xs font-bold bg-[#FF6600]/10 rounded-lg hover:bg-[#FF6600]/20 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      ) : (
        <div className="lg:w-96 bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 flex flex-col items-center justify-center text-slate-400 py-20 px-8 text-center hidden lg:flex">
          <Calendar className="w-12 h-12 mb-4 opacity-20 text-slate-300" />
          <p className="text-sm font-bold text-white mb-1">Select a day to view appointments</p>
          <p className="text-xs text-slate-500">Click any highlighted date on the calendar to see the day's schedule</p>
        </div>
      )}

      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSalesModal(false)} />
          <div className="relative bg-[#151C2C] ring-1 ring-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 border-t-4 border-emerald-500 overflow-hidden">
            <form onSubmit={handleSalesSubmit}>
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Record Sale</h3>
                    <p className="text-xs text-slate-400">Closing this lead as Won</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Invoice Number', key: 'invoice_no', type: 'text', placeholder: 'INV-0001' },
                    { label: 'Purchased Items', key: 'items', type: 'text', placeholder: 'e.g. FeedMe + Sunmi T2' },
                    { label: 'Total Amount (RM)', key: 'amount', type: 'number', placeholder: '1500.00' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
                      <input
                        type={type}
                        required
                        step={type === 'number' ? '0.01' : undefined}
                        placeholder={placeholder}
                        value={salesForm[key]}
                        onChange={e => setSalesForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none placeholder:text-slate-600 transition-all"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Payment Status</label>
                    <select
                        value={salesForm.payment_status}
                        onChange={e => setSalesForm(prev => ({ ...prev, payment_status: e.target.value }))}
                        className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-[#0B0F19]/50 border-t border-slate-800 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowSalesModal(false)}
                    className="px-5 py-2 text-sm font-semibold text-slate-300 bg-slate-800 border-transparent rounded-xl hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/20">
                    Save Sale
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Appointment Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#151C2C] ring-1 ring-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <form onSubmit={handleAddSubmit}>
              <div className="px-6 py-5 border-b border-slate-800 bg-[#0B0F19]/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-[#FF6600]" /> Add Appointment</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Customer Name*</label>
                    <input type="text" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Phone*</label>
                    <input type="text" required value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Company</label>
                    <input type="text" value={addForm.company} onChange={e => setAddForm({...addForm, company: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                    <input type="date" required value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Time</label>
                    <input type="text" placeholder="e.g. 10:00 AM" value={addForm.time_slot} onChange={e => setAddForm({...addForm, time_slot: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Purpose</label>
                    <input type="text" value={addForm.purpose} onChange={e => setAddForm({...addForm, purpose: e.target.value})} className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#0B0F19]/50 border-t border-slate-800 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-[#FF6600] rounded-xl hover:bg-[#E65C00] transition-colors shadow-sm">Save Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
