import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, Dumbbell, Search, Filter, Wrench, Package } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function GymInventory() {
  const navigate = useNavigate();
  const items = useQuery(api.gymItems.getAll);
  const gymNeeds = useQuery(api.needs.getByDepartment, { department: 'Gym' });
  const createItem = useMutation(api.gymItems.create);
  const updateItem = useMutation(api.gymItems.update);
  const removeItem = useMutation(api.gymItems.remove);
  const createNeed = useMutation(api.needs.create);
  const removeNeed = useMutation(api.needs.remove);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNeedsModalOpen, setIsNeedsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ 
    name: '', 
    condition: 'Excellent', 
    quantity: '1', 
    lastChecked: new Date().toISOString().split('T')[0],
    notes: '' 
  });

  const [needFormData, setNeedFormData] = useState({
    item: '',
    quantity: '',
    priority: 'Medium',
    notes: '',
  });

  const handleNeedSubmit = async () => {
    if (!needFormData.item) return toast.error("Item name is required");
    setLoading(true);
    try {
      await createNeed({
        department: 'Gym',
        item: needFormData.item,
        quantity: needFormData.quantity,
        priority: needFormData.priority,
        notes: needFormData.notes,
        requestor: localStorage.getItem('swiss_side_user') || 'Staff',
      });
      toast.success('Procurement need logged');
      setIsNeedsModalOpen(false);
      setNeedFormData({ item: '', quantity: '', priority: 'Medium', notes: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        name: item.name, 
        condition: item.condition, 
        quantity: item.quantity.toString(), 
        lastChecked: item.lastChecked || new Date().toISOString().split('T')[0],
        notes: item.notes || '' 
      });
    } else {
      setFormData({ name: '', condition: 'Excellent', quantity: '1', lastChecked: new Date().toISOString().split('T')[0], notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Asset name is required");
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        condition: formData.condition,
        quantity: parseInt(formData.quantity) || 1,
        lastChecked: formData.lastChecked,
        notes: formData.notes
      };
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...payload });
        toast.success('Asset updated');
      } else {
        await createItem(payload);
        toast.success('Asset added to gym');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await removeItem({ id: item._id });
        toast.success('Asset removed');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const filteredItems = items?.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (items === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse">Synchronizing Gym Assets...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Gym & Fitness Assets</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Maintain elite performance standards by tracking equipment condition and maintenance cycles.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/gym-maintenance')} className="btn-secondary py-4 px-8 rounded-2xl flex items-center gap-3 border-slate-200">
            <Wrench size={20} /> VIEW MAINTENANCE LOG
          </button>
          <button onClick={() => handleOpenModal()} className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all">
            <Plus size={20} /> ADD GYM EQUIPMENT
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search equipment..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="system-card overflow-hidden bg-white shadow-premium border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Equipment Asset</th>
                <th className="px-8 py-5 text-center">Qty</th>
                <th className="px-8 py-5">Condition</th>
                <th className="px-8 py-5">Last Inspection</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {item._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-mono font-bold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`status-badge ${
                      item.condition === 'Excellent' ? 'status-ok' : 
                      item.condition === 'Good' ? 'bg-slate-100 text-slate-500' : 
                      item.condition === 'Maintenance' ? 'status-low' : 'status-out'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {item.lastChecked ? new Date(item.lastChecked).toLocaleDateString() : 'Pending'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button 
                        onClick={async () => {
                          const newCondition = item.condition === 'Broken' ? 'Good' : 'Broken';
                          await updateItem({ id: item._id, condition: newCondition });
                          toast.success(`Status updated to ${newCondition}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          item.condition === 'Broken' 
                            ? 'bg-success/10 text-success hover:bg-success hover:text-white' 
                            : 'bg-danger/10 text-danger hover:bg-danger hover:text-white'
                        }`}
                      >
                        {item.condition === 'Broken' ? 'Fix' : 'Report Broken'}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Needs Section */}
      <div className="pt-10 border-t border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Procurement Needs</h2>
            <p className="text-slate-500 text-sm font-medium">Items flagged for replacement or new acquisition.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ ...formData, department: 'Gym', type: 'NEED' });
              setIsNeedsModalOpen(true);
            }} 
            className="btn-secondary flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            <Plus size={18} /> LOG NEW NEED
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gymNeeds?.map((need) => (
            <div key={need._id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-premium transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  need.priority === 'High' ? 'bg-danger/10 text-danger' : 
                  need.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-400'
                }`}>
                  {need.priority} Priority
                </span>
                <button onClick={() => removeNeed({ id: need._id })} className="text-slate-300 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">{need.item}</h4>
              <p className="text-xs text-slate-500 mb-4">{need.notes || 'No additional details provided.'}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {need.requestor.charAt(0)}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{need.requestor}</p>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{need.status}</span>
              </div>
            </div>
          ))}
          {gymNeeds?.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] opacity-40">
              <Package size={48} className="mb-4 text-slate-300" />
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No active procurement needs</p>
            </div>
          )}
        </div>
      </div>

      {/* Needs Modal */}
      <Modal 
        isOpen={isNeedsModalOpen} 
        onClose={() => setIsNeedsModalOpen(false)}
        title="Log Procurement Need"
        footer={(
          <div className="flex gap-4">
            <button onClick={() => setIsNeedsModalOpen(false)} className="btn-secondary flex-1">Abort</button>
            <button onClick={handleNeedSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Logging...' : 'Submit Request'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Item Needed</label>
            <input className="input-field" value={needFormData.item} onChange={e => setNeedFormData({...needFormData, item: e.target.value})} placeholder="e.g. 20kg Bumper Plates" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Priority</label>
              <select className="input-field" value={needFormData.priority} onChange={e => setNeedFormData({...needFormData, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Quantity/Specs</label>
              <input className="input-field" value={needFormData.quantity} onChange={e => setNeedFormData({...needFormData, quantity: e.target.value})} placeholder="e.g. 4 pairs" />
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Justification / Notes</label>
            <textarea className="input-field h-24 py-3 items-start" value={needFormData.notes} onChange={e => setNeedFormData({...needFormData, notes: e.target.value})} placeholder="Why is this item needed?" />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Asset Record' : 'New Equipment Entry'}
        footer={(
          <div className="flex gap-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Discard</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Committing...' : 'Commit Changes'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Equipment Name</label>
            <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rogue Fitness Barbell" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Current Condition</label>
              <select className="input-field" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="Excellent">Excellent (New/Pristine)</option>
                <option value="Good">Good (Operational)</option>
                <option value="Maintenance">Maintenance Required</option>
                <option value="Broken">Broken (Out of Order)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Quantity</label>
              <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Last Inspection Date</label>
            <input type="date" className="input-field" value={formData.lastChecked} onChange={e => setFormData({...formData, lastChecked: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Maintenance Notes</label>
            <textarea className="input-field h-24 py-3 items-start" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe any wear or tear..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
