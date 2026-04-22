import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Bed, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function RoomList() {
  const navigate = useNavigate();
  const rooms = useQuery(api.rooms.getAll);
  const createRoom = useMutation(api.rooms.create);
  const updateRoom = useMutation(api.rooms.update);
  const removeRoom = useMutation(api.rooms.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'Standard', 
    status: 'Ready', 
    notes: '' 
  });

  const handleOpenModal = (room = null) => {
    setEditingRoom(room);
    if (room) {
      setFormData({ 
        name: room.name, 
        type: room.type, 
        status: room.status, 
        notes: room.notes || '' 
      });
    } else {
      setFormData({ name: '', type: 'Standard', status: 'Ready', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Room name is required");
    setLoading(true);
    try {
      if (editingRoom) {
        await updateRoom({ id: editingRoom._id, ...formData });
        toast.success('Room updated');
      } else {
        await createRoom(formData);
        toast.success('Room created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (room) => {
    if (window.confirm('Are you sure? This will delete the room and all its inventory records.')) {
      try {
        await removeRoom({ id: room._id });
        toast.success('Room deleted');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  if (rooms === undefined) return <div className="text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Rooms...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track assets for each room in the camp.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> ADD NEW ROOM
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div key={room._id} className="system-card group hover:border-primary/50 transition-all cursor-pointer flex flex-col h-full" onClick={() => navigate(`/rooms/${room._id}`)}>
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${
                  room.status === 'Ready' ? 'bg-success/10 text-success' :
                  room.status === 'Occupied' ? 'bg-primary/10 text-primary' :
                  room.status === 'Cleaning' ? 'bg-info/10 text-info' : 'bg-danger/10 text-danger'
                }`}>
                  <Bed size={24} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  room.status === 'Ready' ? 'bg-success/10 text-success' :
                  room.status === 'Occupied' ? 'bg-primary/10 text-primary' :
                  room.status === 'Cleaning' ? 'bg-info/10 text-info' : 'bg-danger/10 text-danger'
                }`}>
                  {room.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">{room.type}</p>
              
              {room.notes && (
                <p className="text-xs text-slate-500 line-clamp-1 italic mb-2">"{room.notes}"</p>
              )}

              {room.needs && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Urgent Needs</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{room.needs}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(room); }}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-slate-200"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(room); }}
                  className="p-1.5 text-slate-400 hover:text-danger hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-slate-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room Registry' : 'Initialize Room Entry'}
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
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Room Name / Number</label>
            <input 
              className="input-field"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Safari Tent 01"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Room Type</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Family">Family Tent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Current Status</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Ready">Ready</option>
                <option value="Occupied">Occupied</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">What is Needed? (Service Requests)</label>
            <input 
              className="input-field"
              value={formData.needs || ''}
              onChange={e => setFormData({...formData, needs: e.target.value})}
              placeholder="e.g. Extra pillows, Lightbulb repair..."
            />
          </div>
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3">Administrative Notes</label>
            <textarea 
              className="input-field h-24 py-3 items-start"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Internal staff comments..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
