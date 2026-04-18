import { useState, useEffect, useCallback } from 'react';
import { fetchItems, fetchHistory, createWithdrawal, addStock } from '../api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Form States
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ itemId: '', quantity: '', staffName: '', source: '', notes: '' });
  const [userName, setUserName] = useState('Manager');

  const loadData = useCallback(async () => {
    try {
      const [iRes, hRes, user] = await Promise.all([fetchItems(), fetchHistory(), supabase.auth.getUser()]);
      setItems(iRes.data || []);
      if (user.data.user) setUserName(user.data.user.email.split('@')[0]);
      const todayStr = new Date().toDateString();
      setHistory((hRes.data || []).filter(h => new Date(h.created_at).toDateString() === todayStr));
    } catch (err) {
      toast.error('Failed to sync with database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please log in again.');

      await createWithdrawal({
        itemId: parseInt(formData.itemId),
        quantity: parseFloat(formData.quantity),
        staffName: formData.staffName || user.email.split('@')[0], // Use form name or clean email
        notes: formData.notes
      });
      toast.success('Withdrawal logged successfully');
      setIsWithdrawModalOpen(false);
      setFormData({ itemId: '', quantity: '', staffName: '', source: '', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      await addStock({
        itemId: parseInt(formData.itemId),
        quantity: parseFloat(formData.quantity),
        source: formData.source || user.email.split('@')[0], // Use form source or clean email
        notes: formData.notes
      });
      toast.success('Stock added successfully');
      setIsAddStockModalOpen(false);
      setFormData({ itemId: '', quantity: '', staffName: '', source: '', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const selectedItem = items.find(i => i.id.toString() === formData.itemId);

  if (loading) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs animate-pulse">Initializing System...</div>;

  const lowStockCount = (items || []).filter(i => (i?.quantity || 0) > 0 && (i?.quantity || 0) <= (i?.reorder_level || 0)).length;

  return (
    <div className="space-y-6">
      
      {/* Greeting Section */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-system border border-primary/10">
        <h2 className="text-slate-900 capitalize">Good morning, {userName}</h2>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs-label text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <p className="text-xs-label text-slate-500">{format(new Date(), 'hh:mm a')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="system-card p-6 text-center">
          <p className="text-xs-label text-slate-400 mb-2 uppercase tracking-widest">Total Items</p>
          <p className="text-3xl font-bold text-slate-900">{items.length}</p>
          <p className="text-[12px] text-slate-500 mt-1">Items tracked</p>
        </div>
        <div className="system-card p-6 text-center">
          <p className="text-xs-label text-slate-400 mb-2 uppercase tracking-widest">Low Stock</p>
          <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-danger' : 'text-success'}`}>{lowStockCount}</p>
          <p className="text-[12px] text-slate-500 mt-1">Items need restock</p>
        </div>
        <div className="system-card p-6 text-center">
          <p className="text-xs-label text-slate-400 mb-2 uppercase tracking-widest">Today</p>
          <p className="text-3xl font-bold text-slate-900">{history.length}</p>
          <p className="text-[12px] text-slate-500 mt-1">Transactions</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="h-[56px] rounded-system border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all uppercase tracking-wider text-sm"
        >
          Log Withdrawal
        </button>
        <button 
          onClick={() => setIsAddStockModalOpen(true)}
          className="h-[56px] rounded-system bg-primary text-white font-bold hover:bg-primary-dark transition-all uppercase tracking-wider text-sm shadow-sm"
        >
          Add Stock
        </button>
      </div>

      {/* Current Stock Levels */}
      <div className="system-card">
        <div className="px-6 py-4 border-b-2 border-slate-100 bg-slate-50/50">
          <h4 className="text-xs-label font-bold text-slate-500 uppercase tracking-widest">Current Stock Levels</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[12px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Current</th>
                <th className="px-6 py-3">Reorder</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.reorder_level;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate('/inventory')}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-sm">{item.reorder_level} {item.unit}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`status-badge ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}>
                        {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <span className="text-[12px] font-bold text-primary hover:underline uppercase tracking-widest">View</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Transactions */}
      <div className="system-card">
        <div className="px-6 py-4 border-b-2 border-slate-100 bg-slate-50/50">
          <h4 className="text-xs-label font-bold text-slate-500 uppercase tracking-widest">Today's Transactions</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[12px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3 text-right">Person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">No transactions logged today</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs italic">{format(new Date(h.created_at), 'hh:mm a')}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{h.item_name}</td>
                    <td className={`px-6 py-4 text-[11px] font-bold uppercase ${h.type === 'RESTOCK' ? 'text-success' : 'text-danger'}`}>{h.type}</td>
                    <td className={`px-6 py-4 font-bold font-mono text-sm ${h.type === 'RESTOCK' ? 'text-success' : 'text-danger'}`}>
                      {h.type === 'RESTOCK' ? '+' : '-'}{h.quantity} {h.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-right font-medium">{h.person}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Log Withdrawal Modal */}
      <Modal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Log Withdrawal"
        footer={(
          <>
            <button onClick={() => setIsWithdrawModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleWithdraw} disabled={formLoading} className="btn-primary">
              {formLoading ? 'Saving...' : 'Log Withdrawal'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Select Item</label>
            <select 
              className="input-field"
              value={formData.itemId}
              onChange={e => setFormData({...formData, itemId: e.target.value})}
            >
              <option value="">Select an item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} available)</option>)}
            </select>
          </div>
          {selectedItem && (
            <div className="bg-slate-50 p-3 rounded-input text-sm text-slate-500 flex justify-between">
              <span>Current Stock: <strong className="text-slate-900">{selectedItem.quantity} {selectedItem.unit}</strong></span>
              <span>Reorder Level: <strong className="text-slate-900">{selectedItem.reorder_level} {selectedItem.unit}</strong></span>
            </div>
          )}
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Quantity to Withdraw</label>
            <div className="relative">
              <input 
                type="number" 
                className="input-field"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                placeholder="0.00"
              />
              {selectedItem && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-[10px]">{selectedItem.unit}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Staff Member</label>
            <input 
              type="text" 
              className="input-field"
              value={formData.staffName}
              onChange={e => setFormData({...formData, staffName: e.target.value})}
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Purpose (Optional)</label>
            <input 
              type="text" 
              className="input-field"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="e.g. Breakfast prep"
            />
          </div>
        </div>
      </Modal>

      {/* Add Stock Modal */}
      <Modal 
        isOpen={isAddStockModalOpen} 
        onClose={() => setIsAddStockModalOpen(false)}
        title="Add Stock (Restock)"
        footer={(
          <>
            <button onClick={() => setIsAddStockModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddStock} disabled={formLoading} className="btn-primary">
              {formLoading ? 'Adding...' : 'Add Stock'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Select Item</label>
            <select 
              className="input-field"
              value={formData.itemId}
              onChange={e => setFormData({...formData, itemId: e.target.value})}
            >
              <option value="">Select an item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.quantity} {i.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Quantity to Add</label>
            <div className="relative">
              <input 
                type="number" 
                className="input-field"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                placeholder="0.00"
              />
              {selectedItem && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-[10px]">{selectedItem.unit}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Source/Supplier</label>
            <input 
              type="text" 
              className="input-field uppercase"
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value})}
              placeholder="e.g. Nakumatt Wholesale"
            />
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Invoice/Reference (Optional)</label>
            <input 
              type="text" 
              className="input-field"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="e.g. Invoice #1234"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
