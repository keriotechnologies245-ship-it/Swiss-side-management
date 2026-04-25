import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChefHat, Dumbbell, Bed, Package, Clock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const sessionToken = localStorage.getItem('swiss_side_session') || "";

  // Department Data
  const kitchenItems    = useQuery(api.items.getAll, { token: sessionToken });
  const gymItems        = useQuery(api.gymItems.getAll, { token: sessionToken });
  const rooms           = useQuery(api.rooms.getAll, { token: sessionToken });
  const generalSupplies = useQuery(api.generalSupplies.getAll, { token: sessionToken });

  const stats = useMemo(() => {
    if (!kitchenItems || !gymItems || !rooms || !generalSupplies) return null;

    return {
      kitchen: {
        total: kitchenItems.length,
        lowStock: kitchenItems.filter(i => i.quantity <= i.reorderLevel).length,
      },
      gym: {
        total: gymItems.length,
        maintenance: gymItems.filter(i => i.condition === 'Maintenance' || i.condition === 'Broken').length,
      },
      rooms: {
        total: rooms.length,
        ready: rooms.filter(r => r.status === 'Ready').length,
        maintenance: rooms.filter(r => r.status === 'Maintenance').length,
      },
      supplies: {
        total: generalSupplies.length,
        lowStock: generalSupplies.filter(s => s.quantity <= s.reorderLevel).length,
      }
    };
  }, [kitchenItems, gymItems, rooms, generalSupplies]);

  if (!stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
        Accessing Intelligence Core...
      </div>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">Swiss Side Iten</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Operational Overview Dashboard. Real-time departmental metrics and facility readiness.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-premium border border-slate-50">
          <Clock className="text-primary" size={20} />
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Health</p>
            <p className="text-sm font-bold text-slate-900 leading-none">Operational • Live Data</p>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Kitchen Items', value: stats.kitchen.total, icon: ChefHat, color: 'text-primary bg-primary/5' },
          { label: 'Gym Assets', value: stats.gym.total, icon: Dumbbell, color: 'text-slate-700 bg-slate-50' },
          { label: 'Rooms Tracked', value: stats.rooms.total, icon: Bed, color: 'text-accent-gold bg-accent-gold/5' },
          { label: 'General Supplies', value: stats.supplies.total, icon: Package, color: 'text-slate-500 bg-slate-50' },
        ].map((card, i) => (
          <div key={i} className="system-card p-6 bg-white border border-slate-50 flex items-center justify-between hover:scale-[1.02] transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
            </div>
            <div className={`p-4 rounded-2xl ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
        {[
          { title: 'Kitchen', path: '/inventory', icon: ChefHat },
          { title: 'Gym', path: '/gym-inventory', icon: Dumbbell },
          { title: 'Rooms', path: '/rooms', icon: Bed },
          { title: 'Supplies', path: '/general-supplies', icon: Package },
        ].map((hub, i) => (
          <button 
            key={i}
            onClick={() => navigate(hub.path)}
            className="group flex flex-col items-center p-8 bg-white border border-slate-100 rounded-[32px] hover:border-primary transition-all shadow-sm hover:shadow-premium"
          >
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all mb-4">
              <hub.icon size={24} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{hub.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
