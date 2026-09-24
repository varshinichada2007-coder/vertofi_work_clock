import React, { useState, useEffect } from 'react';
import {
  X, UserCheck, Calendar, Clock, Coffee, Timer, Activity, Mail, Phone,
  MapPin, Trash2, AlertTriangle, Shield, CheckCircle2, TrendingUp
} from 'lucide-react';
import { User, AttendanceRecord, BreakRecord, WorkSession, TeamMemberStatus } from '../../types';
import { api, MAX_DAILY_BREAK_SECONDS } from '../../services/api';
import { formatSecondsToHM } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';
import { storage } from '../../services/storage';

export interface EmployeeDetailModalProps {
  member?: TeamMemberStatus | { user: User; [key: string]: any } | null;
  employee?: User | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  member,
  employee: rawEmployee,
  isOpen = true,
  onClose
}) => {
  const targetUser: User | null = member?.user || rawEmployee || null;
  const { user: loggedInUser, organization, toggleEmployeeStatus } = useAuth();
  const { addToast } = useWorkClock();
  const [activeTab, setActiveTab] = useState<'overview' | 'breaks' | 'attendance' | 'sessions'>('overview');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [breakHistory, setBreakHistory] = useState<BreakRecord[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [now, setNow] = useState<Date>(new Date());

  // Admin Shift Re-Open State
  const [isReopenFormOpen, setIsReopenFormOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('Auto clock-out error / Valid reason verified by Admin');
  const [reopenMode, setReopenMode] = useState<'RESUME' | 'RESET_TO_CLOCK_IN'>('RESUME');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshModalData = () => {
    if (targetUser?.id) {
      api.getAttendanceHistory(targetUser.id, organization?.id).then(setAttendanceHistory);
      api.getBreakHistory(targetUser.id).then(setBreakHistory);
      api.getWorkSessions(targetUser.id).then(setWorkSessions);
    }
  };

  useEffect(() => {
    refreshModalData();
  }, [targetUser?.id, organization?.id]);

  const handleReopenShift = async () => {
    if (!loggedInUser?.id || !targetUser?.id || !reopenReason.trim()) return;
    setIsSubmittingReopen(true);
    try {
      const res = await api.adminReopenShift(loggedInUser.id, targetUser.id, reopenMode, reopenReason.trim());
      addToast('Shift Re-Opened', res.message, 'success');
      setIsReopenFormOpen(false);
      refreshModalData();
    } catch (err: any) {
      addToast('Re-Open Failed', err.message || 'Unable to re-open shift.', 'error');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  if (!isOpen || !targetUser) return null;

  const isAdmin = loggedInUser?.role === 'ADMIN';
  const activeClockState = storage.getActiveClockState(targetUser.id);
  const todayRecord = attendanceHistory.find(r => r.date === new Date().toISOString().split('T')[0]) || attendanceHistory[0];

  let liveWorkSec = 0;
  let liveTotalBreakSec = activeClockState.accumulatedBreakSeconds;

  if (activeClockState.status === 'ON_BREAK' && activeClockState.currentBreakStartTimestamp) {
    const currentBreakSec = Math.floor((now.getTime() - activeClockState.currentBreakStartTimestamp) / 1000);
    liveTotalBreakSec = activeClockState.accumulatedBreakSeconds + currentBreakSec;
  }

  if (activeClockState.clockInTimestamp) {
    const currentMs = activeClockState.clockOutTimestamp || now.getTime();
    const totalElapsed = Math.floor((currentMs - activeClockState.clockInTimestamp) / 1000);
    liveWorkSec = Math.max(0, totalElapsed - liveTotalBreakSec);
  } else if (todayRecord) {
    liveWorkSec = todayRecord.netWorkSeconds;
    liveTotalBreakSec = todayRecord.totalBreakSeconds;
  }

  const breakRemSec = Math.max(0, MAX_DAILY_BREAK_SECONDS - liveTotalBreakSec);
  const overtimeSec = Math.max(0, liveWorkSec - 28800);

  const clockInDisplay = activeClockState.clockInTimestamp
    ? new Date(activeClockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : (todayRecord?.clockIn || 'Not Clocked In');

  const statusDisplay = activeClockState.status === 'WORKING'
    ? '🟢 Working (Active Shift)'
    : activeClockState.status === 'ON_BREAK'
    ? '🟡 On Break'
    : activeClockState.status === 'CLOCKED_OUT'
    ? '🟣 Clocked Out'
    : todayRecord?.status === 'LEAVE'
    ? '🟣 On Leave'
    : 'Not Started';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-200 text-brand-700 font-bold flex items-center justify-center text-xl shadow-xs shrink-0">
              {targetUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{targetUser.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {targetUser.employeeId}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {targetUser.employeeType || 'Employee'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    targetUser.status === 'DEACTIVATED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {targetUser.status === 'DEACTIVATED' ? 'Deactivated' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">{targetUser.designation} • {targetUser.department}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {targetUser.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {targetUser.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-600" /> Joined: {targetUser.joiningDate || '2025-01-01'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          {[
            { id: 'overview', label: "Today's Overview" },
            { id: 'attendance', label: 'Monthly Attendance Logs' },
            { id: 'breaks', label: 'Break History' },
            { id: 'sessions', label: 'Work Focus Sessions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Clock In</span>
                  <p className="text-base font-bold text-emerald-600 mt-1">{clockInDisplay}</p>
                  {todayRecord?.isLate && (
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      Late by {todayRecord.lateMinutes}m
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Clock Out</span>
                  <p className="text-base font-bold text-rose-600 mt-1">{todayRecord?.clockOut || '---'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Break Used</span>
                  <p className="text-base font-bold text-amber-700 mt-1">{Math.floor(liveTotalBreakSec / 60)} min</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Overtime</span>
                  <p className="text-base font-bold text-purple-700 mt-1">{formatSecondsToHM(overtimeSec)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 mb-1">Workday Status</h4>
                  <p className="text-sm font-bold text-slate-900">{statusDisplay}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Net Work Time</span>
                  <span className="font-mono text-xl font-black text-brand-700">
                    {formatSecondsToHM(liveWorkSec)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-1">Active Task / Activity</h4>
                <p className="text-sm font-semibold text-slate-900">"{activeClockState.currentActivity || todayRecord?.initialTask || 'No active task'}"</p>
              </div>

              {/* Admin Shift Re-Open & Re-Clock In Permission Section */}
              {isAdmin && (activeClockState.status === 'CLOCKED_OUT' || (todayRecord?.clockOut && todayRecord.clockOut !== '—')) && (
                <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <Shield className="w-4 h-4 text-purple-700" />
                        <span>Shift Finalized / Clocked Out (Admin Override)</span>
                      </div>
                      <p className="text-[11px] text-purple-700 mt-0.5">
                        If this employee was clocked out accidentally (auto-logout) or provided a valid reason to continue working, you can re-open their shift.
                      </p>
                    </div>
                  </div>

                  {!isReopenFormOpen ? (
                    <button
                      onClick={() => setIsReopenFormOpen(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Allow Re-Clock In / Re-Open Shift</span>
                    </button>
                  ) : (
                    <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Approval Reason (Required):
                        </label>
                        <input
                          type="text"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. Auto clock-out error, valid reason approved by Admin"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="reopenMode"
                            checked={reopenMode === 'RESUME'}
                            onChange={() => setReopenMode('RESUME')}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>Resume Shift (Keep Clock-in & Work duration)</span>
                        </label>
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="reopenMode"
                            checked={reopenMode === 'RESET_TO_CLOCK_IN'}
                            onChange={() => setReopenMode('RESET_TO_CLOCK_IN')}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>Reset for Fresh Clock-In</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={!reopenReason.trim() || isSubmittingReopen}
                          onClick={handleReopenShift}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isSubmittingReopen ? 'Re-opening...' : 'Approve & Re-Open Shift'}</span>
                        </button>
                        <button
                          onClick={() => setIsReopenFormOpen(false)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Day</th>
                    <th className="p-3">Clock In</th>
                    <th className="p-3">Clock Out</th>
                    <th className="p-3">Break Time</th>
                    <th className="p-3">Work Hours</th>
                    <th className="p-3">Overtime</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">
                        No attendance logs yet.
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">{att.date}</td>
                        <td className="p-3 text-slate-600">{att.dayName}</td>
                        <td className="p-3 text-emerald-700 font-mono font-medium">{att.clockIn || '---'}</td>
                        <td className="p-3 text-rose-700 font-mono font-medium">{att.clockOut || '---'}</td>
                        <td className="p-3 text-amber-700 font-mono">{formatSecondsToHM(att.totalBreakSeconds)}</td>
                        <td className="p-3 text-brand-700 font-mono font-bold">{formatSecondsToHM(att.netWorkSeconds)}</td>
                        <td className="p-3 text-purple-700 font-mono">{formatSecondsToHM(att.overtimeSeconds)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            att.status === 'LEAVE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : att.status === 'LATE' || att.isLate
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'breaks' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Break Type</th>
                      <th className="p-3">Start Time</th>
                      <th className="p-3">End Time</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No breaks recorded for this employee.
                        </td>
                      </tr>
                    ) : (
                      breakHistory.map(b => {
                        const isOngoing = !b.endTime;
                        const durationSec = isOngoing
                          ? Math.floor((now.getTime() - new Date(b.startTime).getTime()) / 1000)
                          : b.durationSeconds;

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold text-slate-900">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                {b.breakType}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-mono">
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="p-3 text-slate-600 font-mono">
                              {isOngoing ? (
                                <span className="text-amber-700 font-semibold">Ongoing</span>
                              ) : (
                                new Date(b.endTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              )}
                            </td>
                            <td className="p-3 text-amber-700 font-mono font-bold">
                              {Math.floor(durationSec / 60)} min ({durationSec}s)
                            </td>
                            <td className="p-3 text-slate-500">{b.notes || '---'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {workSessions.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No work sessions recorded.</div>
              ) : (
                workSessions.map(ses => (
                  <div key={ses.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ses.activity}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(ses.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                        {ses.endTime ? new Date(ses.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Now'}
                      </p>
                    </div>
                    <div className="font-mono text-sm font-bold text-brand-700">
                      {formatSecondsToHM(ses.durationSeconds)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
