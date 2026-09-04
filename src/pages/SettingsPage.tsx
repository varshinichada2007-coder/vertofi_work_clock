import React, { useState } from 'react';
import { Settings, Bell, Clock, Shield, Globe, Save } from 'lucide-react';
import { useWorkClock } from '../context/WorkClockContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useWorkClock();
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" /> WorkClock Preferences & Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Customize reminders, timezone defaults, clock format & notifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reminders & Notifications Section */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl glass-card space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" /> Attendance Reminders
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Clock-In Morning Reminder</span>
                <span className="text-slate-400">Receive alert if not clocked in by target time</span>
              </div>
              <input
                type="checkbox"
                checked={formData.clockInReminder}
                onChange={(e) => setFormData({ ...formData, clockInReminder: e.target.checked })}
                className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Break Duration Warning Alert</span>
                <span className="text-slate-400">Notify when active break exceeds {formData.maxBreakMinutes} minutes</span>
              </div>
              <input
                type="checkbox"
                checked={formData.breakDurationWarning}
                onChange={(e) => setFormData({ ...formData, breakDurationWarning: e.target.checked })}
                className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Activity Update Reminder</span>
                <span className="text-slate-400">Remind to update current task every {formData.activityIntervalMinutes} mins</span>
              </div>
              <input
                type="checkbox"
                checked={formData.activityCheckIn}
                onChange={(e) => setFormData({ ...formData, activityCheckIn: e.target.checked })}
                className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Timezone & Clock Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl glass-card space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" /> Timezone & Clock Display
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Default Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC +05:30)</option>
                <option value="America/New_York">America/New_York (EST - UTC -05:00)</option>
                <option value="Europe/London">Europe/London (GMT - UTC +00:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC +08:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Clock Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use24HourClock: false })}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    !formData.use24HourClock
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  12-Hour (AM/PM)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use24HourClock: true })}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    formData.use24HourClock
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  24-Hour (18:00)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
