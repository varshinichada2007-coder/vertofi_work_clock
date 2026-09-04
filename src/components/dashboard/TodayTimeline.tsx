import React from 'react';
import { PlayCircle, Coffee, CheckCircle, Edit3, Square, Clock } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';

export const TodayTimeline: React.FC = () => {
  const { timelineEvents } = useWorkClock();

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'CLOCK_IN':
        return { icon: PlayCircle, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
      case 'BREAK_START':
        return { icon: Coffee, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
      case 'BREAK_END':
        return { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
      case 'TASK_UPDATE':
        return { icon: Edit3, color: 'text-brand-400 bg-brand-500/20 border-brand-500/30' };
      case 'CLOCK_OUT':
        return { icon: Square, color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' };
      default:
        return { icon: Clock, color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' };
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl glass-card">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-6 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-400" />
        Today's Activity Timeline
      </h3>

      {timelineEvents.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          No events recorded for today yet. Clock in to get started!
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {timelineEvents.map((ev) => {
            const badge = getEventBadge(ev.type);
            const Icon = badge.icon;
            return (
              <div key={ev.id} className="relative flex items-start gap-4 group">
                {/* Timeline node icon */}
                <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${badge.color} shadow-md`}>
                  <Icon className="w-3 h-3" />
                </div>

                <div className="flex-1 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 group-hover:border-slate-700/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                    <span className="font-mono text-xs text-brand-300 font-semibold">{ev.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ev.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
