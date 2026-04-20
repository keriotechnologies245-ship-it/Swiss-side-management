import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Transactions() {
  const history = useQuery(api.transactions.getHistory);
  const items = useQuery(api.items.getAll);

  const [filters, setFilters] = useState({ dateRange: 'all', itemId: 'all', type: 'all', search: '' });

  const filteredHistory = (history || []).filter(h => {
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

  if (history === undefined || items === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Fetching Ledgers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1>Transaction History</h1>
          <p className="text-slate-500 text-sm mt-1">Audit trail of all inventory movements.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-system">
             <span className="text-[11px] font-bold text-slate-500 px-3 uppercase tracking-wider">Date Range:</span>
             <select 
               className="bg-white border border-slate-200 rounded-md py-1.5 px-3 text-sm font-medium focus:outline-none"
               value={filters.dateRange}
               onChange={e => setFilters({...filters, dateRange: e.target.value})}
             >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
             </select>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-system border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search staff or item..." 
                className="input-field pl-10 h-[40px]"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
            />
        </div>
        
        <select 
            className="h-[40px] border border-slate-200 rounded-md px-4 text-sm font-medium focus:outline-primary focus:outline-none min-w-[140px]"
            value={filters.itemId}
            onChange={e => setFilters({...filters, itemId: e.target.value})}
        >
            <option value="all">All Items</option>
            {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>

        <select 
            className="h-[40px] border border-slate-200 rounded-md px-4 text-sm font-medium focus:outline-primary focus:outline-none min-w-[140px]"
            value={filters.type}
            onChange={e => setFilters({...filters, type: e.target.value})}
        >
            <option value="all">All Types</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="RESTOCK">Restocks</option>
        </select>
      </div>

      {/* History Table */}
      <div className="system-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100 text-[12px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Person/Source</th>
                <th className="px-6 py-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-mono text-sm uppercase tracking-widest italic">No matching transactions found</td></tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{format(new Date(h._creationTime), 'MMM d, yyyy')}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">{format(new Date(h._creationTime), 'hh:mm a')}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{h.itemName}</td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${h.type === 'RESTOCK' ? 'status-ok' : 'status-out'}`}>
                        {h.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold font-mono text-sm ${h.type === 'RESTOCK' ? 'text-success' : 'text-danger'}`}>
                      {h.type === 'RESTOCK' ? '+' : '-'}{h.quantity} {h.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{h.person}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">--</td> {/* Balance not tracked in mock */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Showing {filteredHistory.length} of {history.length} transactions</span>
            <div className="flex gap-2">
                <button className="p-2 border border-slate-200 rounded-md text-slate-400 hover:bg-white disabled:opacity-30" disabled><ChevronLeft size={16} /></button>
                <button className="p-2 border border-slate-200 rounded-md text-slate-400 hover:bg-white disabled:opacity-30" disabled><ChevronRight size={16} /></button>
            </div>
        </div>
      </div>
    </div>
  );
}
