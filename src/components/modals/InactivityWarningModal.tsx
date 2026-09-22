import React from 'react';
import { AlertTriangle, MousePointerClick, Square, Clock, ShieldAlert } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  maxWarningSeconds: number;
  onStayClockedIn: () => void;
  onClockOutNow: () => void;
  reasonText?: string;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  maxWarningSeconds,
  onStayClockedIn,
  onClockOutNow,
  reasonText
}) => {
  if (!isOpen) return null;

  const percentLeft = Math.max(0, Math.min(100, (secondsRemaining / maxWarningSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white border border-rose-200 p-6 sm:p-7 shadow-2xl space-y-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Accent Warning Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600" />

        {/* Pulsing Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-sm relative">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
          </span>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold tracking-wide uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Idle Cursor &amp; Inactivity Detected</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Are You Still There?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {reasonText || 'No cursor movement or keyboard activity has been detected. To maintain accurate enterprise attendance, you will be automatically clocked out soon.'}
          </p>
        </div>

        {/* Big Countdown Timer Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-50/80 to-slate-50 border border-rose-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-rose-500" /> Auto Clock-Out in:
            </span>
            <span className="font-mono text-xl font-black text-rose-600 animate-pulse">
              00:{String(secondsRemaining).padStart(2, '0')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                secondsRemaining <= 10 ? 'bg-rose-600' : 'bg-amber-500'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onStayClockedIn}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MousePointerClick className="w-4 h-4" />
            <span>I'm Working (Keep Clocked In)</span>
          </button>

          <button
            type="button"
            onClick={onClockOutNow}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Clock Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
