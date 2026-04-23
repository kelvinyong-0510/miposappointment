import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Edit2, Save, X, DollarSign, Search, Filter, Users, Trash2, AlertTriangle, MessageCircle, Clock, UserCheck, StickyNote, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STAGES = [
  'New Lead',
  'Appointment Confirmed',
  'Walk-In Arrived',
  'Demo Done',
  'Contacted',
  'Quotation sent',
  'Invoice sent',
  'Closed Won',
  'Closed Lost',
  'Lost',
];

const STAGE_STYLE = {
  'New Lead':             { bg: 'bg-blue-500/20',    text: 'text-blue-300',    dot: 'bg-blue-500'    },
  'Appointment Confirmed':{ bg: 'bg-violet-500/20',  text: 'text-violet-300',  dot: 'bg-violet-500'  },
  'Walk-In Arrived':      { bg: 'bg-purple-500/20',  text: 'text-purple-300',  dot: 'bg-purple-400'  },
  'Demo Done':            { bg: 'bg-amber-500/20',   text: 'text-amber-300',   dot: 'bg-amber-400'   },
  'Contacted':            { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    dot: 'bg-cyan-500'    },
  'Quotation sent':       { bg: 'bg-yellow-500/20',  text: 'text-yellow-300',  dot: 'bg-yellow-400'  },
  'Invoice sent':         { bg: 'bg-teal-500/20',    text: 'text-teal-300',    dot: 'bg-teal-400'    },
  'Closed Won':           { bg: 'bg-green-500/20',   text: 'text-green-300',   dot: 'bg-green-400'   },
  'Closed Lost':          { bg: 'bg-red-500/20',     text: 'text-red-300',     dot: 'bg-red-500'     },
  'Lost':                 { bg: 'bg-rose-500/20',    text: 'text-rose-300',    dot: 'bg-rose-500'    },
};

const DEFAULT_STYLE = { bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-500' };

const formatWhatsApp = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '6' + digits;
  if (!digits.startsWith('60') && digits.length > 8) return '60' + digits;
  return digits;
};

export default function LeadsTable() {
  const [leads, setLeads]                   = useState([]);
  const [staffList, setStaffList]           = useState([]);
  const [editingId, setEditingId]           = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [showNotesId, setShowNotesId]       = useState(null);
  const [notesValue, setNotesValue]         = useState('');
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesForm, setSalesForm]           = useState({ payment_status: 'Paid' });
  const [search, setSearch]                 = useState('');
  const [filterStage, setFilterStage]       = useState('');
  const [filterDate, setFilterDate]         = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [saving, setSaving]                 = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, staffRes] = await Promise.all([
        axios.get(`${API_URL}/leads`),
        axios.get(`${API_URL}/staff`),
      ]);
      setLeads(leadsRes.data);
      setStaffList(staffRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEditClick = (lead) => {
    setEditingId(lead.id);
    setEditForm({
      stage:             lead.stage || 'New Lead',
      status:            lead.status || 'Pending',
      products_interest: lead.products_interest || '',
      quotation_no:      lead.quotation_no || '',
      invoice_no:        lead.invoice_no || '',
      assigned_staff:    lead.assigned_staff || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/leads/${id}`, editForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}/leads/${id}`);
    setDeleteConfirm(null);
    fetchData();
  };

  // Notes quick-save
  const openNotes = (lead) => {
    setShowNotesId(lead.id);
    setNotesValue(lead.notes || '');
  };

  const saveNotes = async (id) => {
    await axios.put(`${API_URL}/leads/${id}`, { notes: notesValue });
    setShowNotesId(null);
    fetchData();
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    const lead = leads.find(l => l.id === editingId);
    await axios.post(`${API_URL}/sales`, { ...salesForm, appointment_id: editingId });
    // Sync invoice_no and mark as Closed Won
    await axios.put(`${API_URL}/leads/${editingId}`, {
      ...editForm,
      stage: 'Closed Won',
      invoice_no: salesForm.invoice_no,
    });
    setShowSalesModal(false);
    setEditingId(null);
    fetchData();
  };

  // Today banner
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayAppointments = leads.filter(l => l.date === todayDate);

  // Filtered rows
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchQ  = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q);
    const matchS  = !filterStage || l.stage === filterStage;
    const matchD  = !filterDate  || l.date  === filterDate;
    return matchQ && matchS && matchD;
  });

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Appointments List</h2>
          <p className="text-sm text-slate-400 mt-0.5">{leads.length} total records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-700/50 rounded-xl bg-[#151C2C] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none w-48 transition-all placeholder:text-slate-500" />
          </div>
          {/* Date filter */}
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-700/50 rounded-xl bg-[#151C2C] text-slate-300 focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none transition-all cursor-pointer [color-scheme:dark]" />
          {/* Stage filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-slate-700/50 rounded-xl bg-[#151C2C] text-white focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none appearance-none transition-all">
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(search || filterStage || filterDate) && (
            <button onClick={() => { setSearch(''); setFilterStage(''); setFilterDate(''); }}
              className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6600]" /> Today's Appointments
            <span className="bg-[#FF6600]/20 text-[#FF6600] px-1.5 py-0.5 rounded-md text-[10px] ml-1">{todayAppointments.length}</span>
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {todayAppointments.map(lead => {
              const ss = STAGE_STYLE[lead.stage] || DEFAULT_STYLE;
              return (
                <div key={lead.id} className="bg-[#151C2C] border border-slate-700/50 hover:border-[#FF6600]/50 transition-colors rounded-2xl p-4 min-w-[260px] flex-shrink-0 flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{lead.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{lead.time_slot}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>{lead.stage}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
                    <p className="text-xs text-slate-500 truncate max-w-[120px]">{lead.purpose || '—'}</p>
                    <a href={`https://wa.me/${formatWhatsApp(lead.phone)}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors text-xs font-bold">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#151C2C] rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Users className="w-12 h-12 mb-3 opacity-20 text-slate-400" />
            <p className="font-semibold text-sm">No records found</p>
            <p className="text-xs mt-1 opacity-60">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-800/30 border-b border-slate-800">
                  {['Customer', 'Date & Time', 'Purpose / Product', 'Stage', 'Staff', 'Documents', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((lead) => {
                  const isEditing = editingId === lead.id;
                  const ss = STAGE_STYLE[lead.stage] || DEFAULT_STYLE;

                  return (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors group">

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6600] to-orange-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-black">{(lead.name || 'A')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white whitespace-nowrap">{lead.name}</p>
                            {lead.company && <p className="text-[11px] text-slate-500 italic truncate max-w-[100px]">{lead.company}</p>}
                            <a href={`https://wa.me/${formatWhatsApp(lead.phone)}`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-0.5 text-green-400 hover:text-green-300 transition-colors text-[10px] font-bold font-mono">
                              <MessageCircle className="w-3 h-3" />{lead.phone}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[13px] text-slate-300 font-medium">{lead.date || '—'}</p>
                        <p className="text-[11px] text-slate-500">{lead.time_slot || ''}</p>
                      </td>

                      {/* Purpose / Product */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-semibold text-slate-300 truncate max-w-[130px]">{lead.purpose || '—'}</p>
                        {isEditing ? (
                          <input type="text" name="products_interest" value={editForm.products_interest} onChange={handleEditChange}
                            className="border border-slate-700/50 bg-[#0B0F19] text-white rounded-lg px-2 py-1 w-28 text-[11px] mt-1 focus:ring-1 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none placeholder:text-slate-600"
                            placeholder="Product..." />
                        ) : (
                          <p className="text-[11px] text-slate-500 truncate max-w-[130px] mt-0.5">{lead.products_interest || 'No product'}</p>
                        )}
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isEditing ? (
                          <select name="stage" value={editForm.stage} onChange={handleEditChange}
                            className="border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs bg-[#0B0F19] text-white focus:ring-1 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none w-36">
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${ss.bg} ${ss.text}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />
                            {lead.stage}
                          </span>
                        )}
                      </td>

                      {/* Staff Assignment */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isEditing ? (
                          <select name="assigned_staff" value={editForm.assigned_staff} onChange={handleEditChange}
                            className="border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs bg-[#0B0F19] text-white focus:ring-1 focus:ring-[#FF6600]/30 focus:border-[#FF6600] outline-none w-32">
                            <option value="">Unassigned</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="text-[12px] text-slate-400 truncate max-w-[90px]">
                              {lead.assigned_staff_name || <span className="text-slate-600">Unassigned</span>}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Documents */}
                      <td className="px-4 py-3.5 min-w-[150px]">
                        <div className="flex flex-col gap-1.5">
                          {isEditing ? (
                            <>
                              <input type="text" name="quotation_no" value={editForm.quotation_no} onChange={handleEditChange}
                                className="border border-slate-700/50 bg-[#0B0F19] text-yellow-300 rounded-md px-2 py-1.5 w-32 text-[11px] focus:ring-1 focus:ring-yellow-500/30 font-mono outline-none placeholder:text-slate-600"
                                placeholder="QT-" />
                              <input type="text" name="invoice_no" value={editForm.invoice_no} onChange={handleEditChange}
                                className="border border-slate-700/50 bg-[#0B0F19] text-green-300 rounded-md px-2 py-1.5 w-32 text-[11px] focus:ring-1 focus:ring-green-500/30 font-mono outline-none placeholder:text-slate-600"
                                placeholder="INV-" />
                            </>
                          ) : (
                            <>
                              {lead.quotation_no && <span className="inline-block text-[11px] font-bold text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-md font-mono whitespace-nowrap">{lead.quotation_no}</span>}
                              {lead.invoice_no && <span className="inline-block text-[11px] font-bold text-green-300 bg-green-500/20 px-2 py-1 rounded-md font-mono whitespace-nowrap">{lead.invoice_no}</span>}
                              {!lead.quotation_no && !lead.invoice_no && <span className="text-slate-600 text-[11px]">—</span>}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleSave(lead.id)} disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6600] text-white text-xs font-bold rounded-lg hover:bg-[#E65C00] transition-colors shadow-sm disabled:opacity-50">
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Notes quick-edit */}
                            <button onClick={() => openNotes(lead)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/60 text-slate-400 hover:text-white text-[10px] font-bold rounded-lg hover:bg-slate-700 transition-colors">
                              <StickyNote className="w-3 h-3" /> Notes
                            </button>
                            {/* Record Sale */}
                            <button onClick={() => { setSalesForm({ payment_status: 'Paid' }); setShowSalesModal(true); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg border border-emerald-500/20 transition-colors">
                              <DollarSign className="w-3 h-3" /> Won
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleEditClick(lead)}
                              className="flex items-center gap-1 px-3 py-1.5 text-[#FF6600] text-[11px] font-bold border border-[#FF6600]/30 rounded-lg hover:bg-[#FF6600]/10 transition-colors">
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => setDeleteConfirm(lead.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-red-400 text-[11px] font-bold border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Notes Modal ─────────────────────────────────────────────────────── */}
      {showNotesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotesId(null)} />
          <div className="relative bg-[#151C2C] ring-1 ring-white/10 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <StickyNote className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Staff Notes</h3>
                  <p className="text-xs text-slate-400">Internal notes for this lead</p>
                </div>
              </div>
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                rows={5}
                placeholder="Add internal notes about this customer or appointment..."
                className="w-full border border-slate-700/50 rounded-xl px-4 py-3 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none resize-none placeholder:text-slate-600 transition-all"
              />
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowNotesId(null)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => saveNotes(showNotesId)}
                className="px-4 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-400 transition-colors">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#151C2C] ring-1 ring-white/10 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-8 py-7 text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">Delete This Lead?</h3>
              <p className="text-sm text-slate-400">
                This will permanently remove{' '}
                <span className="font-semibold text-slate-300">{leads.find(l => l.id === deleteConfirm)?.name}</span>
                {' '}and all their data. This cannot be undone.
              </p>
            </div>
            <div className="px-8 pb-7 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Modal (Record Closed Won) ─────────────────────────────────── */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSalesModal(false)} />
          <div className="relative bg-[#151C2C] ring-1 ring-white/10 rounded-3xl shadow-2xl w-full max-w-md mx-4 border-t-4 border-emerald-500 overflow-hidden">
            <form onSubmit={handleSalesSubmit}>
              <div className="px-8 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Record Sale</h3>
                    <p className="text-xs text-slate-400">Mark this lead as Closed Won</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Quotation Number', key: 'quotation_no', type: 'text',   placeholder: 'QT-0001',        required: false },
                    { label: 'Invoice Number',   key: 'invoice_no',   type: 'text',   placeholder: 'INV-0001',       required: true  },
                    { label: 'Purchased Items',  key: 'items',        type: 'text',   placeholder: 'e.g. Sunmi T2',  required: true  },
                    { label: 'Total Amount (RM)',key: 'amount',       type: 'number', placeholder: '1500.00',        required: true  },
                  ].map(({ label, key, type, placeholder, required }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
                      <input type={type} required={required} step={type === 'number' ? '0.01' : undefined}
                        placeholder={placeholder} value={salesForm[key] || ''}
                        onChange={e => setSalesForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none bg-[#0B0F19] text-white transition-all placeholder:text-slate-600" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Payment Status</label>
                    <select value={salesForm.payment_status}
                      onChange={e => setSalesForm(prev => ({ ...prev, payment_status: e.target.value }))}
                      className="w-full border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm bg-[#0B0F19] text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all">
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-8 py-5 bg-slate-800/30 border-t border-slate-800 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowSalesModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/20">
                  Record & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
