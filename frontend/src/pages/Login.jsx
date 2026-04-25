import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast, Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password Reset State
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isSystemEmpty = useQuery(api.users.isSystemEmpty);
  
  // AUTH ACTIONS
  const signInAction = useAction(api.actions.signIn);
  const initializeAction = useAction(api.actions.initializeSystem);
  const finalizeResetAction = useAction(api.actions.resetPasswordWithTokenAction);
  const dispatchReset = useAction(api.resend.dispatchSecureResetLink);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);

    try {
      if (isSystemEmpty) {
        const result = await initializeAction({ email, password });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("System initialized! Welcome, Administrator.");
        navigate('/dashboard');
      } else {
        const result = await signInAction({ email, password });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("Access granted. Welcome back!");
        navigate('/dashboard');
      }
    } catch (err) {
      const raw = err.message || '';
      if (raw.includes('locked')) {
        const lockMsg = raw.includes('15 minutes')
          ? 'Too many failed attempts. Account locked for 15 minutes.'
          : raw.replace('Account locked. Try again in ', 'Too many attempts. Try again in ');
        toast.error(lockMsg);
      } else {
        toast.error('Incorrect email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      await dispatchReset({ email });
      toast.success("Security token dispatched to your email (if you are an admin).");
      setView('reset');
    } catch (err) {
      if (err.message.includes("RATE_LIMIT")) {
        toast.error("Please wait 60 seconds before requesting another token.");
      } else {
        toast.error("Security system error. Please contact technical support.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetFinal = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return toast.error("Please fill in all fields.");
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    setLoading(true);
    try {
      await finalizeResetAction({ email, token: resetToken, newPassword });
      toast.success("Password secured! You can now log in.");
      setView('login');
      setPassword('');
      setResetToken('');
    } catch (err) {
      toast.error(err.message || "Invalid or expired token.");
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

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-600/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-[90px] h-[90px] bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-elevated border border-slate-100 ring-8 ring-white">
            <img src="/logo.png" alt="Swiss Side Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Swiss Side</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">
            {isSystemEmpty ? 'System Setup' : 'Executive Portal'}
          </p>
        </div>

        <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 p-10">
          
          {view === 'login' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isSystemEmpty ? 'Create Administrator' : 'Authorize Session'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {isSystemEmpty ? 'Set up the master admin account.' : 'Enter your credentials to continue.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Identifier</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="email" className="input-field pl-11" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Key</label>
                    {!isSystemEmpty && (
                      <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Forgot Key?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type={showPassword ? 'text' : 'password'} className="input-field pl-11 pr-12" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                  {loading ? 'Verifying...' : isSystemEmpty ? 'Initialize System' : 'Initialize Session'}
                </button>
              </form>
            </>
          )}

          {view === 'forgot' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setView('login')} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Key Recovery</h2>
                  <p className="text-xs text-slate-400 font-medium">Verify your admin identity.</p>
                </div>
              </div>
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registered Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="email" className="input-field pl-11" placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Processing...' : 'Send Recovery Token'}
                </button>
              </form>
            </>
          )}

          {view === 'reset' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Finalize Reset</h2>
                  <p className="text-xs text-slate-400 font-medium">Enter the 6-digit token sent to you.</p>
                </div>
              </div>
              <form onSubmit={handleResetFinal} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recovery Token</label>
                  <input type="text" className="input-field text-center text-2xl font-black tracking-[0.5em] h-16" placeholder="000000" maxLength={6} value={resetToken} onChange={e => setResetToken(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Security Key</label>
                  <input type="password" className="input-field" placeholder="Min. 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Finalizing...' : 'Update Security Key'}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Cancel</button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-slate-300">
          {['SSL Secure', 'Bcrypt Hashed', 'Server Managed'].map((text, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span className="text-[9px] font-black uppercase tracking-widest">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
