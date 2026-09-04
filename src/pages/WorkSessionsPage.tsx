import React, { useState, useEffect } from 'react';
import { Timer, Activity, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkSession } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM } from '../services/exportUtils';

export const WorkSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    if (user?.id) {
      api.getWorkSessions(user.id).then(setSessions);
    }
  }, [user?.id]);

  const totalProductiveSec = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-brand-400" /> Daily Work Sessions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Granular breakdown of focused productivity sessions</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 px-5 py-3 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Productive Time:</span>
          <span className="font-mono text-xl font-black text-brand-400">{formatSecondsToHM(totalProductiveSec)}</span>
        </div>
      </div>

      {/* Sessions Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800">
            No work sessions recorded yet today.
          </div>
        ) : (
          sessions.map((ses, idx) => (
            <div key={ses.id} className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl glass-card flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Session #{idx + 1}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {ses.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-snug">{ses.activity}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>
                    {new Date(ses.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                    {ses.endTime ? new Date(ses.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Now'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase">Duration</span>
                <span className="font-mono text-lg font-bold text-white">{formatSecondsToHM(ses.durationSeconds)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
