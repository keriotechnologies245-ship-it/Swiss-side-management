import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Plus, Pencil, Trash2, Package, AlertTriangle, MessageSquare, Check, Clock } from 'lucide-react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const sessionToken = localStorage.getItem('swiss_side_session') || '';
  
  const room = useQuery(api.rooms.getById, { token: sessionToken, id: roomId });
  const items = useQuery(api.roomItems.getByRoom, { token: sessionToken, roomId });
  const createItem = useMutation(api.roomItems.create);
  const updateItem = useMutation(api.roomItems.update);
  const removeItem = useMutation(api.roomItems.remove);

  const requests = useQuery(api.needs.getByRoom, { token: sessionToken, roomId });
  const createRequest = useMutation(api.needs.create);
  const updateRequestStatus = useMutation(api.needs.updateStatus);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    itemName: '', 
    condition: 'Excellent', 
    quantity: '1', 
    notes: '' 
  });

  const [requestForm, setRequestForm] = useState({ 
    item: '', 
    quantity: '1', 
    priority: 'Medium', 
    notes: '' 
  });

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        itemName: item.itemName, 
        condition: item.condition, 
        quantity: item.quantity.toString(), 
        notes: item.notes || '' 
      });
    } else {
      setFormData({ itemName: '', condition: 'Excellent', quantity: '1', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName) return toast.error("Item name is required");
    setLoading(true);
    try {
      if (editingItem) {
        await updateItem({ token: sessionToken, id: editingItem._id, roomId, ...formData, quantity: parseInt(formData.quantity) });
        toast.success('Asset updated');
      } else {
        await createItem({ token: sessionToken, roomId, ...formData, quantity: parseInt(formData.quantity) });
        toast.success('Asset added to room');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message?.replace("Uncaught Error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.item) return toast.error("Request item is required");
    setLoading(true);
    try {
      await createRequest({
        token: sessionToken,
        department: "Rooms",
        roomId,
        item: requestForm.item,
        quantity: requestForm.quantity,
        priority: requestForm.priority,
        notes: requestForm.notes,
        requestor: localStorage.getItem('swiss_side_display_name') || 'Staff',
      });
      toast.success("Request logged");
      setIsRequestModalOpen(false);
      setRequestForm({ item: '', quantity: '1', priority: 'Medium', notes: '' });
    } catch (err) {
      toast.error(err.message?.replace("Uncaught Error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const markRequestFulfilled = async (reqId) => {
    try {
      await updateRequestStatus({ token: sessionToken, id: reqId, status: "Fulfilled" });
      toast.success("Marked as fulfilled");
    } catch (err) {
      toast.error(err.message?.replace("Uncaught Error: ", ""));
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Remove this asset from room?')) {
      try {
        await removeItem({ token: sessionToken, id: item._id });
        toast.success('Asset removed');
      } catch (err) {
        toast.error(err.message?.replace("Uncaught Error: ", ""));
      }
    }
  };

  if (room === undefined || items === undefined || requests === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Accessing Room Records...</div>;
  if (!room) return <div className="p-8 text-center text-slate-500">Room not found</div>;

  const maintenanceCount = items.filter(i => i.condition === 'Maintenance' || i.condition === 'Broken').length;
  const activeRequests = requests.filter(r => r.status !== 'Fulfilled');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rooms')} className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-200">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{room.name}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                room.status === 'Ready' ? 'bg-success/10 text-success' :
                room.status === 'Occupied' ? 'bg-primary/10 text-primary' :
                room.status === 'Cleaning' ? 'bg-info/10 text-info' : 'bg-danger/10 text-danger'
              }`}>
                {room.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">{room.type} Accomodation</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsRequestModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <MessageSquare size={18} /> LOG REQUEST
          </button>
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> ADD ASSET
          </button>
        </div>
      </div>

      {/* Active Requests Board */}
      {activeRequests.length > 0 && (
        <div className="system-card bg-info/5 border border-info/20 p-6 animate-in zoom-in-95 duration-300">
          <h3 className="text-xs font-black uppercase tracking-widest text-info mb-4 flex items-center gap-2">
            <Clock size={16} /> Active Needs & Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRequests.map(req => (
              <div key={req._id} className="bg-white p-4 rounded-xl border border-info/10 shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-900">{req.item}</p>
                  <button 
                    onClick={() => markRequestFulfilled(req._id)}
                    className="p-1.5 bg-slate-50 hover:bg-success hover:text-white text-slate-400 rounded-lg transition-all"
                    title="Mark Fulfilled"
                  >
                    <Check size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>Qty: {req.quantity}</span> • 
                  <span className={req.priority === 'High' ? 'text-danger' : req.priority === 'Medium' ? 'text-warning' : 'text-slate-400'}>
                    {req.priority} Priority
                  </span>
                </div>
                {req.notes && <p className="text-xs text-slate-500 mb-2">{req.notes}</p>}
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Requested by {req.requestor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="system-card p-6 bg-white">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{items.length}</span>
            <span className="text-slate-400 text-sm mb-1">items tracked</span>
          </div>
        </div>
        <div className={`system-card p-6 border-l-4 ${maintenanceCount > 0 ? 'border-l-warning bg-warning/5' : 'border-l-success bg-success/5'}`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attention Required</p>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${maintenanceCount > 0 ? 'text-warning' : 'text-success'}`}>{maintenanceCount}</span>
            {maintenanceCount > 0 && <AlertTriangle size={24} className="text-warning animate-pulse" />}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="system-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Package size={14} /> Room Inventory List
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                    {item.notes && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.notes}</div>}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${
                      item.condition === 'Excellent' ? 'status-ok' : 
                      item.condition === 'Good' ? 'bg-slate-100 text-slate-500' : 
                      item.condition === 'Maintenance' ? 'status-low' : 'status-out'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-danger hover:bg-white rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">No assets assigned to this room yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Asset' : 'Add Room Asset'}
        footer={(
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Asset'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Item Name</label>
            <input 
              className="input-field"
              value={formData.itemName}
              onChange={e => setFormData({...formData, itemName: e.target.value})}
              placeholder="e.g. Mosquito Net, Bedside Lamp, Mirror"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Quantity</label>
              <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Condition</label>
              <select className="input-field" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Maintenance">Maintenance Required</option>
                <option value="Broken">Broken / Replace</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Asset Notes</label>
            <textarea 
              className="input-field h-[80px] py-3 items-start"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Any specific issues or details..."
            />
          </div>
        </div>
      </Modal>
      <Modal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)}
        title="Log Guest Request or Need"
        footer={(
          <>
            <button onClick={() => setIsRequestModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleRequestSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Logging...' : 'Submit Request'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Item Needed</label>
            <input 
              className="input-field"
              value={requestForm.item}
              onChange={e => setRequestForm({...requestForm, item: e.target.value})}
              placeholder="e.g. Extra Towels, Ironing Board"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Quantity</label>
              <input type="number" className="input-field" value={requestForm.quantity} onChange={e => setRequestForm({...requestForm, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Priority</label>
              <select className="input-field" value={requestForm.priority} onChange={e => setRequestForm({...requestForm, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High (Urgent)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Additional Notes</label>
            <textarea 
              className="input-field h-[80px] py-3 items-start"
              value={requestForm.notes}
              onChange={e => setRequestForm({...requestForm, notes: e.target.value})}
              placeholder="Guest mentioned they spilled coffee..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
