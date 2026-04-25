import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pencil, Trash2, Plus, Search, MinusCircle, PlusCircle, X, ChefHat, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

const sessionToken = () => localStorage.getItem('swiss_side_session') || '';
const currentUser = () => localStorage.getItem('swiss_side_user') || '';

// ── Inline action modal (Withdraw OR Restock) ────────────────────────────────
function ActionModal({ item, mode, onClose }) {
  const withdrawMutation = useMutation(api.transactions.withdraw);
  const restockMutation  = useMutation(api.transactions.restock);

  const [amount, setAmount]   = useState('');
  const [person, setPerson]   = useState(currentUser().split('@')[0] || '');
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const isWithdraw = mode === 'withdraw';
  const max        = isWithdraw ? item.quantity : undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) return toast.error('Enter a valid amount.');
    if (!person.trim())  return toast.error('Enter your name.');
    if (!reason.trim())  return toast.error('Enter a reason.');
    if (isWithdraw && qty > item.quantity)
      return toast.error(`Only ${item.quantity} ${item.unit} available.`);

    setLoading(true);
    try {
      const fn = isWithdraw ? withdrawMutation : restockMutation;
      await fn({
        token:    sessionToken(),
        itemId:   item._id,
        quantity: qty,
        person:   person.trim(),
        notes:    reason.trim(),
      });
      toast.success(isWithdraw ? `−${qty} ${item.unit} withdrawn` : `+${qty} ${item.unit} restocked`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isWithdraw ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {isWithdraw ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <p className="font-black text-slate-900 text-base">{isWithdraw ? 'Withdraw Stock' : 'Restock'}</p>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Current stock indicator */}
        <div className="mb-6 p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</span>
          <span className="font-black text-slate-900 font-mono">{item.quantity} {item.unit}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {isWithdraw ? 'Amount to withdraw' : 'Amount to add'} ({item.unit})
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              max={max}
              className="input-field font-mono text-xl font-black text-primary"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
            {isWithdraw && amount && parseFloat(amount) > 0 && (
              <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                Remaining after: <span className="font-black text-slate-700">{Math.max(0, item.quantity - parseFloat(amount))} {item.unit}</span>
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Cynthia"
              value={person}
              onChange={e => setPerson(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Reason {isWithdraw ? '(required)' : '(e.g. supplier delivery)'}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={isWithdraw ? 'e.g. Dinner service, Guest request...' : 'e.g. Weekly delivery from supplier'}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12 rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 h-12 rounded-xl font-black text-[11px] uppercase tracking-widest text-white transition-all disabled:opacity-60 ${
                isWithdraw ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'
              }`}
            >
              {loading ? 'Saving...' : isWithdraw ? 'Confirm Withdrawal' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation modal (must type item name) ──────────────────────────
function DeleteConfirmModal({ item, onClose, onConfirm }) {
  const [typed, setTyped] = useState('');
  const match = typed.trim().toLowerCase() === item.name.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="font-black text-slate-900 text-base">Delete Item</p>
            <p className="text-[11px] text-slate-400 font-bold">This cannot be undone</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          To confirm, type <span className="font-black text-slate-900">{item.name}</span> below:
        </p>
        <input
          type="text"
          className="input-field mb-5"
          placeholder={item.name}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 h-12 rounded-xl">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!match}
            className="flex-1 h-12 rounded-xl font-black text-[11px] uppercase tracking-widest text-white bg-danger hover:bg-danger/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemFormModal({ item, onClose }) {
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:         item?.name         || '',
    unit:         item?.unit         || 'kg',
    quantity:     item?.quantity     ?? '',
    reorderLevel: item?.reorderLevel ?? '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Item name is required.');
    const qty     = parseFloat(form.quantity);
    const reorder = parseFloat(form.reorderLevel);
    if (isNaN(qty) || qty < 0) return toast.error('Quantity must be a positive number.');
    setLoading(true);
    try {
      const payload = { name: form.name, unit: form.unit, quantity: qty, reorderLevel: isNaN(reorder) ? 0 : reorder };
      if (item) {
        await updateItem({ token: sessionToken(), id: item._id, ...payload });
        toast.success('Item updated.');
      } else {
        await createItem({ token: sessionToken(), ...payload });
        toast.success('Item added to stock.');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={item ? 'Edit Item' : 'Add Stock Item'}
      footer={
        <div className="flex gap-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
          <input className="input-field" placeholder="e.g. Arabica Coffee Beans" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
            <select className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="liters">liters</option>
              <option value="pieces">pieces</option>
              <option value="bags">bags</option>
              <option value="boxes">boxes</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Stock</label>
            <input type="number" step="any" min="0" className="input-field" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reorder Level (alert threshold)</label>
          <input type="number" step="any" min="0" className="input-field" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const items      = useQuery(api.items.getAll, { token: sessionToken() });
  const removeItem = useMutation(api.items.remove);

  const [search,      setSearch]      = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // item to delete

  const filtered = (items || []).filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeItem({ token: sessionToken(), id: deleteTarget._id });
      toast.success(`"${deleteTarget.name}" removed from inventory.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    }
  };

  if (items === undefined) return (
    <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse text-center">
      Scanning Kitchen Stores...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-3">
            <ChefHat className="text-primary" size={32} /> Kitchen Inventory
          </h1>
          <p className="text-slate-500 font-medium">Click Withdraw or Restock on any item to log a movement.</p>
        </div>
        <button
          onClick={() => setEditModal('new')}
          className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search items..."
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="system-card overflow-hidden bg-white shadow-premium border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Item</th>
                <th className="px-8 py-5">Current Stock</th>
                <th className="px-8 py-5">Reorder Level</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-300 font-bold uppercase tracking-[0.3em] text-xs">
                    No items found
                  </td>
                </tr>
              ) : filtered.map(item => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                return (
                  <tr key={item._id} className="group hover:bg-slate-50/30 transition-all">
                    {/* Name */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</p>
                        </div>
                      </div>
                    </td>

                    {/* Stock — clickable to restock */}
                    <td className="px-8 py-5">
                      <span className="font-mono text-lg font-black text-slate-800">
                        {item.quantity}
                        <span className="text-xs font-medium text-slate-400 ml-1">{item.unit}</span>
                      </span>
                    </td>

                    {/* Threshold */}
                    <td className="px-8 py-5 text-slate-400 font-bold text-sm">
                      {item.reorderLevel} <span className="text-[10px] uppercase">{item.unit}</span>
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5 text-center">
                      <span className={`status-badge ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}>
                        {isOut ? 'Depleted' : isLow ? 'Low Stock' : 'OK'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Withdraw */}
                        <button
                          onClick={() => setActionModal({ item, mode: 'withdraw' })}
                          disabled={item.quantity <= 0}
                          className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <MinusCircle size={14} /> Withdraw
                        </button>

                        {/* Restock */}
                        <button
                          onClick={() => setActionModal({ item, mode: 'restock' })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-success/10 text-success rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-success hover:text-white transition-all"
                        >
                          <PlusCircle size={14} /> Restock
                        </button>

                        {/* Edit / Delete (visible on hover) */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditModal(item)}
                            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-danger transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
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

      {/* Modals */}
      {actionModal && (
        <ActionModal
          item={actionModal.item}
          mode={actionModal.mode}
          onClose={() => setActionModal(null)}
        />
      )}
      {editModal && (
        <ItemFormModal
          item={editModal === 'new' ? null : editModal}
          onClose={() => setEditModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
