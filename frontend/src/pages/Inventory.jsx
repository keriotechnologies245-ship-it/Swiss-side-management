import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

export default function Inventory() {
  // Convex Hooks
  const items = useQuery(api.items.getAll);
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
    if (!formData.name) {
      toast.error("Item name is required");
      return;
    }
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
        toast.success('Item updated successfully');
      } else {
        await createItem(payload);
        toast.success('New item added successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      try {
        await removeItem({ id: item._id });
        toast.success('Item removed from inventory');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  if (items === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Accessing Inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1>Inventory Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and edit your camp supplies stock.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary h-[48px] px-6 flex items-center gap-2"
          >
            <Plus size={20} /> ADD NEW ITEM
          </button>
        </div>
      </div>

      <div className="system-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100 text-[12px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Reorder Level</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                return (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-6 py-5 text-lg font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-6 py-5 text-slate-500">{item.unit}</td>
                    <td className="px-6 py-5 text-slate-400 font-mono text-sm">Min: {item.reorderLevel}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`status-badge ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}>
                        {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 hover:bg-info/10 text-info hover:text-info-dark transition-colors rounded-md"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 hover:bg-danger/10 text-danger hover:text-danger-dark transition-colors rounded-md"
                          title="Delete"
                        >
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

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        footer={(
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Item Name <span className="text-danger">*</span></label>
            <input 
              className="input-field"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Sugar, Flour, Rice"
              required
            />
          </div>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Unit of Measurement</label>
            <select 
              className="input-field"
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
            >
              <option value="kg">kg</option>
              <option value="liters">liters</option>
              <option value="pieces">pieces</option>
              <option value="grams">grams</option>
              <option value="bags">bags</option>
              <option value="boxes">boxes</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Current Stock</label>
              <input 
                type="number"
                className="input-field"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Reorder Level</label>
              <input 
                type="number"
                className="input-field"
                value={formData.reorderLevel}
                onChange={e => setFormData({...formData, reorderLevel: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">System will mark item as LOW when stock reaches this level.</p>
          <div>
            <label className="block text-xs-label text-slate-500 uppercase mb-2">Notes (Optional)</label>
            <textarea 
              className="input-field h-[80px] py-3 items-start"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional information about this item"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
