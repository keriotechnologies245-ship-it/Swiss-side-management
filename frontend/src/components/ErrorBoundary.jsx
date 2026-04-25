import React from 'react';
import { AlertTriangle, RotateCcw, Wifi } from 'lucide-react';

// Errors that are transient (network, Convex sync) and should auto-recover
const RECOVERABLE_PATTERNS = [
  'ArgumentValidationError',
  'ConvexError',
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  'convex',
];

function isRecoverable(error) {
  if (!error) return false;
  const msg = (error.message || error.toString()).toLowerCase();
  return RECOVERABLE_PATTERNS.some((p) => msg.toLowerCase().includes(p.toLowerCase()));
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, recovering: false };
    this._recoveryTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Only log non-recoverable errors as errors; recoverable ones are warnings
    if (isRecoverable(error)) {
      console.warn('[ErrorBoundary] Transient error caught, auto-recovering:', error.message);
      // Auto-recover after 2 seconds for transient errors
      this._recoveryTimer = setTimeout(() => {
        this.setState({ hasError: false, error: null, recovering: false });
      }, 2000);
      this.setState({ recovering: true });
    } else {
      console.error('[ErrorBoundary] Unrecoverable error:', error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this._recoveryTimer) clearTimeout(this._recoveryTimer);
  }

  handleReboot = () => {
    window.location.reload();
  };

  handleReset = () => {
    if (this._recoveryTimer) clearTimeout(this._recoveryTimer);
    this.setState({ hasError: false, error: null, recovering: false });
  };

  render() {
    const { hasError, error, recovering } = this.state;

    if (!hasError) return this.props.children;

    // Transient / recoverable error — show a subtle banner, not a full crash
    if (recovering || isRecoverable(error)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 p-12 max-w-lg w-full text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <Wifi size={32} />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Reconnecting…
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                A temporary sync issue was detected. Recovering automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Try Now
              </button>
              <button
                onClick={this.handleReboot}
                className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    // True unrecoverable error — show full crash screen
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
              Error Code: {error?.message || 'Unknown Failure'}
            </div>
          </div>
          <button
            onClick={this.handleReboot}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <RotateCcw size={20} /> Reboot System
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
