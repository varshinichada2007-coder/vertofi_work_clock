import React, { useState, useEffect } from 'react';
import {
  Calendar, Filter, Download, FileSpreadsheet, FileText, CheckCircle2,
  XCircle, Clock, Award, Search, TrendingUp, Coffee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { AttendanceRecord } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM, exportAttendanceToCSV, exportAttendanceToExcel, exportAttendanceToPDF } from '../services/exportUtils';

export const MyAttendancePage: React.FC = () => {
  const { user, organization } = useAuth();
  const { workSeconds, breakUsedSeconds } = useWorkClock();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMyAttendance = async () => {
    if (!user) return;
    try {
      const data = await api.getAttendanceHistory(user.id, organization?.id);
      setRecords(data);
    } catch (e) {
      console.error('Error fetching personal attendance:', e);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [user?.id, organization?.id, workSeconds, breakUsedSeconds]);

  const todayStr = new Date().toISOString().split('T')[0];

  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'PRESENT' || r.status === 'WORKING' || r.status === 'ON_BREAK' || r.status === 'COMPLETED').length;
  const lateDays = records.filter(r => r.isLate || r.status === 'LATE').length;
  const leaveDays = records.filter(r => r.status === 'LEAVE').length;
  const absentDays = records.filter(r => r.status === 'ABSENT').length;

  const totalWorkSec = records.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
  const totalOvertimeSec = records.reduce((acc, r) => acc + (r.overtimeSeconds || 0), 0);

  const filteredRecords = records.filter(r => {
    if (searchTerm && !r.date.includes(searchTerm) && !r.dayName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    const recordDate = new Date(r.date);
    const today = new Date();
    if (filter === 'today') return r.date === todayStr;
    if (filter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      return recordDate >= oneWeekAgo;
    }
    if (filter === 'month') {
      return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (!user) return;
    const usersList = [user];
    if (type === 'csv') exportAttendanceToCSV(filteredRecords, usersList, `${user.name.toLowerCase().replace(/\s+/g, '_')}_attendance.csv`);
    if (type === 'excel') exportAttendanceToExcel(filteredRecords, usersList, `${user.name.toLowerCase().replace(/\s+/g, '_')}_attendance.xlsx`);
    if (type === 'pdf') exportAttendanceToPDF(filteredRecords, usersList, `${user.name}'s Attendance Log`, `${user.name.toLowerCase().replace(/\s+/g, '_')}_attendance.pdf`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Attendance History</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Attendance Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal attendance log with exact timestamps, break durations, and overtime records.
          </p>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 border border-emerald-200 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-xs font-bold text-brand-700 border border-brand-200 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Logged</span>
          <div className="text-2xl font-black text-slate-900 my-1">{totalDays}</div>
          <span className="text-[10px] text-slate-500">Days</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Present</span>
          <div className="text-2xl font-black text-emerald-600 my-1">{presentDays}</div>
          <span className="text-[10px] text-emerald-600">Active shifts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Late Days</span>
          <div className="text-2xl font-black text-amber-600 my-1">{lateDays}</div>
          <span className="text-[10px] text-amber-600">Grace period</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">On Leave</span>
          <div className="text-2xl font-black text-purple-600 my-1">{leaveDays}</div>
          <span className="text-[10px] text-purple-600">Authorized</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Work</span>
          <div className="text-lg font-black text-blue-700 font-mono my-1">{formatSecondsToHM(totalWorkSec)}</div>
          <span className="text-[10px] text-slate-500">Net hours</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-sm">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total Overtime</span>
          <div className="text-lg font-black text-indigo-700 font-mono my-1">{formatSecondsToHM(totalOvertimeSec)}</div>
          <span className="text-[10px] text-slate-500">&gt; 8.0h threshold</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'All Logs' : f}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by date or day..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Day</th>
                <th className="p-4">Clock In</th>
                <th className="p-4">Clock Out</th>
                <th className="p-4">Break Duration</th>
                <th className="p-4">Net Work Hours</th>
                <th className="p-4">Overtime</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    No attendance records match your filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const isLate = r.isLate || r.status === 'LATE';
                  const isLeave = r.status === 'LEAVE';
                  const isAbsent = r.status === 'ABSENT';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 whitespace-nowrap">{r.date}</td>
                      <td className="p-4 text-slate-600">{r.dayName}</td>
                      <td className="p-4 font-mono font-semibold text-emerald-600">{r.clockIn || '—'}</td>
                      <td className="p-4 font-mono font-semibold text-rose-600">{r.clockOut || '—'}</td>
                      <td className="p-4 font-mono text-amber-700 font-medium">{formatSecondsToHM(r.totalBreakSeconds)}</td>
                      <td className="p-4 font-mono font-bold text-slate-900 text-sm">{formatSecondsToHM(r.netWorkSeconds)}</td>
                      <td className="p-4 font-mono text-purple-700 font-semibold">{r.overtimeSeconds && r.overtimeSeconds > 0 ? formatSecondsToHM(r.overtimeSeconds) : '—'}</td>
                      <td className="p-4">
                        {isLeave ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            LEAVE {r.leaveType ? `(${r.leaveType})` : ''}
                          </span>
                        ) : isAbsent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ABSENT
                          </span>
                        ) : isLate ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            LATE ({r.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PRESENT
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
