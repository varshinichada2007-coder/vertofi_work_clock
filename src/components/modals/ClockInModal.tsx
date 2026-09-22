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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Start Your Workday</h3>
              <p className="text-xs text-slate-500">Confirm details and enter your initial task</p>
            </div>
          </div>
          <button
            onClick={() => setIsClockInModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only Form Info */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-600" /> Today's Date
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">{currentDateFormatted}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-600" /> Clock-in Time
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">{currentTimeFormatted}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-brand-600" /> Employee
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">{user?.name} ({user?.employeeId})</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Location
              </span>
              <p className="text-xs font-semibold text-emerald-700 mt-1">{user?.workLocation || 'Work From Home'}</p>
            </div>
          </div>

          {/* Activity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              What are you working on today? *
            </label>
            <input
              type="text"
              required
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g. Developing the employee dashboard"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsClockInModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-600/20 hover:bg-brand-700 flex items-center gap-2 transition-all"
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
