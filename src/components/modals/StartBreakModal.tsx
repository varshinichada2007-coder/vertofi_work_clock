import React, { useState } from 'react';
import { X, Coffee, Play } from 'lucide-react';
import { useWorkClock } from '../../context/WorkClockContext';
import { BreakType } from '../../types';

export const StartBreakModal: React.FC = () => {
  const { isStartBreakModalOpen, setIsStartBreakModalOpen, startBreak } = useWorkClock();
  const [breakType, setBreakType] = useState<BreakType>('Lunch');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isStartBreakModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await startBreak(breakType, notes.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breakOptions: { type: BreakType; icon: string; desc: string }[] = [
    { type: 'Lunch', icon: '🍱', desc: 'Meal break' },
    { type: 'Tea/Coffee', icon: '☕', desc: 'Short refreshments' },
    { type: 'Personal', icon: '👤', desc: 'Personal task' },
    { type: 'Meeting', icon: '🤝', desc: 'Out of office meeting' },
    { type: 'Other', icon: '⏱️', desc: 'Miscellaneous' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Start Break</h3>
              <p className="text-xs text-slate-500">Select break type and duration will be recorded</p>
            </div>
          </div>
          <button
            onClick={() => setIsStartBreakModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Break Type Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Break Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {breakOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setBreakType(opt.type)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    breakType === opt.type
                      ? 'bg-amber-50 border-amber-300 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{opt.type}</span>
                    <span className="text-[10px] text-slate-500">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Optional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lunch break with team"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsStartBreakModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <Coffee className="w-4 h-4" />
              <span>START BREAK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
