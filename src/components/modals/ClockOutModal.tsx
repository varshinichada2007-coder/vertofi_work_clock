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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
              <Square className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">End Your Workday?</h3>
              <p className="text-xs text-slate-400">Review today's total work hours and summary</p>
            </div>
          </div>
          <button
            onClick={() => setIsClockOutModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workday Summary Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-400" /> Clock In
            </span>
            <p className="text-sm font-bold text-white mt-1">{clockInTimeStr}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-400" /> Current Time
            </span>
            <p className="text-sm font-bold text-white mt-1">{currentTimeFormatted}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Timer className="w-3 h-3 text-blue-400" /> Total Duration
            </span>
            <p className="text-sm font-bold text-white mt-1">{formatSecondsToHM(totalElapsedSec)}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-400" /> Total Break Time
            </span>
            <p className="text-sm font-bold text-amber-400 mt-1">{formatSecondsToHM(totalBreakSec)}</p>
          </div>
        </div>

        {/* Net Working Time highlight */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Net Working Time</span>
          </div>
          <span className="font-mono text-2xl font-black text-emerald-400">{formatSecondsToHM(workSeconds)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Would you like to add a note about today's work?
            </label>
            <textarea
              rows={3}
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              placeholder="e.g. Wrapped up dashboard implementation, fixed responsive bugs..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsClockOutModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 flex items-center gap-2"
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
