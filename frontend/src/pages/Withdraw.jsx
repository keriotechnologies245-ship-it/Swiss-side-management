import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';
import { ArrowLeft, Package, User, ClipboardList } from 'lucide-react';

export default function Withdraw() {
  const items = useQuery(api.items.getAll);
  const withdrawMutation = useMutation(api.transactions.withdraw);
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedId = location.state?.itemId;

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      itemId: preSelectedId || '',
      staffName: localStorage.getItem('swiss_side_user') || ''
    }
  });
  const selectedItemId = watch('itemId');

  const selectedItemObj = useMemo(() => {
    return items?.find(i => i._id === selectedItemId);
  }, [selectedItemId, items]);

  const onSubmit = async (data) => {
    try {
      await withdrawMutation({
        itemId: data.itemId,
        quantity: parseFloat(data.quantity),
        person: data.staffName,
        notes: data.notes || ''
      });
      // Fast, simple redirect
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (items === undefined) return <div className="p-12 font-mono text-slate-400 uppercase tracking-widest text-xs animate-pulse text-center">Opening Logistics Vault...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Withdrawal</h1>
          <p className="text-slate-500 font-medium">Log the removal of kitchen consumables.</p>
        </div>
      </div>

      <div className="system-card bg-white p-10 shadow-premium border border-slate-50">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Package size={14} /> Consumable Item
            </label>
            <select 
              {...register('itemId', { required: true })} 
              className="input-field h-14 bg-slate-50/50 font-bold text-slate-900"
            >
              <option value="" disabled>Select from available stock</option>
              {items.map(i => (
                <option key={i._id} value={i._id} disabled={i.quantity <= 0}>
                  {i.name} ({i.quantity} {i.unit} available)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Withdrawal Quantity</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  {...register('quantity', { required: true, valueAsNumber: true })} 
                  className="input-field h-14 font-mono text-xl font-black text-primary"
                  placeholder="0.0"
                />
                {selectedItemObj && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-50">
                    {selectedItemObj.unit}
                  </div>
                )}
              </div>
              {selectedItemObj && (
                <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  Currently in vault: {selectedItemObj.quantity} {selectedItemObj.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3 flex items-center gap-2">
                <User size={14} /> Personnel
              </label>
              <input 
                type="text" 
                {...register('staffName', { required: true })} 
                className="input-field h-14 bg-slate-50/50 font-bold uppercase tracking-widest"
                placeholder="STAFF NAME"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs-label text-slate-400 uppercase mb-3 flex items-center gap-2">
              <ClipboardList size={14} /> Usage Notes
            </label>
            <textarea 
              {...register('notes')} 
              className="input-field h-24 py-4 items-start"
              placeholder="Reason for withdrawal (e.g. Dinner Service, Guest Request)..."
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
            >
              Abort
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium"
            >
              Authorize Withdrawal
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
