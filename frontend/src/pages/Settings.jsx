import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';
import { UserPlus, Trash2, ShieldCheck, Users } from 'lucide-react';

export default function Settings() {
  const adminToken = localStorage.getItem('swiss_side_session') || '';
  const userEmail = localStorage.getItem('swiss_side_user') || 'Manager';
  const userRole = localStorage.getItem('swiss_side_role') || 'staff';
  const isAdmin = userRole === 'super_admin';

  // State for adding new staff
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [adding, setAdding] = useState(false);

  // Convex Hooks
  const allUsers = useQuery(api.users.listAllUsers, { adminToken });
  const createStaff = useMutation(api.users.createStaffAccount);
  const removeUser = useMutation(api.users.removeUser);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffPass) return toast.error("Please fill all fields");
    setAdding(true);
    try {
      await createStaff({ adminToken, newEmail: newStaffEmail, newPassword: newStaffPass });
      toast.success('Staff account created successfully!');
      setNewStaffEmail('');
      setNewStaffPass('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId, email) => {
    if (email === userEmail) return toast.error("You cannot remove yourself!");
    if (window.confirm(`Are you sure you want to remove access for ${email}?`)) {
      try {
        await removeUser({ adminToken, userId });
        toast.success('User access revoked.');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Configuration</h1>
          <p className="text-slate-500 font-medium">Manage user authorization and facility security protocols.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Profile Settings */}
        <div className="system-card bg-white p-10 shadow-premium border border-slate-50">
          <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Clearance</h3>
          </div>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs-label text-slate-400 uppercase mb-3">Operating As</label>
                <div className="input-field bg-slate-50 border-slate-100 flex items-center font-bold text-slate-900">
                  {userEmail.split('@')[0]}
                </div>
              </div>
              <div>
                <label className="block text-xs-label text-slate-400 uppercase mb-3">Access Level</label>
                <div className="input-field bg-slate-50 border-slate-100 flex items-center font-black text-primary uppercase tracking-widest">
                  {userRole.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs-label text-slate-400 uppercase mb-3">Authorized Email Address</label>
              <div className="input-field bg-slate-50 border-slate-100 flex items-center font-medium text-slate-600">
                {userEmail}
              </div>
            </div>
          </div>
        </div>

        {/* STAFF MANAGEMENT (Admin Only) */}
        {isAdmin && (
          <div className="system-card bg-white p-10 shadow-premium border border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Team Authorization</h3>
            </div>
            
            {/* Add Staff Member */}
            <form onSubmit={handleCreateStaff} className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 mb-10 space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Issue New Staff Access</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="email" 
                      placeholder="Corporate Email" 
                      className="input-field h-12 text-sm bg-white"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                    />
                    <input 
                      type="password" 
                      placeholder="Access Token" 
                      className="input-field h-12 text-sm bg-white"
                      value={newStaffPass}
                      onChange={e => setNewStaffPass(e.target.value)}
                    />
                </div>
                <button 
                  type="submit" 
                  disabled={adding}
                  className="btn-primary w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-premium"
                >
                    <UserPlus size={18} /> {adding ? 'Authorizing...' : 'Register Account'}
                </button>
            </form>

            {/* List of Users */}
            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Facility Access</p>
                {allUsers === undefined ? (
                    <div className="p-8 text-center animate-pulse text-[10px] text-slate-300 font-black uppercase tracking-widest">Synchronizing Accounts...</div>
                ) : (
                    <div className="divide-y divide-slate-50 border border-slate-50 rounded-[24px] overflow-hidden bg-white">
                        {allUsers.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                    {user.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900">{user.email}</p>
                                      <p className="text-[9px] uppercase font-black text-primary tracking-widest mt-0.5">{user.role}</p>
                                  </div>
                                </div>
                                {user.role !== 'super_admin' && (
                                    <button 
                                      onClick={() => handleRemoveUser(user._id, user.email)}
                                      className="p-3 text-slate-300 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
