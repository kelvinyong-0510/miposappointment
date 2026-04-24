import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Edit2, Save, X, DollarSign, Search, Filter, Users, Trash2, AlertTriangle, MessageCircle, Clock, UserCheck, StickyNote, LayoutList, LayoutGrid } from 'lucide-react';

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
  'New Lead':             { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500',    border: 'border-blue-100' },
  'Appointment Confirmed':{ bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-500',  border: 'border-violet-100' },
  'Walk-In Arrived':      { bg: 'bg-purple-50',  text: 'text-purple-600',  dot: 'bg-purple-500',  border: 'border-purple-100' },
  'Demo Done':            { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500',   border: 'border-amber-100' },
  'Contacted':            { bg: 'bg-cyan-50',    text: 'text-cyan-600',    dot: 'bg-cyan-500',    border: 'border-cyan-100' },
  'Quotation sent':       { bg: 'bg-yellow-50',  text: 'text-yellow-600',  dot: 'bg-yellow-500',  border: 'border-yellow-100' },
  'Invoice sent':         { bg: 'bg-teal-50',    text: 'text-teal-600',    dot: 'bg-teal-500',    border: 'border-teal-100' },
  'Closed Won':           { bg: 'bg-green-50',   text: 'text-green-600',   dot: 'bg-green-500',   border: 'border-green-100' },
  'Closed Lost':          { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     border: 'border-red-100' },
  'Lost':                 { bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-500',    border: 'border-rose-100' },
};

const DEFAULT_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500', border: 'border-gray-200' };

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
  const [viewMode, setViewMode]             = useState('table'); // 'table' or 'kanban'

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
    await axios.post(`${API_URL}/sales`, { ...salesForm, appointment_id: editingId });
    await axios.put(`${API_URL}/leads/${editingId}`, {
      ...editForm,
      stage: 'Closed Won',
      invoice_no: salesForm.invoice_no,
    });
    setShowSalesModal(false);
    setEditingId(null);
    fetchData();
  };

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayAppointments = leads.filter(l => l.date === todayDate);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchQ  = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q);
    const matchS  = !filterStage || l.stage === filterStage;
    const matchD  = !filterDate  || l.date  === filterDate;
    return matchQ && matchS && matchD;
  });

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Appointments List</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">{leads.length} total records • Clean View</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner mr-2">
            <button onClick={() => setViewMode('table')}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-56 transition-all placeholder:text-gray-400 font-medium shadow-sm" />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer font-medium shadow-sm" />
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none transition-all font-medium shadow-sm">
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(search || filterStage || filterDate) && (
            <button onClick={() => { setSearch(''); setFilterStage(''); setFilterDate(''); }}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-10">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-600">No records found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    {['Customer', 'Date & Time', 'Purpose / Product', 'Stage', 'Staff', 'Documents', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((lead) => {
                    const isEditing = editingId === lead.id;
                    const ss = STAGE_STYLE[lead.stage] || DEFAULT_STYLE;

                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full orange-gradient shadow-sm flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-black">{(lead.name || 'A')[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{lead.name}</p>
                              {lead.company && <p className="text-[11px] text-gray-500 font-medium truncate max-w-[120px] mb-0.5">{lead.company}</p>}
                              <a href={`https://wa.me/${formatWhatsApp(lead.phone)}`} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 mt-0.5 text-green-600 hover:text-green-700 transition-colors text-[11px] font-bold">
                                <MessageCircle className="w-3 h-3" />{lead.phone}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-[13px] text-gray-700 font-bold">{lead.date || '—'}</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{lead.time_slot || ''}</p>
                        </td>

                        {/* Purpose / Product */}
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-bold text-gray-700 truncate max-w-[150px]">{lead.purpose || '—'}</p>
                          {isEditing ? (
                            <input type="text" name="products_interest" value={editForm.products_interest} onChange={handleEditChange}
                              className="border border-gray-200 bg-white text-gray-900 rounded-lg px-2.5 py-1.5 w-32 text-xs mt-1.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none placeholder:text-gray-400 font-medium shadow-sm transition-all"
                              placeholder="Product..." />
                          ) : (
                            <p className="text-[11px] text-gray-500 font-medium truncate max-w-[150px] mt-0.5">{lead.products_interest || 'No product'}</p>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select name="stage" value={editForm.stage} onChange={handleEditChange}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-36 shadow-sm transition-all cursor-pointer">
                              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${ss.bg} ${ss.text} ${ss.border}`}>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${ss.dot}`} />
                              {lead.stage}
                            </span>
                          )}
                        </td>

                        {/* Staff */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select name="assigned_staff" value={editForm.assigned_staff} onChange={handleEditChange}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-32 shadow-sm transition-all cursor-pointer">
                              <option value="">Unassigned</option>
                              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-gray-600 truncate max-w-[100px]">
                                {lead.assigned_staff_name || <span className="text-gray-400">Unassigned</span>}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Documents */}
                        <td className="px-5 py-4 min-w-[160px]">
                          <div className="flex flex-col gap-2">
                            {isEditing ? (
                              <>
                                <input type="text" name="quotation_no" value={editForm.quotation_no} onChange={handleEditChange}
                                  className="border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-lg px-2.5 py-1.5 w-32 text-[11px] focus:ring-2 focus:ring-yellow-500/20 font-bold outline-none placeholder:text-yellow-400 shadow-sm transition-all"
                                  placeholder="QT-" />
                                <input type="text" name="invoice_no" value={editForm.invoice_no} onChange={handleEditChange}
                                  className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg px-2.5 py-1.5 w-32 text-[11px] focus:ring-2 focus:ring-emerald-500/20 font-bold outline-none placeholder:text-emerald-400 shadow-sm transition-all"
                                  placeholder="INV-" />
                              </>
                            ) : (
                              <>
                                {lead.quotation_no && <span className="inline-block text-[11px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-md font-mono whitespace-nowrap">{lead.quotation_no}</span>}
                                {lead.invoice_no && <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md font-mono whitespace-nowrap">{lead.invoice_no}</span>}
                                {!lead.quotation_no && !lead.invoice_no && <span className="text-gray-300 text-[11px] font-bold">—</span>}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleSave(lead.id)} disabled={saving}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white text-[11px] font-black rounded-lg hover:bg-orange-700 transition-colors shadow-md disabled:opacity-50">
                                  <Save className="w-3.5 h-3.5" /> Save
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 text-[11px] font-black rounded-lg hover:bg-gray-200 transition-colors shadow-sm">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button onClick={() => openNotes(lead)}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 text-[10px] font-black rounded-lg transition-colors shadow-sm">
                                <StickyNote className="w-3 h-3" /> Notes
                              </button>
                              <button onClick={() => { setSalesForm({ payment_status: 'Paid' }); setShowSalesModal(true); }}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black rounded-lg border border-emerald-200 transition-colors shadow-sm">
                                <DollarSign className="w-3 h-3" /> Win Deal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditClick(lead)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-orange-600 bg-orange-50 text-[11px] font-black border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors shadow-sm">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => setDeleteConfirm(lead.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-red-500 bg-red-50 border border-red-200 text-[11px] font-black rounded-lg hover:bg-red-100 transition-colors shadow-sm">
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
      ) : (
        /* KANBAN VIEW */
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory h-[calc(100vh-250px)] relative z-10">
          {STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage);
            const ss = STAGE_STYLE[stage] || DEFAULT_STYLE;
            
            return (
              <div key={stage} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col bg-gray-50/80 rounded-3xl border border-gray-100 shadow-sm snap-start">
                <div className={`px-5 py-4 border-b border-gray-100 bg-white/50 rounded-t-3xl backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between`}>
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ss.dot}`} />
                    {stage}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss.bg} ${ss.text} border ${ss.border}`}>
                    {stageLeads.length}
                  </span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-semibold border-2 border-dashed border-gray-200 rounded-2xl bg-white/30">
                      No leads here
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div key={lead.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full orange-gradient shadow-sm flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-black">{(lead.name || 'A')[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{lead.name}</h4>
                              {lead.company && <p className="text-[10px] text-gray-500 font-medium truncate max-w-[120px] mt-0.5">{lead.company}</p>}
                            </div>
                          </div>
                          <button onClick={() => setEditingId(lead.id)} className="text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all bg-gray-50 hover:bg-orange-50 p-1.5 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-gray-600 font-bold">{lead.date}</span>
                            <span className="text-gray-400 font-medium">{lead.time_slot}</span>
                          </div>
                          {lead.purpose && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-gray-700 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                              <span className="truncate">{lead.purpose}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <a href={`https://wa.me/${formatWhatsApp(lead.phone)}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-bold text-[11px] bg-green-50 px-2 py-1 rounded-md transition-colors border border-green-100">
                            <MessageCircle className="w-3 h-3" /> Chat
                          </a>
                          {lead.assigned_staff_name && (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-[9px]" title={`Assigned to: ${lead.assigned_staff_name}`}>
                              {lead.assigned_staff_name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals updated to clean style */}
      {showNotesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowNotesId(null)} />
          <div className="relative bg-white ring-1 ring-gray-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                   <StickyNote className="w-5 h-5 text-indigo-500" />
                 </div>
                 <div>
                   <h3 className="text-base font-black text-gray-900">Staff Notes</h3>
                   <p className="text-xs text-gray-500 font-medium">Internal notes for this lead</p>
                 </div>
               </div>
               <textarea
                 value={notesValue}
                 onChange={e => setNotesValue(e.target.value)}
                 rows={5}
                 placeholder="Add internal notes about this customer or appointment..."
                 className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-900 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none placeholder:text-gray-400 font-medium shadow-sm transition-all"
               />
             </div>
             <div className="px-6 pb-5 flex gap-3 justify-end bg-gray-50/50 border-t border-gray-100 pt-4">
               <button onClick={() => setShowNotesId(null)}
                 className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                 Cancel
               </button>
               <button onClick={() => saveNotes(showNotesId)}
                 className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
                 Save Notes
               </button>
             </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white ring-1 ring-gray-200 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
             <div className="px-8 py-8 text-center">
               <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                 <AlertTriangle className="w-8 h-8 text-red-500" />
               </div>
               <h3 className="text-[19px] font-black text-gray-900 mb-2">Delete Lead?</h3>
               <p className="text-sm text-gray-500 font-medium leading-relaxed">
                 This will permanently remove{' '}
                 <span className="font-bold text-gray-900">{leads.find(l => l.id === deleteConfirm)?.name}</span>.
                 This cannot be undone.
               </p>
             </div>
             <div className="px-8 pb-8 flex gap-3">
               <button onClick={() => setDeleteConfirm(null)}
                 className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
                 Cancel
               </button>
               <button onClick={() => handleDelete(deleteConfirm)}
                 className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-500/20">
                 Yes, Delete
               </button>
             </div>
          </div>
        </div>
      )}

      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowSalesModal(false)} />
          <div className="relative bg-white ring-1 ring-gray-200 rounded-3xl shadow-2xl w-full max-w-md mx-4 border-t-8 border-emerald-500 overflow-hidden">
            <form onSubmit={handleSalesSubmit}>
               <div className="px-8 py-7">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                     <DollarSign className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-gray-900">Record Sale</h3>
                     <p className="text-xs text-gray-500 font-semibold">Mark lead as Closed Won</p>
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
                       <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-widest">{label}</label>
                       <input type={type} required={required} step={type === 'number' ? '0.01' : undefined}
                         placeholder={placeholder} value={salesForm[key] || ''}
                         onChange={e => setSalesForm(prev => ({ ...prev, [key]: e.target.value }))}
                         className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-gray-50 text-gray-900 font-medium shadow-sm transition-all placeholder:text-gray-400" />
                     </div>
                   ))}
                   <div>
                     <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-widest">Payment Status</label>
                     <select value={salesForm.payment_status}
                       onChange={e => setSalesForm(prev => ({ ...prev, payment_status: e.target.value }))}
                       className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-900 font-medium focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm">
                       <option value="Paid">Paid</option>
                       <option value="Pending">Pending</option>
                     </select>
                   </div>
                 </div>
               </div>
               <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                 <button type="button" onClick={() => setShowSalesModal(false)}
                   className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                   Cancel
                 </button>
                 <button type="submit"
                   className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20">
                   Record & Set Won
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
