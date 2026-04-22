import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ChefHat, 
  Dumbbell, 
  Bed, 
  Package,
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Clock,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Department Data
  const kitchenItems = useQuery(api.items.getAll);
  const gymItems = useQuery(api.gymItems.getAll);
  const rooms = useQuery(api.rooms.getAll);
  const generalSupplies = useQuery(api.generalSupplies.getAll);
  const kitchenHistory = useQuery(api.transactions.getHistory);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Alerts & Notifications */}
        <div className="system-card p-10 bg-white">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
            <AlertCircle size={20} className="text-danger" /> Alerts & Notifications
          </h3>
          <div className="space-y-4">
            {stats.kitchen.lowStock > 0 && (
              <div className="flex items-center gap-4 p-4 bg-danger/5 border border-danger/10 rounded-2xl">
                <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Kitchen: {stats.kitchen.lowStock} Items Low Stock</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Restock Required</p>
                </div>
              </div>
            )}
            {stats.gym.maintenance > 0 && (
              <div className="flex items-center gap-4 p-4 bg-warning/5 border border-warning/10 rounded-2xl">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Gym: {stats.gym.maintenance} Equipment Issues</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance Action Pending</p>
                </div>
              </div>
            )}
            {stats.rooms.maintenance > 0 && (
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Rooms: {stats.rooms.maintenance} Units Under Repair</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lodge Capacity Reduced</p>
                </div>
              </div>
            )}
            {stats.kitchen.lowStock === 0 && stats.gym.maintenance === 0 && stats.rooms.maintenance === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <CheckCircle2 size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">All Systems Optimal</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="system-card p-10 bg-white">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
            <Clock size={20} className="text-primary" /> Recent Intelligence
          </h3>
          <div className="space-y-6">
            {kitchenHistory?.slice(0, 5).map((h) => (
              <div key={h._id} className="flex items-center justify-between pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${h.type === 'RESTOCK' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    <Info size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{h.itemName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{h.type} • {h.person}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${h.type === 'RESTOCK' ? 'text-success' : 'text-danger'}`}>
                    {h.type === 'RESTOCK' ? '+' : '-'}{h.quantity} {h.unit}
                  </p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase">{new Date(h._creationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
