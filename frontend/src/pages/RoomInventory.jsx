import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, Package, Search, Filter, Bed } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RoomInventory() {
  const navigate = useNavigate();
  const sessionToken = localStorage.getItem('swiss_side_session') || '';
  const items = useQuery(api.roomItems.getAll, { token: sessionToken });
  const rooms = useQuery(api.rooms.getAll, { token: sessionToken });
  const updateItem = useMutation(api.roomItems.update);
  const removeItem = useMutation(api.roomItems.remove);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ 
    roomId: '', 
    itemName: '', 
    condition: 'Excellent', 
    quantity: '1', 
    notes: '' 
  });

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        roomId: item.roomId, 
        itemName: item.itemName, 
        condition: item.condition, 
        quantity: item.quantity.toString(), 
        notes: item.notes || '' 
      });
    } else {
      setFormData({ roomId: rooms?.[0]?._id || '', itemName: '', condition: 'Excellent', quantity: '1', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomId || !formData.itemName) return toast.error("Required fields missing");
    setLoading(true);
    try {
      const payload = {
        roomId: formData.roomId,
        itemName: formData.itemName,
        condition: formData.condition,
        quantity: parseInt(formData.quantity) || 1,
        notes: formData.notes
      };
      if (editingItem) {
        await updateItem({ token: sessionToken, id: editingItem._id, ...payload });
        toast.success('Asset updated');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message?.replace("Uncaught Error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Remove this asset record?')) {
      try {
        await removeItem({ token: sessionToken, id: item._id });
        toast.success('Asset removed');
      } catch (err) {
        toast.error(err.message?.replace("Uncaught Error: ", ""));
      }
    }
  };

  const getRoomName = (id) => rooms?.find(r => r._id === id)?.name || 'Unknown Room';

  const filteredItems = items?.filter(i => 
    i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getRoomName(i.roomId).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (items === undefined || rooms === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse">Scanning Lodge Inventory...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Global Room Assets</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            A comprehensive master list of all fixtures and furniture across every accommodation unit.
          </p>
        </div>
        <button onClick={() => navigate('/rooms')} className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all">
          <Bed size={20} /> MANAGE BY ROOM
        </button>
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by item or room name..." 
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
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Asset Description</th>
                <th className="px-8 py-5 text-center">Qty</th>
                <th className="px-8 py-5">Condition</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary group-hover:text-white transition-all text-[10px]">
                        R
                      </div>
                      <span className="font-extrabold text-slate-900">{getRoomName(item.roomId)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-700">{item.itemName}</p>
                    {item.notes && <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 line-clamp-1">{item.notes}</p>}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Administrative Asset Edit"
        footer={(
          <div className="flex gap-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Dismiss</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Save Configuration'}
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Item Name</label>
            <input className="input-field" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} placeholder="e.g. Handmade Oak Bedside Table" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Room Assignment</label>
              <select className="input-field" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Quantity</label>
              <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Condition Assessment</label>
            <select className="input-field" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Maintenance">Maintenance Required</option>
              <option value="Broken">Broken / Replacement Ordered</option>
            </select>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Internal Log</label>
            <textarea className="input-field h-24 py-3 items-start" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details for the asset log..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
