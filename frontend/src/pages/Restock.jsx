import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { fetchItems, addStock } from '../api';

export default function Restock() {
  const [items, setItems] = useState([]);
  const [selectedItemObj, setSelectedItemObj] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, watch } = useForm();
  const selectedItemId = watch('itemId');

  useEffect(() => {
    fetchItems().then(res => setItems(res.data || [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      setSelectedItemObj(items.find(i => i.id.toString() === selectedItemId));
    } else {
      setSelectedItemObj(null);
    }
  }, [selectedItemId, items]);

  const onSubmit = async (data) => {
    try {
      await addStock({
        itemId: parseInt(data.itemId),
        quantity: parseFloat(data.quantity),
        source: data.source || '',
        notes: data.notes || ''
      });
      // Fast, simple redirect
      navigate('/dashboard');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

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
              <option value="" disabled>[Select item ▼]</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
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
