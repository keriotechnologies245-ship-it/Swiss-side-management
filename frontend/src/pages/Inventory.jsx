import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, ChefHat, Search, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const navigate = useNavigate();
  const items = useQuery(api.items.getAll);
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', unit: 'kg', quantity: '', reorderLevel: '', notes: '' });

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        name: item.name, 
        unit: item.unit, 
        quantity: item.quantity.toString(), 
        reorderLevel: item.reorderLevel.toString(), 
        notes: item.notes || '' 
      });
    } else {
      setFormData({ name: '', unit: 'kg', quantity: '', reorderLevel: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Item name is required");
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        quantity: parseFloat(formData.quantity) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 0,
      };
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...payload });
        toast.success('Inventory updated');
      } else {
        await createItem(payload);
        toast.success('Item added to stock');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure? This item will be removed from all reports.')) {
      try {
        await removeItem({ id: item._id });
        toast.success('Item deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const filteredItems = items?.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (items === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse">Scanning Kitchen Stores...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Kitchen Inventory</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Real-time tracking of consumables and supplies. Ensure your kitchen is always prepared for peak performance.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all">
          <Plus size={20} /> ADD STOCK ITEM
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search items by name..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all">
          <Filter size={20} />
        </button>
      </div>

      <div className="system-card overflow-hidden bg-white shadow-premium border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Item Identifier</th>
                <th className="px-8 py-5">Current Volume</th>
                <th className="px-8 py-5">Threshold</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Administrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                return (
                  <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-bold">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-mono text-lg font-bold text-slate-700">
                      {item.quantity} <span className="text-xs font-medium text-slate-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-bold text-sm">
                      {item.reorderLevel} <span className="text-[10px] uppercase">{item.unit}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`status-badge ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}>
                        {isOut ? 'Depleted' : isLow ? 'Low Stock' : 'Optimized'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => navigate('/withdraw', { state: { itemId: item._id } })}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          Withdraw
                        </button>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDelete(item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-danger transition-all shadow-sm">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Manifest' : 'Add Stock Record'}
        footer={(
          <div className="flex gap-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Abort</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Authorize Save'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Ingredient / Supply Name</label>
            <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Arabica Coffee Beans" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Unit</label>
              <select className="input-field" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="kg">kilograms (kg)</option>
                <option value="liters">liters (l)</option>
                <option value="pieces">units (pcs)</option>
                <option value="bags">bags</option>
                <option value="boxes">boxes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Current Stock</label>
              <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Safety Threshold (Reorder Level)</label>
            <input type="number" className="input-field" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
            <p className="text-[10px] text-slate-400 mt-2 italic">The system will trigger a critical alert when stock falls below this value.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
