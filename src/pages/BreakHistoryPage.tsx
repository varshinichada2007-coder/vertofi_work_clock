import React, { useState, useEffect } from 'react';
import { Coffee, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BreakRecord } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM } from '../services/exportUtils';

export const BreakHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [breaks, setBreaks] = useState<BreakRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      api.getBreakHistory(user.id).then(setBreaks);
    }
  }, [user?.id]);

  const totalBreakSec = breaks.reduce((acc, b) => acc + b.durationSeconds, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" /> Break History Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit trail of all rest intervals and meal breaks</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 px-5 py-3 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Break Duration:</span>
          <span className="font-mono text-xl font-black text-amber-400">{formatSecondsToHM(totalBreakSec)}</span>
        </div>
      </div>

      {/* Break History Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl glass-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-xs border-b border-slate-800">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Break Type</th>
                <th className="p-4">Start Time</th>
                <th className="p-4">End Time</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {breaks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No breaks recorded yet.
                  </td>
                </tr>
              ) : (
                breaks.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {new Date(b.startTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {b.breakType}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300">
                      {b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {formatSecondsToHM(b.durationSeconds)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {b.notes || '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
