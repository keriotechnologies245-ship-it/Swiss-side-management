import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-[600px] max-h-[90vh] rounded-modal shadow-modal flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <h2 className="text-[20px] font-bold text-slate-900">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-danger"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-6 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
