import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, Clock, Coffee, Timer, Activity, Mail, Phone, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { User, AttendanceRecord, BreakRecord, WorkSession } from '../../types';
import { api, MAX_DAILY_BREAK_SECONDS } from '../../services/api';
import { formatSecondsToHM } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';
import { storage } from '../../services/storage';

interface EmployeeDetailModalProps {
  employee: User | null;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose }) => {
  const { user: loggedInUser, deleteEmployee } = useAuth();
  const { addToast } = useWorkClock();
  const [activeTab, setActiveTab] = useState<'overview' | 'breaks' | 'attendance' | 'sessions'>('overview');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [breakHistory, setBreakHistory] = useState<BreakRecord[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Master 1-second live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employee) {
      api.getAttendanceHistory(employee.id).then(setAttendanceHistory);
      api.getBreakHistory(employee.id).then(setBreakHistory);
      api.getWorkSessions(employee.id).then(setWorkSessions);
    }
  }, [employee, now]);

  if (!employee) return null;

  const isAdmin = loggedInUser?.role === 'ADMIN';
  const activeClockState = storage.getActiveClockState(employee.id);
  const todayRecord = attendanceHistory[0];

  // Calculate LIVE work seconds & LIVE break seconds for ongoing sessions
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

  const clockInDisplay = activeClockState.clockInTimestamp
    ? new Date(activeClockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : (todayRecord?.clockIn || 'Not Clocked In');

  const statusDisplay = activeClockState.status === 'WORKING'
    ? '🟢 Working (Ongoing)'
    : activeClockState.status === 'ON_BREAK'
    ? '🟡 On Break (Ongoing)'
    : activeClockState.status === 'CLOCKED_OUT'
    ? (todayRecord?.completionStatus || 'Clocked Out')
    : 'Not Started';

  const handleDelete = async () => {
    try {
      await deleteEmployee(employee.id);
      addToast('Employee Removed', `${employee.name} has been removed from the system.`, 'info');
      onClose();
    } catch (err: any) {
      addToast('Error', err.message || 'Unable to remove employee.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header Banner */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={employee.profileImage}
              alt={employee.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {employee.employeeId}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {employee.employeeType || 'Employee'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{employee.designation} • {employee.department}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {employee.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-400" /> Joined: {employee.joiningDate || '2025-01-01'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && employee.role !== 'ADMIN' && (
              !confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900">
          {[
            { id: 'overview', label: 'Today Overview' },
            { id: 'breaks', label: 'Exact Break History' },
            { id: 'attendance', label: 'Attendance Logs' },
            { id: 'sessions', label: 'Work Sessions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-white'
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
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Clock In Time</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">{clockInDisplay}</p>
                  {todayRecord?.isLate && (
                    <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                      Late by {todayRecord.lateMinutes} mins
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Clock Out</span>
                  <p className="text-base font-bold text-rose-400 mt-1">{todayRecord?.clockOut || '---'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Break Used</span>
                  <p className="text-base font-bold text-amber-400 mt-1">{Math.floor(liveTotalBreakSec / 60)} min</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Break Remaining</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">{Math.floor(breakRemSec / 60)} min</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">Workday Completion Status</h4>
                  <p className="text-sm font-bold text-white">{statusDisplay}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Net Work Time (Live)</span>
                  <span className="font-mono text-xl font-black text-brand-400 animate-pulse-subtle">
                    {formatSecondsToHM(liveWorkSec)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Current Active Task</h4>
                <p className="text-sm font-semibold text-white">"{activeClockState.currentActivity || 'No active task'}"</p>
              </div>
            </div>
          )}

          {activeTab === 'breaks' && (
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-400">
                Exact Break Timestamps & Breakdown (Max 60 Minutes Daily Limit)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Break Type</th>
                      <th className="p-3">Start Time</th>
                      <th className="p-3">End Time</th>
                      <th className="p-3">Duration (Live)</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {breakHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No breaks recorded for this employee.
                        </td>
                      </tr>
                    ) : (
                      breakHistory.map(b => {
                        const isOngoing = !b.endTime || b.endTime === 'Ongoing';
                        const durationSec = isOngoing
                          ? Math.floor((now.getTime() - new Date(b.startTime).getTime()) / 1000)
                          : b.durationSeconds;

                        return (
                          <tr key={b.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-white">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                {b.breakType}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 font-mono">
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="p-3 text-slate-300 font-mono">
                              {isOngoing ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Ongoing
                                </span>
                              ) : (
                                new Date(b.endTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              )}
                            </td>
                            <td className="p-3 text-amber-400 font-mono font-bold">
                              {Math.floor(durationSec / 60)} min ({durationSec}s)
                            </td>
                            <td className="p-3 text-slate-400">{b.notes || '---'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Day</th>
                    <th className="p-3">Clock In</th>
                    <th className="p-3">Clock Out</th>
                    <th className="p-3">Break Time</th>
                    <th className="p-3">Work Hours (Live)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No attendance logs yet.
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((att, idx) => {
                      const isToday = idx === 0 && !att.clockOutTimestamp;
                      const workSec = isToday ? liveWorkSec : att.netWorkSeconds;
                      const breakSec = isToday ? liveTotalBreakSec : att.totalBreakSeconds;

                      return (
                        <tr key={att.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{att.date}</td>
                          <td className="p-3 text-slate-300">{att.dayName}</td>
                          <td className="p-3 text-emerald-400 font-mono">{att.clockIn}</td>
                          <td className="p-3 text-rose-400 font-mono">{att.clockOut || '---'}</td>
                          <td className="p-3 text-amber-300 font-mono">{formatSecondsToHM(breakSec)}</td>
                          <td className="p-3 text-brand-300 font-mono font-bold">{formatSecondsToHM(workSec)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {isToday ? (activeClockState.status === 'WORKING' ? 'Working' : activeClockState.status === 'ON_BREAK' ? 'On Break' : att.status) : (att.completionStatus || att.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {workSessions.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No work sessions recorded.</div>
              ) : (
                workSessions.map(ses => {
                  const isOngoing = ses.status === 'Working' && !ses.endTime;
                  const durationSec = isOngoing
                    ? Math.floor((now.getTime() - new Date(ses.startTime).getTime()) / 1000)
                    : ses.durationSeconds;

                  return (
                    <div key={ses.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{ses.activity}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(ses.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {isOngoing ? 'Active Now' : new Date(ses.endTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="font-mono text-sm font-bold text-brand-400">
                        {formatSecondsToHM(durationSec)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
