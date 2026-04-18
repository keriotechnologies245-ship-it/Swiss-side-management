import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-100 to-white">
      
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <div className="w-[124px] h-[124px] bg-white rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-primary shadow-lg ring-4 ring-primary/20">
            <img src="/logo.png" alt="Swiss Side Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-slate-900 uppercase tracking-widest text-lg font-bold">The Swiss Side Training Camp</h1>
        <p className="text-slate-500 text-sm mt-1">Stock Management System</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-white rounded-system shadow-system p-10 border border-slate-200">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-bold uppercase tracking-tight text-[11px]">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="name@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 font-bold uppercase tracking-tight text-[11px]">Security Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
            {error && <p className="text-danger text-xs font-bold mt-2 text-center uppercase tracking-tight">{error}</p>}
          </div>
          
          <button type="submit" className="btn-primary w-full uppercase tracking-wider text-xs">
            LOGIN
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs-label text-slate-400 uppercase">Powered by Connex Technologies</p>
        <p className="text-[10px] text-slate-300 font-mono mt-1">v1.0</p>
      </div>
    </div>
  );
}
