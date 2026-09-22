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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Update Current Activity</h3>
              <p className="text-xs text-slate-500">Record what you are working on right now</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditTaskModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Task Description *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Developing authentication modules..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                      ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditTaskModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all"
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
