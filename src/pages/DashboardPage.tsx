import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { LiveClockCard } from '../components/dashboard/LiveClockCard';
import { CurrentTaskCard } from '../components/dashboard/CurrentTaskCard';
import { AttendanceSummaryCards } from '../components/dashboard/AttendanceSummaryCards';
import { TodayTimeline } from '../components/dashboard/TodayTimeline';
import { AddEmployeeModal } from '../components/modals/AddEmployeeModal';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';
import { Users, UserPlus, CheckCircle2, Clock, Coffee, AlertCircle, Award, ExternalLink, ShieldCheck } from 'lucide-react';
import { TeamMemberStatus, User } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM } from '../services/exportUtils';

export const DashboardPage: React.FC = () => {
  const { user, users } = useAuth();
  const { setIsAddEmployeeModalOpen } = useWorkClock();
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [reportsSummary, setReportsSummary] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      api.getTeamAttendance().then(setTeam);
      api.getReportsSummary().then(setReportsSummary);
      const interval = setInterval(() => {
        api.getTeamAttendance().then(setTeam);
        api.getReportsSummary().then(setReportsSummary);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, users.length]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const employeesOnly = users.filter(u => u.role !== 'ADMIN');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {getGreeting()}, <span className="text-brand-400">{user?.name || 'User'}</span> 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            {isAdmin ? "Admin Overview & Real-Time Team Attendance Dashboard" : "Here's your workday overview and time tracking controls."}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-2xl border border-slate-700/60 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>WFH Remote Session</span>
          </div>
        )}
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {isAdmin ? (
        <div className="space-y-6">
          {/* Admin Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Employees</span>
              <div className="text-2xl font-black text-white mt-1">{reportsSummary?.totalEmployees ?? employeesOnly.length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Present Today</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{reportsSummary?.presentToday ?? 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Currently Working</span>
              <div className="text-2xl font-black text-brand-400 mt-1">{reportsSummary?.workingCount ?? 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">On Break</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{reportsSummary?.breakCount ?? 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Not Clocked In</span>
              <div className="text-2xl font-black text-slate-400 mt-1">{reportsSummary?.notClockedInCount ?? 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Completed Workday</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{reportsSummary?.completedWorkdayCount ?? 0}</div>
            </div>
          </div>

          {/* Today's Employee Attendance Table / Empty State */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" /> Today's Employee Attendance
              </h3>
              <span className="text-xs text-slate-400">9-Hour Workday • 60m Break Cap</span>
            </div>

            {employeesOnly.length === 0 ? (
              /* EMPTY STATE WHEN ZERO EMPLOYEES */
              <div className="py-12 px-4 text-center space-y-4 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">No employees added yet.</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add your first employee or intern to begin tracking attendance, break duration, and productive work hours.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddEmployeeModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Employee</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-xs border-b border-slate-800">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">ID</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Login Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Current Activity</th>
                      <th className="p-4">Break Started</th>
                      <th className="p-4">Total Break</th>
                      <th className="p-4">Break Remaining</th>
                      <th className="p-4">Work Time</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {team.map(m => {
                      const breakRemMins = Math.floor(m.remainingBreakSecondsToday / 60);
                      const breakUsedMins = Math.floor(m.totalBreakSecondsToday / 60);

                      return (
                        <tr
                          key={m.user.id}
                          onClick={() => setSelectedEmployee(m.user)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="p-4 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.user.profileImage}
                                alt={m.user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  {m.user.name}
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                    {m.user.employeeType || 'Employee'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400">{m.user.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-brand-300 font-semibold">{m.user.employeeId}</td>
                          <td className="p-4 text-slate-300">{m.user.department}</td>
                          <td className="p-4 font-mono text-emerald-400">
                            {m.clockInTimeFormatted ? (
                              <span>
                                {m.clockInTimeFormatted}
                                {m.attendanceToday?.isLate && (
                                  <span className="block text-[10px] text-amber-400 font-sans">
                                    Late by {m.attendanceToday.lateMinutes} mins
                                  </span>
                                )}
                              </span>
                            ) : '---'}
                          </td>
                          <td className="p-4">
                            {m.currentStatus === 'WORKING' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 Working</span>}
                            {m.currentStatus === 'ON_BREAK' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">🟡 On Break</span>}
                            {m.currentStatus === 'CLOCKED_OUT' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">🔴 Clocked Out</span>}
                            {m.currentStatus === 'NOT_CLOCKED_IN' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">⚪ Not Clocked In</span>}
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-200">"{m.currentActivity || '---'}"</td>
                          <td className="p-4 font-mono text-amber-300">{m.breakStartedFormatted || '---'}</td>
                          <td className="p-4 font-mono text-amber-400 font-bold">{breakUsedMins} min</td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">{breakRemMins} min</td>
                          <td className="p-4 font-mono font-bold text-brand-300">{formatSecondsToHM(m.totalWorkSecondsToday)}</td>
                          <td className="p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployee(m.user);
                              }}
                              className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EMPLOYEE DASHBOARD VIEW */
        <div className="space-y-6">
          <LiveClockCard />
          <CurrentTaskCard />
          <AttendanceSummaryCards />
          <TodayTimeline />
        </div>
      )}

      {/* Global Modals for Admin */}
      <AddEmployeeModal />
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};
