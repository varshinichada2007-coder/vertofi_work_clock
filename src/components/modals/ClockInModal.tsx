import React, { useState } from 'react';
import { X, Play, MapPin, Calendar, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';

export const ClockInModal: React.FC = () => {
  const { user } = useAuth();
  const { isClockInModalOpen, setIsClockInModalOpen, clockIn, currentTimeFormatted, currentDateFormatted } = useWorkClock();
  const [taskInput, setTaskInput] = useState('Developing the employee dashboard');

  if (!isClockInModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    clockIn(taskInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Start Your Workday</h3>
              <p className="text-xs text-slate-400">Confirm details and enter your initial task</p>
            </div>
          </div>
          <button
            onClick={() => setIsClockInModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only Form Info */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-400" /> Today's Date
              </span>
              <p className="text-xs font-semibold text-white mt-1">{currentDateFormatted}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-400" /> Clock-in Time
              </span>
              <p className="text-xs font-semibold text-white mt-1">{currentTimeFormatted}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-brand-400" /> Employee
              </span>
              <p className="text-xs font-semibold text-white mt-1">{user?.name} ({user?.employeeId})</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> Location
              </span>
              <p className="text-xs font-semibold text-emerald-400 mt-1">{user?.workLocation || 'Work From Home'}</p>
            </div>
          </div>

          {/* Activity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              What are you working on today? *
            </label>
            <input
              type="text"
              required
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g. Developing the employee dashboard"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsClockInModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:from-brand-600 hover:to-brand-700 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Working</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
