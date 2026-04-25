import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';
import { UserPlus, Trash2, ShieldCheck, Users, Lock, KeyRound, X, Eye, EyeOff, Pencil, Check } from 'lucide-react';

// ── Inline editable name field ───────────────────────────────────────────────
function EditableName({ currentName, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(currentName || '');

  const handleSave = async () => {
    await onSave(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="input-field flex-1 h-11 text-sm"
          placeholder="Your name (e.g. Roy)"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        />
        <button onClick={handleSave} className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
          <Check size={16} />
        </button>
        <button onClick={() => setEditing(false)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="input-field bg-slate-50 border-slate-100 flex items-center justify-between font-bold text-slate-900 cursor-pointer group hover:border-primary/30 transition-all" onClick={() => setEditing(true)}>
      <span>{value || <span className="text-slate-300 font-medium">Not set — click to add</span>}</span>
      <Pencil size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
    </div>
  );
}

// ── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, adminToken, onClose }) {
  const resetPassword = useMutation(api.users.adminResetPassword);
  const [newPass, setNewPass]       = useState('');
  const [confirmPass, setConfirm]   = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPass) return toast.error('Enter a new password.');
    if (newPass.length < 6) return toast.error('Password must be at least 6 characters.');
    if (newPass !== confirmPass) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await resetPassword({ adminToken, userId: user._id, newPassword: newPass });
      toast.success(`Password reset for ${user.displayName || user.email}. They must log in again.`);
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <KeyRound size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900">Reset Password</p>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="Min. 6 characters"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field"
              placeholder="Repeat password"
              value={confirmPass}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            ⚠️ The user will be logged out and must sign in with the new password.
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12 rounded-xl">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 h-12 rounded-xl">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────
export default function Settings() {
  const adminToken = localStorage.getItem('swiss_side_session') || '';
  const userEmail  = localStorage.getItem('swiss_side_user') || 'Manager';
  const userRole   = localStorage.getItem('swiss_side_role') || 'staff';
  const isAdmin    = userRole === 'super_admin';

  const [newStaffName,  setNewStaffName]  = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPass,  setNewStaffPass]  = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [resetTarget,   setResetTarget]   = useState(null);

  const allUsers    = useQuery(api.users.listAllUsers, isAdmin ? { adminToken } : "skip");
  const createStaff = useMutation(api.users.createStaffAccount);
  const removeUser  = useMutation(api.users.removeUser);
  const updateNameMutation = useMutation(api.users.updateDisplayName);

  const handleUpdateName = async (newName) => {
    try {
      await updateNameMutation({ token: adminToken, displayName: newName });
      localStorage.setItem('swiss_side_display_name', newName);
      toast.success('Display name updated. Refresh to see changes globally.');
    } catch (e) {
      toast.error(e.message || 'Failed to update name');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffPass) return toast.error("Email and password are required.");
    setAdding(true);
    try {
      await createStaff({
        adminToken,
        newEmail:     newStaffEmail,
        newPassword:  newStaffPass,
        displayName:  newStaffName.trim() || undefined,
      });
      toast.success('Staff account created!');
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPass('');
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId, label) => {
    if (label === userEmail) return toast.error("You cannot remove yourself!");
    if (window.confirm(`Remove access for ${label}?`)) {
      try {
        await removeUser({ adminToken, userId });
        toast.success('User access revoked.');
      } catch (err) {
        toast.error(err.message || 'Something went wrong.');
      }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Configuration</h1>
          <p className="text-slate-500 font-medium">Manage access, security and system health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">

        {/* Security Clearance card — everyone sees this */}
        <div className="system-card bg-white p-10 shadow-premium border border-slate-50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Clearance</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Operating As</label>
                <EditableName 
                  currentName={localStorage.getItem('swiss_side_display_name') || userEmail.split('@')[0]} 
                  onSave={handleUpdateName} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Access Level</label>
                <div className="input-field bg-slate-50 border-slate-100 flex items-center font-black text-primary uppercase tracking-widest">
                  {userRole.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Authorized Email</label>
              <div className="input-field bg-slate-50 border-slate-100 flex items-center font-medium text-slate-600">
                {userEmail}
              </div>
            </div>

            {/* Staff: show contact-admin message instead of a password form */}
            {!isAdmin && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <KeyRound size={20} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Need to change your password?</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Contact your administrator — they can reset it for you from the admin panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Admin Panel — user management */}
        {isAdmin ? (
          <div className="system-card bg-white p-10 shadow-premium border border-slate-50 relative overflow-hidden xl:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Team Authorization</h3>
            </div>

            {/* Add Staff Form */}
            <form onSubmit={handleCreateStaff} className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Register New Staff Access</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Display Name (e.g. Cynthia)"
                  className="input-field h-12 text-sm bg-white"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  autoComplete="off"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="input-field h-12 text-sm bg-white"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                  autoComplete="off"
                />
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Temporary Password"
                    className="input-field h-12 text-sm bg-white pr-12 w-full"
                    value={newStaffPass}
                    onChange={e => setNewStaffPass(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="btn-primary w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <UserPlus size={18} /> {adding ? 'Registering...' : 'Register Staff Account'}
              </button>
            </form>

            {/* User List */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Facility Access</p>
              {allUsers === undefined ? (
                <div className="p-8 text-center animate-pulse text-[10px] text-slate-300 font-black uppercase tracking-widest">
                  Synchronizing...
                </div>
              ) : (
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-[24px] overflow-hidden bg-white">
                  {allUsers.map(user => {
                    const label = user.displayName || user.email;
                    return (
                      <div key={user._id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                            {label.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{label}</p>
                            {user.displayName && (
                              <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                            )}
                            <p className="text-[9px] uppercase font-black text-primary tracking-widest mt-0.5">
                              {user.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Reset password */}
                          <button
                            onClick={() => setResetTarget(user)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                          >
                            <KeyRound size={13} /> Reset PW
                          </button>
                          {/* Remove — only for non-admins */}
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => handleRemoveUser(user._id, label)}
                              className="p-2.5 text-slate-300 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Staff view */
          <div className="system-card bg-white p-10 shadow-premium border border-slate-50 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <Lock size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Admin Access Required</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xs">
                User management is restricted to administrators.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          adminToken={adminToken}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
