import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete Permanently", loading = false }) {
  const [typedConfirm, setTypedConfirm] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={(
        <div className="flex gap-4 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">Abort</button>
          <button 
            onClick={() => {
              onConfirm();
              setTypedConfirm('');
            }} 
            disabled={loading || typedConfirm.toUpperCase() !== 'DELETE'} 
            className="btn-primary bg-danger hover:bg-danger-dark border-danger flex-1 disabled:opacity-40"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      )}
    >
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-danger">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <p className="text-slate-600 font-medium">{message}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type <span className="text-danger">DELETE</span> below to authorize this action.</p>
        </div>
        <input 
          type="text" 
          className="input-field text-center font-black tracking-widest border-danger/20 focus:ring-danger/10" 
          placeholder="UNAUTHORIZED" 
          value={typedConfirm}
          onChange={e => setTypedConfirm(e.target.value)}
        />
      </div>
    </Modal>
  );
}
