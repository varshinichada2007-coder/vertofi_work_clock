import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWorkClock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        let icon = <Info className="w-5 h-5 text-brand-400 shrink-0" />;
        let borderColor = 'border-brand-500/30';
        let bgGlow = 'bg-brand-500/10';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/40';
          bgGlow = 'bg-emerald-500/10';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/40';
          bgGlow = 'bg-amber-500/10';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/40';
          bgGlow = 'bg-rose-500/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-slate-900/95 border ${borderColor} ${bgGlow} shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white leading-snug">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
