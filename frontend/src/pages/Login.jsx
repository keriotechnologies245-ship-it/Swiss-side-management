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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-100 to-white font-sans">
      <Toaster position="top-right" />
      
      <div className="text-center mb-8">
        <div className="w-[96px] h-[96px] bg-white rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-primary shadow-lg ring-4 ring-primary/20">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-slate-900 uppercase tracking-widest text-base font-black">The Swiss Side</h1>
        <p className="text-slate-500 text-[9px] font-bold uppercase mt-1 tracking-widest opacity-80">
          {isSystemEmpty ? "System Root Ownership" : 
           mode.startsWith('forgot') ? "Emergency Recover Flow" :
           mode === 'otp' ? "Two-Factor Verification" : "Authenticated Workspace"}
        </p>
      </div>

      <motion.div animate={controls} className="w-full max-w-[380px] bg-white rounded-system shadow-system p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode !== 'otp' && mode !== 'forgot_reset' && (
              <div>
                <label className="label-text">Email</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="admin@theswissside.com" required autoFocus />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                </div>
              </div>
            )}

            {mode === 'signIn' || isSystemEmpty ? (
              <div className="relative">
                <label className="label-text">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-12" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ) : null}

            {mode === 'otp' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-md border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Enter Code Sent to</p>
                  <p className="text-xs font-mono text-slate-700 font-bold">{email}</p>
                </div>
                <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="input-field font-mono tracking-[1em] text-center text-lg" placeholder="000000" required autoFocus />
                <button type="button" onClick={() => setMode('signIn')} className="w-full text-[10px] text-slate-400 hover:text-primary font-bold uppercase">Back to Password</button>
              </div>
            )}

            {mode === 'forgot_reset' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-md border border-red-100 text-center">
                  <ShieldAlert className="mx-auto text-red-500 mb-2" size={20} />
                  <p className="text-[10px] text-red-800 font-bold uppercase tracking-widest">Reset Protocol</p>
                </div>
                <div>
                  <label className="label-text">6-Digit Security Token (from email)</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={resetToken} 
                    onChange={e => setResetToken(e.target.value)} 
                    className="input-field font-mono tracking-[1em] text-center text-lg" 
                    placeholder="000000" 
                    required 
                  />
                </div>
                <div>
                  <label className="label-text">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full uppercase tracking-wider text-[11px] h-[48px] flex items-center justify-center gap-2 font-black">
               {loading ? 'Processing...' : 
                isSystemEmpty ? 'Root System Setup' : 
                mode === 'otp' ? 'Complete Verification' :
                mode === 'forgot_request' ? 'Request Reset Token' :
                mode === 'forgot_reset' ? 'Finalize Password Change' : 'Unlock Workspace'}
            </button>

            {!isSystemEmpty && mode === 'signIn' && (
              <button type="button" onClick={() => setMode('forgot_request')} className="w-full text-center text-[10px] text-slate-400 hover:text-primary uppercase tracking-widest font-bold transition-colors">
                Forgot Password?
              </button>
            )}

            {!isSystemEmpty && mode.startsWith('forgot') && (
              <button type="button" onClick={() => setMode('signIn')} className="w-full text-center text-[10px] text-slate-400 hover:text-primary uppercase tracking-widest font-bold transition-colors">
                Back to Login
              </button>
            )}
          </form>
      </motion.div>

      <div className="mt-8 flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
        <p className="text-[10px] font-mono uppercase text-slate-500 tracking-tighter">Bcrypt Encryption Active | Token Recovery Enabled</p>
      </div>
    </div>
  );
}
