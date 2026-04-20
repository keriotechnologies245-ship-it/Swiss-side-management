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
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <h1>Settings & Security</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and team authorization.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="system-card p-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <ShieldCheck className="text-primary" size={24} />
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Your Profile</h3>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs-label text-slate-500 uppercase mb-2">Display Name</label>
                <input type="text" className="input-field bg-slate-50 border-slate-100" defaultValue={userEmail.split('@')[0]} readOnly />
              </div>
              <div>
                <label className="block text-xs-label text-slate-500 uppercase mb-2">Role权限</label>
                <input type="text" className="input-field bg-slate-50 border-slate-100 font-bold text-primary" value={userRole.replace('_', ' ')} readOnly />
              </div>
            </div>
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Authenticated Email</label>
              <input type="email" className="input-field bg-slate-50 border-slate-100" value={userEmail} readOnly />
            </div>
          </div>
        </div>

        {/* STAFF MANAGEMENT (Admin Only) */}
        {isAdmin && (
          <div className="system-card p-8 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Users className="text-primary" size={24} />
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Staff Account Management</h3>
            </div>
            
            {/* Add Staff Member */}
            <form onSubmit={handleCreateStaff} className="bg-slate-50 p-4 rounded-system border border-slate-100 mb-6 space-y-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Issue New Credentials</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="email" 
                      placeholder="Staff Email" 
                      className="input-field h-[40px] text-sm"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                    />
                    <input 
                      type="password" 
                      placeholder="Temp Password" 
                      className="input-field h-[40px] text-sm"
                      value={newStaffPass}
                      onChange={e => setNewStaffPass(e.target.value)}
                    />
                </div>
                <button 
                  type="submit" 
                  disabled={adding}
                  className="btn-primary w-full h-[40px] flex items-center justify-center gap-2 text-xs"
                >
                    <UserPlus size={16} /> {adding ? 'Creating...' : 'Register New Staff'}
                </button>
            </form>

            {/* List of Users */}
            <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Accounts</p>
                {allUsers === undefined ? (
                    <div className="p-4 text-center animate-pulse text-xs text-slate-400 font-mono">Loading user list...</div>
                ) : (
                    <div className="divide-y divide-slate-100 border rounded-system overflow-hidden">
                        {allUsers.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{user.email}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Role: {user.role}</p>
                                </div>
                                {user.role !== 'super_admin' && (
                                    <button 
                                      onClick={() => handleRemoveUser(user._id, user.email)}
                                      className="p-2 text-slate-300 hover:text-danger hover:bg-danger/10 rounded-md transition-all"
                                    >
                                        <Trash2 size={16} />
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
