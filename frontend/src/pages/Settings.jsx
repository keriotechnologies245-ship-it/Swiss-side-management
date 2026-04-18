import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    getUser();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1>System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and system preferences.</p>
      </div>

      <div className="max-w-2xl">
        {/* Profile Settings */}
        <div className="system-card p-6">
          <h3 className="text-base font-bold text-slate-800 mb-6 uppercase tracking-tight border-b pb-4">Profile Information</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs-label text-slate-500 uppercase mb-2">Display Name</label>
                <input type="text" className="input-field" defaultValue="Manager" />
              </div>
              <div>
                <label className="block text-xs-label text-slate-500 uppercase mb-2">Role</label>
                <input type="text" className="input-field bg-slate-50" defaultValue="System Administrator" readOnly />
              </div>
            </div>
            <div>
              <label className="block text-xs-label text-slate-500 uppercase mb-2">Email Address</label>
              <input type="email" className="input-field bg-slate-50 border-slate-100" value={userEmail} readOnly />
            </div>
            <div className="pt-4">
              <button type="submit" className="btn-primary">Save Profile Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
