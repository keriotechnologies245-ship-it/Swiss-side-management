import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full system-card p-10 text-center shadow-xl border-t-4 border-t-danger">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">System Recovery</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              The Swiss Side terminal encountered an unexpected state. All data remains safe in the vault.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-primary w-full py-4 text-sm font-bold tracking-widest"
            >
              REBOOT SYSTEM
            </button>
            <p className="mt-6 text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
              Error Code: {this.state.error?.message || 'NULL_PTR_EXCEPTION'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
