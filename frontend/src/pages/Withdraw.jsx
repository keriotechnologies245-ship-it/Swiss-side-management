import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';

export default function Withdraw() {
  const items = useQuery(api.items.getAll);
  const withdrawMutation = useMutation(api.transactions.withdraw);
  const navigate = useNavigate();

  const { register, handleSubmit, watch } = useForm();
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

  if (items === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Accessing Inventory...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="system-card bg-white p-5 border-l-4 border-l-slate-800">
        <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wide">LOG WITHDRAWAL</h1>
      </div>

      <div className="system-card bg-white p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item</label>
            <select 
              {...register('itemId', { required: true })} 
              className="input-field bg-slate-50 font-bold"
              defaultValue=""
            >
              <option value="" disabled>[Select item]</option>
              {items.map(i => (
                <option key={i._id} value={i._id} disabled={i.quantity <= 0}>
                  {i.name} (Stock: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity</label>
            <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  {...register('quantity', { required: true, valueAsNumber: true })} 
                  className="input-field font-mono text-lg"
                  autoComplete="off"
                />
                {selectedItemObj && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase pointer-events-none">
                    {selectedItemObj.unit}
                  </div>
                )}
            </div>
            {selectedItemObj && selectedItemObj.quantity !== undefined && (
                <p className="text-xs text-slate-500 font-mono mt-2">
                    Current stock: {selectedItemObj.quantity} {selectedItemObj.unit}
                </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Who took it</label>
            <input 
              type="text" 
              {...register('staffName', { required: true })} 
              className="input-field uppercase"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Notes (optional)</label>
            <input 
              type="text" 
              {...register('notes')} 
              className="input-field"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex-1 uppercase tracking-widest text-xs font-bold"
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 bg-slate-800 hover:bg-slate-700 uppercase tracking-widest text-xs font-bold border-l-4 border-l-primary"
            >
              SAVE RECORD
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
