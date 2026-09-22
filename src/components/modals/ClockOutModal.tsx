import React, { useState } from 'react';
import { X, Square, Clock, Coffee, Timer, Zap } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';
import { formatSecondsToHM } from '../../services/exportUtils';

export const ClockOutModal: React.FC = () => {
  const {
    isClockOutModalOpen,
    setIsClockOutModalOpen,
    clockOut,
    clockState,
    workSeconds,
    breakSeconds,
    currentTimeFormatted
  } = useWorkClock();

  const [endNotes, setEndNotes] = useState('');

  if (!isClockOutModalOpen) return null;

  const clockInTimeStr = clockState.clockInTimestamp
    ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '---';

  const totalBreakSec = clockState.accumulatedBreakSeconds + breakSeconds;
  const totalElapsedSec = workSeconds + totalBreakSec;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clockOut(endNotes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <Square className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">End Your Workday?</h3>
              <p className="text-xs text-slate-500">Review today's total work hours and summary</p>
            </div>
          </div>
          <button
            onClick={() => setIsClockOutModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workday Summary Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-600" /> Clock In
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{clockInTimeStr}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-600" /> Current Time
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{currentTimeFormatted}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Timer className="w-3 h-3 text-blue-600" /> Total Duration
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{formatSecondsToHM(totalElapsedSec)}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-600" /> Total Break Time
            </span>
            <p className="text-sm font-bold text-amber-700 mt-1">{formatSecondsToHM(totalBreakSec)}</p>
          </div>
        </div>

        {/* Net Working Time highlight */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Net Working Time</span>
          </div>
          <span className="font-mono text-2xl font-black text-emerald-700">{formatSecondsToHM(workSeconds)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Would you like to add a note about today's work?
            </label>
            <textarea
              rows={3}
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              placeholder="e.g. Wrapped up dashboard implementation, fixed responsive bugs..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsClockOutModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>CLOCK OUT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
