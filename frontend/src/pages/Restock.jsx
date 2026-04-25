import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';

export default function Restock() {
  const sessionToken = localStorage.getItem('swiss_side_session') || '';
  const items = useQuery(api.items.getAll, { token: sessionToken });
  const restockMutation = useMutation(api.transactions.restock);
  const navigate = useNavigate();

  const { register, handleSubmit, watch } = useForm();
  const selectedItemId = watch('itemId');

  const selectedItemObj = useMemo(() => {
    return items?.find(i => i._id === selectedItemId);
  }, [selectedItemId, items]);

  const onSubmit = async (data) => {
    try {
      await restockMutation({
        token: sessionToken,
        itemId: data.itemId,
        quantity: parseFloat(data.quantity),
        person: data.source || localStorage.getItem('swiss_side_user') || 'Manager',
        notes: data.notes || ''
      });
      // Fast, simple redirect
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message?.replace("Uncaught Error: ", ""));
    }
  };

  if (items === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Accessing Inventory...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="system-card bg-white p-5 border-l-4 border-l-success">
        <h1 className="text-lg font-bold text-success uppercase tracking-wide">ADD STOCK (RESTOCKING)</h1>
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
                <option key={i._id} value={i._id}>
                  {i.name} (Current: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity to add</label>
            <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  {...register('quantity', { required: true, valueAsNumber: true })} 
                  className="input-field font-mono text-lg border-success focus:ring-success focus:border-success"
                  autoComplete="off"
                />
                {selectedItemObj && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase pointer-events-none">
                    {selectedItemObj.unit}
                  </div>
                )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Source (optional)</label>
            <input 
              type="text" 
              {...register('source')} 
              className="input-field uppercase"
              placeholder="e.g. Nakumatt Wholesale"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Notes</label>
            <input 
              type="text" 
              {...register('notes')} 
              className="input-field"
              placeholder="e.g. Invoice #4521"
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
              className="btn-primary flex-1 bg-success hover:bg-success/90 uppercase tracking-widest text-xs font-bold shadow-none"
            >
              ADD STOCK
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
