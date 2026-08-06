import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const ToastContainer: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const bgStyle =
    type === 'success'
      ? 'bg-slate-900 border-emerald-500/50 text-white'
      : type === 'error'
      ? 'bg-rose-900 border-rose-500/50 text-white'
      : 'bg-slate-900 border-slate-700 text-white';

  const icon =
    type === 'success' ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    ) : type === 'error' ? (
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
    ) : (
      <Info className="w-5 h-5 text-teal-400 shrink-0" />
    );

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${bgStyle}`}>
        {icon}
        <p className="text-xs font-bold">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
