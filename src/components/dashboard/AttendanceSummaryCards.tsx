import React from 'react';
import { UserCheck, Clock, Timer, Coffee, Zap } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';
import { formatSecondsToHM } from '../../services/exportUtils';

export const AttendanceSummaryCards: React.FC = () => {
  const { clockState, workSeconds, breakSeconds } = useWorkClock();

  const clockInTimeStr = clockState.clockInTimestamp
    ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '---';

  const isClockedIn = clockState.status !== 'NOT_CLOCKED_IN';
  const todayStatusStr = isClockedIn ? 'Present' : 'Not Clocked In';
  const statusColor = isClockedIn ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  const cards = [
    {
      title: "Today's Status",
      value: todayStatusStr,
      subtitle: isClockedIn ? 'Work From Home' : 'Awaiting clock-in',
      icon: UserCheck,
      color: statusColor
    },
    {
      title: 'Clock In',
      value: clockInTimeStr,
      subtitle: 'Recorded start time',
      icon: Clock,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20'
    },
    {
      title: 'Total Work',
      value: formatSecondsToHM(workSeconds),
      subtitle: 'Net active hours',
      icon: Timer,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Total Break',
      value: formatSecondsToHM(clockState.accumulatedBreakSeconds + breakSeconds),
      subtitle: 'Rest & meal time',
      icon: Coffee,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg glass-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white tracking-tight">{card.value}</div>
                <p className="text-xs text-slate-400 font-medium mt-1">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Net Working Hours Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-900/50 via-slate-900 to-slate-900 border border-brand-500/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Net Productive Hours</h4>
            <p className="text-xs text-slate-400">Calculated after deducting all break duration</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-black text-white">{formatSecondsToHM(workSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
