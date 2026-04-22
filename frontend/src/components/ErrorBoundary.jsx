import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
          <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 p-12 max-w-lg w-full text-center space-y-8">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto text-danger animate-bounce">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Recovery</h1>
              <p className="text-slate-500 font-medium">
                The Swiss Side terminal encountered an unexpected state. 
                All data remains safe in the vault.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-mono text-slate-400 uppercase break-all">
                Error Code: {this.state.error?.message || 'Unknown Failure'}
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              <RotateCcw size={20} /> Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
