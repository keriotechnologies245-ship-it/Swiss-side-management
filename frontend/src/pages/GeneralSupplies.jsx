import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, Package, Search, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

export default function GeneralSupplies() {
  const supplies = useQuery(api.generalSupplies.getAll);
  const createSupply = useMutation(api.generalSupplies.create);
  const updateSupply = useMutation(api.generalSupplies.update);
  const removeSupply = useMutation(api.generalSupplies.remove);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ 
    name: '', 
    quantity: '', 
    unit: 'pieces', 
    reorderLevel: '5', 
    category: 'Cleaning',
    notes: '' 
  });

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        name: item.name, 
        quantity: item.quantity.toString(), 
        unit: item.unit, 
        reorderLevel: item.reorderLevel.toString(), 
        category: item.category,
        notes: item.notes || '' 
      });
    } else {
      setFormData({ name: '', quantity: '', unit: 'pieces', reorderLevel: '5', category: 'Cleaning', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Supply name is required");
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        reorderLevel: parseFloat(formData.reorderLevel) || 0,
        category: formData.category,
        notes: formData.notes
      };
      if (editingItem) {
        await updateSupply({ id: editingItem._id, ...payload });
        toast.success('Supply record updated');
      } else {
        await createSupply(payload);
        toast.success('New supply added');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure? This action is irreversible.')) {
      try {
        await removeSupply({ id: item._id });
        toast.success('Supply removed');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const filteredSupplies = supplies?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (supplies === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse">Inventory Synchronization...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">General Supplies</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Manage cleaning materials, toiletries, and office essentials for the lodge operations.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all">
          <Plus size={20} /> ADD NEW SUPPLY
        </button>
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="system-card overflow-hidden bg-white shadow-premium border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Supply Asset</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5 text-center">Qty</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSupplies.map((item) => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                return (
                  <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                          <Package size={20} />
                        </div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center font-mono font-bold text-slate-700">
                      {item.quantity} <span className="text-[10px] font-medium text-slate-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`status-badge ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}>
                        {isOut ? 'Depleted' : isLow ? 'Low Stock' : 'Sufficient'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-danger transition-all shadow-sm">
                          <Trash2 size={18} />
                        </button>
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
        title={editingItem ? 'Edit Supply Manifest' : 'New Supply Record'}
        footer={(
          <div className="flex gap-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Dismiss</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Save Record'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Item Name</label>
            <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Lavender Floor Cleaner" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Classification</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Cleaning">Cleaning Materials</option>
                <option value="Toiletries">Guest Toiletries</option>
                <option value="Office">Office Supplies</option>
                <option value="Other">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Volume Unit</label>
              <select className="input-field" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="pieces">pieces (pcs)</option>
                <option value="liters">liters (l)</option>
                <option value="kg">kilograms (kg)</option>
                <option value="boxes">boxes</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Available Quantity</label>
              <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Alert Threshold</label>
              <input type="number" className="input-field" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Administrative Notes</label>
            <textarea className="input-field h-24 py-3 items-start" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Procurement details or specific usage rules..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
