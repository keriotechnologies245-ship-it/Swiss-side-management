import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Wrench, AlertTriangle, CheckCircle2, History, Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

export default function GymMaintenance() {
  const items = useQuery(api.gymItems.getAll);
  const updateItem = useMutation(api.gymItems.update);
  const removeItem = useMutation(api.gymItems.remove);

  const maintenanceItems = items?.filter(i => i.condition === 'Maintenance' || i.condition === 'Broken') || [];
  const healthyItems = items?.filter(i => i.condition === 'Excellent' || i.condition === 'Good') || [];

  const handleUpdateStatus = async (item, newStatus) => {
    try {
      await updateItem({
        id: item._id,
        name: item.name,
        condition: newStatus,
        quantity: item.quantity,
        lastChecked: new Date().toISOString().split('T')[0],
        notes: item.notes
      });
      toast.success(`Updated ${item.name} to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (items === undefined) return <div className="p-8 font-mono text-slate-500 uppercase tracking-widest text-xs">Loading Maintenance Log...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="text-primary" /> Maintenance & Replacements
        </h1>
        <p className="text-slate-500 text-sm mt-1">Focus on equipment that requires service or immediate attention.</p>
      </div>

      {/* Maintenance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="system-card p-6 border-l-4 border-l-danger bg-danger/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attention Required</p>
              <h3 className="text-3xl font-bold text-slate-900">{maintenanceItems.length}</h3>
              <p className="text-xs text-slate-500 mt-1">Equipment pieces currently out of service or needing repair.</p>
            </div>
            <AlertTriangle className="text-danger" size={32} />
          </div>
        </div>
        <div className="system-card p-6 border-l-4 border-l-success bg-success/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Functional Gear</p>
              <h3 className="text-3xl font-bold text-slate-900">{healthyItems.length}</h3>
              <p className="text-xs text-slate-500 mt-1">Equipment in excellent or good condition ready for use.</p>
            </div>
            <CheckCircle2 className="text-success" size={32} />
          </div>
        </div>
      </div>

      {/* Critical Items Table */}
      <div className="system-card">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Critical Maintenance List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {maintenanceItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">All gym equipment is currently in good standing!</td>
                </tr>
              ) : (
                maintenanceItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${item.condition === 'Maintenance' ? 'status-low' : 'status-out'}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.notes || 'No specific issue noted.'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleUpdateStatus(item, 'Excellent')}
                        className="px-3 py-1.5 bg-success text-white text-[10px] font-bold uppercase rounded-md hover:bg-success-dark transition-all"
                      >
                        Mark as Repaired
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
