import React, { useState, useEffect } from 'react';
import {
  Settings, Clock, Shield, Building2, Bell, Save, CheckCircle2,
  Calendar, AlertTriangle, Coffee, Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { WorkScheduleConfig, DaySchedule } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, role, organization, switchOrganization, organizations } = useAuth();
  const { settings, updateSettings, addToast } = useWorkClock();
  const isAdmin = role === 'ADMIN';

  // Work Schedule State (For Admin)
  const [scheduleConfig, setScheduleConfig] = useState<WorkScheduleConfig>({
    organizationId: organization?.id || 'org_vertofi',
    schedules: [
      { day: 'Monday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
      { day: 'Tuesday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
      { day: 'Wednesday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
      { day: 'Thursday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
      { day: 'Friday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
      { day: 'Saturday', isWorkday: false, startTime: '09:00', endTime: '13:00', requiredHours: 0 },
      { day: 'Sunday', isWorkday: false, startTime: '09:00', endTime: '13:00', requiredHours: 0 }
    ],
    lateGraceMinutes: 15,
    overtimeThresholdHours: 8,
    maxBreakMinutes: 60
  });

  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgCode, setOrgCode] = useState(organization?.code || '');
  const [timezone, setTimezone] = useState(organization?.timezone || 'Asia/Kolkata');

  // Employee Reminders Form State
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isAdmin && organization?.id) {
      api.getWorkSchedule(organization.id).then(res => {
        if (res) setScheduleConfig(res);
      });
      setOrgName(organization.name);
      setOrgCode(organization.code);
      setTimezone(organization.timezone);
    }
  }, [isAdmin, organization?.id]);

  const handleDayChange = (index: number, updates: Partial<DaySchedule>) => {
    const updated = [...scheduleConfig.schedules];
    updated[index] = { ...updated[index], ...updates };
    setScheduleConfig({ ...scheduleConfig, schedules: updated });
  };

  const handleSaveSchedule = async () => {
    try {
      await api.updateWorkSchedule(scheduleConfig);
      await api.updateOrganizationSettings({
        name: orgName,
        code: orgCode,
        timezone,
        lateGraceMinutes: scheduleConfig.lateGraceMinutes,
        standardWorkHours: scheduleConfig.overtimeThresholdHours
      });
      addToast('Configuration Saved', 'Company work schedule and settings have been updated.', 'success');
    } catch (err: any) {
      addToast('Save Failed', err.message || 'Unable to update schedule.', 'error');
    }
  };

  const handleSaveReminders = () => {
    updateSettings(localSettings);
    addToast('Preferences Updated', 'Your personal notification preferences have been saved.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Company &amp; Workday Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System &amp; Work Schedule Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure standard company working hours, late arrival tolerances, break allowances, and notifications.
          </p>
        </div>
      </div>

      {/* Admin Company Work Schedule Settings */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Organization Profile Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Organization Profile &amp; Multi-Tenant Context</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tenant Code
                </label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standard Working Hours Mon - Sun Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Weekly Work Schedule &amp; Expected Hours</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Used by the backend to determine late arrival flags, expected shift lengths, and overtime thresholds.
                </p>
              </div>

              <button
                onClick={handleSaveSchedule}
                className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Schedule Rules</span>
              </button>
            </div>

            {/* Threshold Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Late Arrival Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={scheduleConfig.lateGraceMinutes}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, lateGraceMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Standard Shift Target (Hours)
                </label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={scheduleConfig.overtimeThresholdHours}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, overtimeThresholdHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Max Daily Break Cap (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={scheduleConfig.maxBreakMinutes}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, maxBreakMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>
            </div>

            {/* Schedule Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Day of Week</th>
                    <th className="px-4 py-3">Workday Status</th>
                    <th className="px-4 py-3">Shift Start Time</th>
                    <th className="px-4 py-3">Shift End Time</th>
                    <th className="px-4 py-3">Required Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleConfig.schedules.map((sched, idx) => (
                    <tr key={sched.day} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {sched.day}
                      </td>

                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sched.isWorkday}
                            onChange={(e) => handleDayChange(idx, { isWorkday: e.target.checked })}
                            className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                          />
                          <span className={sched.isWorkday ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            {sched.isWorkday ? 'Working Day' : 'Day Off / Weekend'}
                          </span>
                        </label>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="time"
                          disabled={!sched.isWorkday}
                          value={sched.startTime}
                          onChange={(e) => handleDayChange(idx, { startTime: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono disabled:opacity-30 focus:bg-white focus:outline-none focus:border-brand-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="time"
                          disabled={!sched.isWorkday}
                          value={sched.endTime}
                          onChange={(e) => handleDayChange(idx, { endTime: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono disabled:opacity-30 focus:bg-white focus:outline-none focus:border-brand-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          disabled={!sched.isWorkday}
                          value={sched.requiredHours}
                          onChange={(e) => handleDayChange(idx, { requiredHours: Number(e.target.value) })}
                          className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono disabled:opacity-30 focus:bg-white focus:outline-none focus:border-brand-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity & Screen-Off Auto Clock-Out Configuration */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Timer className="w-4 h-4 text-rose-600" />
            <span>Cursor Inactivity &amp; Screen-Off Auto Clock-Out</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
            Enterprise Mandate
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Automatically stops workday timers and clocks out the employee when cursor movement stops or when the screen turns off / locks.
        </p>

        <div className="space-y-3">
          {/* Toggle 1: Cursor Inactivity */}
          <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-xs text-slate-900">Auto Clock-Out on Cursor Inactivity / No Response</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Detects absence of mouse movement, clicking, and keyboard typing. Automatically clocks out after timeout.
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoClockOutOnIdle}
              onChange={(e) => setLocalSettings({ ...localSettings, autoClockOutOnIdle: e.target.checked })}
              className="w-4 h-4 mt-1 accent-rose-600 rounded"
            />
          </label>

          {/* Inactivity Timeout selection */}
          {localSettings.autoClockOutOnIdle && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Inactivity Timeout (Minutes of No Cursor Movement)
                </label>
                <select
                  value={localSettings.idleTimeoutMinutes}
                  onChange={(e) => setLocalSettings({ ...localSettings, idleTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-rose-500 shadow-2xs"
                >
                  <option value={2}>2 Minutes (Strict)</option>
                  <option value={5}>5 Minutes (Standard - Recommended)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Warning Countdown Duration (Seconds)
                </label>
                <select
                  value={localSettings.idleWarningSeconds}
                  onChange={(e) => setLocalSettings({ ...localSettings, idleWarningSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-rose-500 shadow-2xs"
                >
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds (Recommended)</option>
                  <option value={60}>60 Seconds</option>
                </select>
              </div>
            </div>
          )}

          {/* Toggle 2: Screen Off / Tab Hidden */}
          <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-xs text-slate-900">Auto Clock-Out on Screen Off / Device Lock</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Immediately detects when the computer display turns off, the lid is closed, or the operating system is locked, and auto clocks out.
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoClockOutOnScreenOff}
              onChange={(e) => setLocalSettings({ ...localSettings, autoClockOutOnScreenOff: e.target.checked })}
              className="w-4 h-4 mt-1 accent-rose-600 rounded"
            />
          </label>

          {localSettings.autoClockOutOnScreenOff && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Screen-Off Grace Period (Seconds)
              </label>
              <select
                value={localSettings.screenOffGraceSeconds}
                onChange={(e) => setLocalSettings({ ...localSettings, screenOffGraceSeconds: Number(e.target.value) })}
                className="w-full sm:w-64 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-rose-500 shadow-2xs"
              >
                <option value={5}>5 Seconds (Immediate)</option>
                <option value={10}>10 Seconds (Recommended)</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* User Preferences & Reminders */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-600" />
          <span>Clock Reminders &amp; Notification Alerts</span>
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <div className="font-bold text-xs text-slate-900">Daily Clock-In Notification</div>
              <div className="text-[11px] text-slate-500">Receive reminder at 09:00 AM if not clocked in.</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.clockInReminder}
              onChange={(e) => setLocalSettings({ ...localSettings, clockInReminder: e.target.checked })}
              className="w-4 h-4 accent-brand-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <div className="font-bold text-xs text-slate-900">End of Day Clock-Out Reminder</div>
              <div className="text-[11px] text-slate-500">Receive notification at 06:00 PM to finalize session.</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.clockOutReminder}
              onChange={(e) => setLocalSettings({ ...localSettings, clockOutReminder: e.target.checked })}
              className="w-4 h-4 accent-brand-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <div>
              <div className="font-bold text-xs text-slate-900">Break Duration Warning Alert</div>
              <div className="text-[11px] text-slate-500">Alert when continuous break approaches 60 minutes.</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.breakDurationWarning}
              onChange={(e) => setLocalSettings({ ...localSettings, breakDurationWarning: e.target.checked })}
              className="w-4 h-4 accent-brand-600 rounded"
            />
          </label>
        </div>

        <button
          onClick={handleSaveReminders}
          className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Inactivity &amp; Notification Preferences</span>
        </button>
      </div>
    </div>
  );
};

