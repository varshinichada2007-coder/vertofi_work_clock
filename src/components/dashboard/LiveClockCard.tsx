import React from 'react';
import { Clock, Play, Coffee, Square, CheckCircle2, AlertCircle, Timer, ShieldAlert } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';
import { formatSecondsToHMS, formatSecondsToHM } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

export const LiveClockCard: React.FC = () => {
  const { user } = useAuth();
  const {
    currentTimeFormatted,
    clockState,
    workSeconds,
    breakSeconds,
    breakUsedSeconds,
    breakRemainingSeconds,
    setIsClockInModalOpen,
    setIsStartBreakModalOpen,
    endBreak,
    setIsClockOutModalOpen
  } = useWorkClock();

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Admin does not use employee clock controls
  if (isManagerOrAdmin) {
    return null;
  }

  // Status Badge UI
  const renderStatusBadge = () => {
    switch (clockState.status) {
      case 'WORKING':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            🟢 WORKING
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            🟡 ON BREAK ({clockState.currentBreakType || 'Break'})
          </span>
        );
      case 'CLOCKED_OUT':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            🔴 CLOCKED OUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            ⚪ NOT CLOCKED IN
          </span>
        );
    }
  };

  const clockInTimeStr = clockState.clockInTimestamp
    ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '---';

  const breakStartTimeStr = clockState.currentBreakStartTimestamp
    ? new Date(clockState.currentBreakStartTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '---';

  const breakUsedMins = Math.floor(breakUsedSeconds / 60);
  const breakRemainingMins = Math.floor(breakRemainingSeconds / 60);

  return (
    <div className="space-y-4">
      {/* 9-HOUR WORKDAY RULE BANNER */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center glass-card">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Workday</span>
          <span className="text-sm font-extrabold text-white font-mono">09h 00m</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Productive Work</span>
          <span className="text-sm font-extrabold text-brand-400 font-mono">08h 00m</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Break Allowance</span>
          <span className="text-sm font-extrabold text-amber-400 font-mono">01h 00m (60 mins)</span>
        </div>
      </div>

      {/* MAIN LIVE CLOCK CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl glass-panel">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Digital Clock & Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Current Status</span>
              {renderStatusBadge()}
            </div>

            {/* Large Digital Clock */}
            <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-wider font-mono">
              {currentTimeFormatted}
            </div>

            {/* Dynamic Status Details */}
            {clockState.status === 'NOT_CLOCKED_IN' && (
              <p className="text-slate-400 text-sm font-medium">Ready to start your workday?</p>
            )}

            {clockState.status === 'WORKING' && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <div>
                  Clocked In: <span className="text-white font-semibold">{clockInTimeStr}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <div>
                  Working Time: <span className="text-brand-400 font-mono font-bold text-sm">{formatSecondsToHMS(workSeconds)}</span>
                </div>
              </div>
            )}

            {clockState.status === 'ON_BREAK' && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <div>
                  Break Started: <span className="text-amber-300 font-semibold">{breakStartTimeStr}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <div>
                  Current Break: <span className="text-amber-400 font-mono font-bold text-sm">{formatSecondsToHMS(breakSeconds)}</span>
                </div>
              </div>
            )}

            {clockState.status === 'CLOCKED_OUT' && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Workday completed. Net working time: <strong className="text-white">{formatSecondsToHM(workSeconds)}</strong></span>
              </div>
            )}

            {/* BREAK ALLOWANCE BREAKDOWN INDICATOR */}
            <div className="pt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Break Used:</span>
                <strong className="text-amber-400 font-mono">{breakUsedMins} min</strong>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Break Remaining:</span>
                <strong className="text-emerald-400 font-mono">{breakRemainingMins} min</strong>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
            {clockState.status === 'NOT_CLOCKED_IN' && (
              <button
                onClick={() => setIsClockInModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-base shadow-xl shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-brand-500/40 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>CLOCK IN</span>
              </button>
            )}

            {clockState.status === 'WORKING' && (
              <>
                <button
                  onClick={() => setIsStartBreakModalOpen(true)}
                  disabled={breakRemainingSeconds <= 0}
                  className={`flex-1 sm:flex-none px-6 py-3.5 rounded-2xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 ${
                    breakRemainingSeconds > 0
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                  title={breakRemainingSeconds <= 0 ? 'Your 1-hour daily break allowance has been fully used.' : 'Take a break'}
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>TAKE BREAK</span>
                </button>

                <button
                  onClick={() => setIsClockOutModalOpen(true)}
                  className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5"
                >
                  <Square className="w-4 h-4 text-rose-400 fill-current" />
                  <span>CLOCK OUT</span>
                </button>
              </>
            )}

            {clockState.status === 'ON_BREAK' && (
              <button
                onClick={endBreak}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>CONTINUE WORKING</span>
              </button>
            )}

            {clockState.status === 'CLOCKED_OUT' && (
              <div className="px-5 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
                Workday Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
