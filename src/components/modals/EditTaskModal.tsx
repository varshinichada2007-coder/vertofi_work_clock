import React, { useState } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';

export const EditTaskModal: React.FC = () => {
  const { isEditTaskModalOpen, setIsEditTaskModalOpen, clockState, updateTask } = useWorkClock();
  const [taskName, setTaskName] = useState(clockState.currentActivity || 'Building the Vertofi employee dashboard');
  const [status, setStatus] = useState<'Working' | 'Completed' | 'Paused'>('Working');

  if (!isEditTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    updateTask(taskName.trim(), status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Update Current Activity</h3>
              <p className="text-xs text-slate-400">Record what you are working on right now</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditTaskModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Task Description *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Developing authentication modules..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Task Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Working', 'Completed', 'Paused'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    status === st
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditTaskModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:from-brand-600 hover:to-brand-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
