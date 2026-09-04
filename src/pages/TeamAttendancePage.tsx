import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, ExternalLink, ShieldAlert, UserPlus, Coffee, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { TeamMemberStatus, User } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM, exportTeamToCSV } from '../services/exportUtils';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';
import { AddEmployeeModal } from '../components/modals/AddEmployeeModal';

export const TeamAttendancePage: React.FC = () => {
  const { role, users } = useAuth();
  const { setIsAddEmployeeModalOpen } = useWorkClock();
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  useEffect(() => {
    api.getTeamAttendance().then(setTeam);
    const interval = setInterval(() => {
      api.getTeamAttendance().then(setTeam);
    }, 5000);
    return () => clearInterval(interval);
  }, [users.length]);

  const isAdmin = role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Admin Access Required</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Team Attendance is restricted to the Administrator.
        </p>
      </div>
    );
  }

  const filteredTeam = team.filter(member => {
    if (statusFilter !== 'ALL' && member.currentStatus !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        member.user.name.toLowerCase().includes(q) ||
        member.user.employeeId.toLowerCase().includes(q) ||
        member.user.department.toLowerCase().includes(q) ||
        (member.currentActivity || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'WORKING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 🟢 Working</span>;
      case 'ON_BREAK':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> 🟡 On Break</span>;
      case 'CLOCKED_OUT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 🔴 Clocked Out</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> ⚪ Not Clocked In</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" /> Team Attendance Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status, login times, break durations & active tasks</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Employee
          </button>

          <button
            onClick={() => exportTeamToCSV(filteredTeam)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Employees' },
          { id: 'WORKING', label: '🟢 Working' },
          { id: 'ON_BREAK', label: '🟡 On Break' },
          { id: 'NOT_CLOCKED_IN', label: '⚪ Not Clocked In' },
          { id: 'CLOCKED_OUT', label: '🔴 Clocked Out' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-slate-800 text-white border border-brand-500/50 shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Team Table / Clean Empty State */}
      {team.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-4 bg-slate-900/80 rounded-3xl border border-slate-800 glass-card">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">No employees registered yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add employees or interns to monitor their live clock-in times, break intervals, and workday productivity.
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
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl glass-panel">
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
                  <th className="p-4">Last Activity</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      No employees matching the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map(m => {
                    const breakUsedMins = Math.floor(m.totalBreakSecondsToday / 60);
                    const breakRemMins = Math.floor(m.remainingBreakSecondsToday / 60);

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
                        <td className="p-4">{getStatusPill(m.currentStatus)}</td>
                        <td className="p-4 max-w-xs truncate text-slate-200">"{m.currentActivity || '---'}"</td>
                        <td className="p-4 font-mono text-amber-300">{m.breakStartedFormatted || '---'}</td>
                        <td className="p-4 font-mono text-amber-400 font-bold">{breakUsedMins} min</td>
                        <td className="p-4 font-mono text-emerald-400 font-bold">{breakRemMins} min</td>
                        <td className="p-4 font-mono font-bold text-brand-300">{formatSecondsToHM(m.totalWorkSecondsToday)}</td>
                        <td className="p-4 text-slate-400 text-xs">{m.lastActive}</td>
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(m.user);
                            }}
                            className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg"
                            title="View Employee Profile & Exact Breaks"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddEmployeeModal />
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};
