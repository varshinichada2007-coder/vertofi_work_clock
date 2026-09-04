import React from 'react';
import { Edit3, CheckCircle, PauseCircle, PlayCircle } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';

export const CurrentTaskCard: React.FC = () => {
  const { clockState, setIsEditTaskModalOpen } = useWorkClock();

  return (
    <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl glass-card">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-400"></span>
          What are you working on?
        </h3>
        <button
          onClick={() => setIsEditTaskModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20 hover:bg-brand-500/20 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Task</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Currently working on:</span>
          <p className="text-base font-semibold text-white mt-0.5">
            "{clockState.currentActivity && clockState.currentActivity !== 'No active task' ? clockState.currentActivity : 'No active task. Click CLOCK IN to start working.'}"
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            clockState.status === 'WORKING'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : clockState.status === 'ON_BREAK'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            <PlayCircle className="w-3.5 h-3.5" /> {clockState.status === 'NOT_CLOCKED_IN' ? 'Not Clocked In' : clockState.status === 'ON_BREAK' ? 'On Break' : 'Working'}
          </span>
        </div>
      </div>
    </div>
  );
};
