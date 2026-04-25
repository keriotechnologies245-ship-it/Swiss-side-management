import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast, Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSystemEmpty = useQuery(api.users.isSystemEmpty);
  const signInMutation = useMutation(api.users.signIn);
  const initializeRootOwnership = useMutation(api.users.initializeRootOwnership);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);

    try {
      if (isSystemEmpty) {
        // First-time setup
        const result = await initializeRootOwnership({ email, password });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("System initialized! Welcome, Administrator.");
        navigate('/dashboard');
      } else {
        // Normal login — email + password, no OTP
        const result = await signInMutation({ email, password });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("Access granted. Welcome back!");
        navigate('/dashboard');
      }
    } catch (err) {
      const raw = err.message || '';
      if (raw.includes('locked')) {
        // Extract the readable part of lockout messages
        const lockMsg = raw.includes('15 minutes')
          ? 'Too many failed attempts. Account locked for 15 minutes.'
          : raw.replace('Account locked. Try again in ', 'Too many attempts. Try again in ');
        toast.error(lockMsg);
      } else {
        // For all credential failures, show a clean generic message
        toast.error('Incorrect email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSystemEmpty === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <Toaster position="top-right" />

      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-600/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo + Brand */}
        <div className="text-center mb-10">
          <div className="w-[90px] h-[90px] bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-elevated border border-slate-100 ring-8 ring-white">
            <img src="/logo.png" alt="Swiss Side Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Swiss Side</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">
            {isSystemEmpty ? 'System Setup' : 'Executive Portal'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isSystemEmpty ? 'Create Administrator' : 'Authorize Session'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isSystemEmpty
                  ? 'Set up the master admin account.'
                  : 'Enter your credentials to access the lodge manager.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Email Identifier
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="off"
                  className="input-field pl-11"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Security Key
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input-field pl-11 pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Verifying...'
                : isSystemEmpty
                  ? 'Initialize System'
                  : 'Initialize Session'}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <span className="text-[9px] font-black uppercase tracking-widest">SSL Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <span className="text-[9px] font-black uppercase tracking-widest">Bcrypt Hashed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <span className="text-[9px] font-black uppercase tracking-widest">Server Managed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
