import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast, Toaster } from 'react-hot-toast';
import { motion, useAnimation } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('signIn'); // 'signIn', 'forgot_request', 'forgot_reset', 'otp'
  const [loading, setLoading] = useState(false);
  
  const isSystemEmpty = useQuery(api.users.isSystemEmpty);
  const signInMutation = useMutation(api.users.signIn);
  const initializeRootOwnership = useMutation(api.users.initializeRootOwnership);
  const requestResetMutation = useMutation(api.users.requestPasswordReset);
  const resetPasswordMutation = useMutation(api.users.resetPasswordWithToken);
  const verifyOtp = useMutation(api.users.verifyOtp);
  const sendOtpEmail = useAction(api.resend.sendOtpEmail);
  const dispatchSecureResetLink = useAction(api.resend.dispatchSecureResetLink);
  
  const navigate = useNavigate();
  const controls = useAnimation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSystemEmpty) {
        const result = await initializeRootOwnership({ email, password });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("Identity Vault Initialized");
        navigate('/dashboard');
      } else if (mode === 'forgot_request') {
        const result = await requestResetMutation({ email });
        if (result.token) {
          toast.loading("Sending Recovery Token...", { id: "reset-loading" });
          await dispatchSecureResetLink({ email, token: result.token });
          toast.success("Security Token Sent to Email", { id: "reset-loading" });
          setMode('forgot_reset');
        } else {
          toast.success("If account exists, recovery token sent.", { id: "reset-loading" });
        }
      } else if (mode === 'forgot_reset') {
        await resetPasswordMutation({ email, token: resetToken, newPassword });
        toast.success("Password Updated Securely");
        setMode('signIn');
      } else if (mode === 'otp') {
        const result = await verifyOtp({ email, code: otp });
        localStorage.setItem('swiss_side_session', result.token);
        localStorage.setItem('swiss_side_user', result.email);
        localStorage.setItem('swiss_side_role', result.role);
        toast.success("Access Granted");
        navigate('/dashboard');
      } else {
        const result = await signInMutation({ email, password });
        if (result.requiresOtp) {
          toast.loading("Sending Access Code...", { id: "otp-loading" });
          await sendOtpEmail({ email });
          toast.success("Check email for access code", { id: "otp-loading" });
          setMode('otp');
        }
      }
    } catch (err) {
      toast.error(err.message || "Access Denied");
      controls.start({ x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } });
    } finally {
      setLoading(false);
    }
  };

  if (isSystemEmpty === undefined) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans selection:bg-primary/20">
      <Toaster position="top-right" />
      
      {/* Background Decorative Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-gold/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-[100px] h-[100px] bg-white rounded-3xl mx-auto mb-8 flex items-center justify-center overflow-hidden shadow-elevated border border-slate-100 ring-8 ring-white">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Swiss Side</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Executive Portal</p>
        </div>

        <motion.div animate={controls} className="bg-white rounded-[32px] shadow-elevated p-10 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary"></div>
          
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {isSystemEmpty ? "Initialize Root System" : 
               mode.startsWith('forgot') ? "Emergency Access Recovery" :
               mode === 'otp' ? "Dual-Factor Verification" : "Authorize Session"}
            </h2>
            <p className="text-xs font-medium text-slate-400">
              {mode === 'signIn' ? "Enter your credentials to access the lodge manager." : "Security protocols active. Please follow the instructions."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode !== 'otp' && mode !== 'forgot_reset' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Identifier</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none" 
                    placeholder="manager@theswissside.com" 
                    required 
                    autoFocus 
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>
            )}

            {mode === 'signIn' || isSystemEmpty ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none" 
                    placeholder="••••••••" 
                    required 
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-all">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ) : null}

            {mode === 'otp' && (
              <div className="space-y-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Verify Identity</p>
                  <p className="text-sm font-mono text-slate-700 font-bold">{email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">6-Digit Access Code</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 text-center text-2xl font-black tracking-[0.8em] font-mono focus:bg-white transition-all outline-none" 
                    placeholder="000000" 
                    required 
                    autoFocus 
                  />
                </div>
                <button type="button" onClick={() => setMode('signIn')} className="w-full text-[10px] text-slate-400 hover:text-primary font-black uppercase tracking-widest">Abort & Retry</button>
              </div>
            )}

            {mode === 'forgot_reset' && (
              <div className="space-y-6">
                <div className="p-5 bg-danger/5 rounded-2xl border border-danger/10 text-center">
                  <ShieldAlert className="mx-auto text-danger mb-2" size={24} />
                  <p className="text-[10px] text-danger font-black uppercase tracking-widest">Authorization Protocol</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Token</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={resetToken} 
                    onChange={e => setResetToken(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 text-center text-xl font-mono tracking-[0.5em] focus:bg-white transition-all outline-none" 
                    placeholder="000000" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Define New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none" placeholder="••••••••" required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all">
               {loading ? 'Processing Identity...' : 
                isSystemEmpty ? 'Setup Root Identity' : 
                mode === 'otp' ? 'Finalize Verification' :
                mode === 'forgot_request' ? 'Request Recovery Token' :
                mode === 'forgot_reset' ? 'Authorize Update' : 'Initialize Session'}
            </button>

            {!isSystemEmpty && mode === 'signIn' && (
              <button type="button" onClick={() => setMode('forgot_request')} className="w-full text-center text-[10px] text-slate-400 hover:text-primary uppercase tracking-[0.2em] font-black transition-colors">
                Lost access credentials?
              </button>
            )}

            {!isSystemEmpty && mode.startsWith('forgot') && (
              <button type="button" onClick={() => setMode('signIn')} className="w-full text-center text-[10px] text-slate-400 hover:text-primary uppercase tracking-[0.2em] font-black transition-colors">
                Return to Login
              </button>
            )}
          </form>
        </motion.div>

        <div className="mt-12 flex items-center justify-center gap-3 opacity-40 hover:opacity-100 transition-all cursor-help grayscale hover:grayscale-0">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(163,94,69,0.5)]"></div>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.1em]">Encrypted Session • AES-256 Protocol</p>
        </div>
      </div>
    </div>
  );
}
