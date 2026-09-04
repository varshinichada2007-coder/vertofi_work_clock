import React, { useState, useEffect } from 'react';
import { Activity, Plus, Edit3, CheckCircle2, PlayCircle, PauseCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { ActivityRecord } from '../types';
import { api } from '../services/api';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const { clockState, setIsEditTaskModalOpen } = useWorkClock();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      api.getActivityLog(user.id).then(setActivities);
    }
  }, [user?.id, clockState.currentActivity]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Current Task Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-brand-400">Current Task Active</span>
          <h2 className="text-xl font-bold text-white mt-1">"{clockState.currentActivity}"</h2>
          <p className="text-xs text-slate-400 mt-1">Status: Working (Work From Home)</p>
        </div>
        <button
          onClick={() => setIsEditTaskModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20"
        >
          <Edit3 className="w-4 h-4" />
          <span>Update Task</span>
        </button>
      </div>

      {/* Activity Logs Table / List */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl glass-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" /> Activity History Log
        </h3>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No activity logs recorded yet.</div>
          ) : (
            activities.map(act => (
              <div key={act.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{act.activity}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Started at: {new Date(act.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5" /> {act.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
