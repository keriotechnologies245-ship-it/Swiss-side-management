import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Download, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Transactions() {
  const sessionToken = localStorage.getItem('swiss_side_session') || '';
  const userRole = localStorage.getItem('swiss_side_role') || '';
  const isAdmin = userRole === 'super_admin';

  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({ dateRange: 'all', itemId: 'all', type: 'all', search: '' });

  const historyData = useQuery(api.transactions.getHistory, { token: sessionToken, limit });
  const exportData = useQuery(api.transactions.getAllHistoryForExport, isAdmin ? { token: sessionToken } : "skip");
  const items = useQuery(api.items.getAll, { token: sessionToken });

  const history = historyData?.items || [];
  const hasMore = historyData?.hasMore || false;

  const filteredHistory = history.filter(h => {
    if (!h) return false;
    const matchesItem = filters.itemId === 'all' || h.itemId === filters.itemId;
    const matchesType = filters.type === 'all' || h.type === filters.type;
    const person = h.person || '';
    const itemName = h.itemName || '';
    const search = filters.search || '';
    const matchesSearch = person.toLowerCase().includes(search.toLowerCase()) || 
                          itemName.toLowerCase().includes(search.toLowerCase());
    return matchesItem && matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    if (!exportData || exportData.length === 0) return toast.error("No data available to export.");
    
    const headers = ["Timestamp", "Item Name", "Action", "Quantity", "Unit", "Personnel", "Notes"];
    const rows = exportData.map(h => [
      format(new Date(h._creationTime), 'yyyy-MM-dd HH:mm:ss'),
      h.itemName,
      h.type,
      h.quantity,
      h.unit,
      h.person,
      h.notes || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `swiss_side_audit_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit data exported to CSV.");
  };

  if (historyData === undefined || items === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse text-center">Reading Audit Logs...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Operational Audit Logs</h1>
          <p className="text-slate-500 font-medium max-w-2xl">A high-fidelity trail of all facility movements and personnel actions.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleExportCSV}
            className="btn-primary rounded-2xl flex items-center gap-2 h-14 px-8 text-[10px] font-black uppercase tracking-widest"
          >
            <FileSpreadsheet size={18} /> Export to CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <div className="lg:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search by personnel or item name..." 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
            />
        </div>
        
        <select 
            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
            value={filters.itemId}
            onChange={e => setFilters({...filters, itemId: e.target.value})}
        >
            <option value="all">All Inventory Items</option>
            {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>

        <select 
            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
            value={filters.type}
            onChange={e => setFilters({...filters, type: e.target.value})}
        >
            <option value="all">All Action Types</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="RESTOCK">Restocks</option>
        </select>
      </div>

      <div className="system-card overflow-hidden bg-white shadow-premium border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Asset Involved</th>
                <th className="px-8 py-5 text-center">Action</th>
                <th className="px-8 py-5 text-center">Quantity</th>
                <th className="px-8 py-5">Personnel</th>
                <th className="px-8 py-5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length === 0 ? (
                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-[0.3em] text-xs">No audit records found</td></tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900">{format(new Date(h._creationTime), 'MMM d, yyyy')}</div>
                      <div className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{format(new Date(h._creationTime), 'hh:mm a')}</div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900">{h.itemName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {h._id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`status-badge ${h.type === 'RESTOCK' ? 'status-ok' : 'status-out'}`}>
                        {h.type}
                      </span>
                    </td>
                    <td className={`px-8 py-6 text-center font-black font-mono text-sm ${h.type === 'RESTOCK' ? 'text-success' : 'text-danger'}`}>
                      {h.type === 'RESTOCK' ? '+' : '-'}{h.quantity} <span className="text-[10px] uppercase font-bold opacity-40 ml-1">{h.unit}</span>
                    </td>
                    <td className="px-8 py-6 text-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                          {h.person.charAt(0)}
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest text-slate-700">{h.person}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {h.notes ? (
                        <span className="text-sm text-slate-600 font-medium">{h.notes}</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="p-6 bg-slate-50/30 border-t border-slate-50 text-center">
            <button 
              onClick={() => setLimit(l => l + 50)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              Load More Records <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
