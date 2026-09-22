import React from 'react';
import {
  Clock, Play, Square, Coffee, CheckCircle2,
  Timer, Calendar, Activity, Sparkles, MapPin, Building2,
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';

export const ClockInOutPage: React.FC = () => {
  const { user, organization } = useAuth();
  const {
    currentTimeFormatted,
    currentDateFormatted,
    clockState,
    workSeconds,
    breakSeconds,
    breakUsedSeconds,
    breakRemainingSeconds,
    setIsClockInModalOpen,
    setIsStartBreakModalOpen,
    endBreak,
    setIsClockOutModalOpen,
  } = useWorkClock();

  const isNotClockedIn = clockState.status === 'NOT_CLOCKED_IN';
  const isWorking = clockState.status === 'WORKING';
  const isOnBreak = clockState.status === 'ON_BREAK';
  const isClockedOut = clockState.status === 'CLOCKED_OUT';

  const scheduledHours = 8;
  const scheduledSeconds = scheduledHours * 3600;
  const overtimeSec = Math.max(0, workSeconds - scheduledSeconds);

  const formatHoursMins = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Punch Clock Hub</h2>
        <p className="text-xs text-slate-500">Record your workday shift start, pause for breaks, and clock out</p>
      </div>

      {/* Main Digital Clock Punch Center */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 text-center shadow-2xs space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Digital Clock */}
        <div className="text-5xl sm:text-6xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
          {currentTimeFormatted}
        </div>

        {/* Status Chip */}
        <div className="flex justify-center">
          {isWorking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Actively Working
            </span>
          )}
          {isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              On Break ({clockState.currentBreakType || 'Rest'})
            </span>
          )}
          {isClockedOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Shift Completed for Today
            </span>
          )}
          {isNotClockedIn && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Shift Inactive
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
          {isNotClockedIn && (
            <button
              onClick={() => setIsClockInModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Clock In Now</span>
            </button>
          )}

          {isWorking && (
            <>
              <button
                onClick={() => setIsStartBreakModalOpen(true)}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Take Break</span>
              </button>

              <button
                onClick={() => setIsClockOutModalOpen(true)}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Clock Out</span>
              </button>
            </>
          )}

          {isOnBreak && (
            <button
              onClick={endBreak}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Work</span>
            </button>
          )}

          {isClockedOut && (
            <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Your attendance transaction for today is finalized.
            </div>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Net Work Time</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatHoursMins(workSeconds)}
          </div>
          <p className="text-[11px] text-slate-400">Total active working duration</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Break Taken</span>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {formatHoursMins(breakUsedSeconds)}
          </div>
          <p className="text-[11px] text-slate-400">{Math.floor(breakRemainingSeconds / 60)}m allowance left</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Overtime</span>
          <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums">
            {formatHoursMins(overtimeSec)}
          </div>
          <p className="text-[11px] text-slate-400">Hours exceeding 8.0h</p>
        </div>
      </div>
    </div>
  );
};
