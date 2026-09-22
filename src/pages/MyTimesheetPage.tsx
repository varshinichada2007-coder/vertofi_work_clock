import React, { useState, useEffect } from 'react';
import {
  CalendarRange, ChevronLeft, ChevronRight, Download, Search,
  CheckCircle2, Clock, Coffee, TrendingUp, AlertTriangle,
  FileSpreadsheet, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AttendanceRecord } from '../types';

export const MyTimesheetPage: React.FC = () => {
  const { user, organization } = useAuth();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(8); // 8 = September
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchMyTimesheet = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const all = await api.getAttendanceHistory(user.id, organization?.id);
      const filtered = all.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMonthRecords(filtered);
    } catch (e) {
      console.error('Error fetching employee timesheet:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTimesheet();
  }, [user?.id, currentYear, currentMonthIndex, organization?.id]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const formatShortHM = (sec?: number) => {
    if (!sec) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Month Statistics Calculations
  const presentDays = monthRecords.filter(r => r.status === 'PRESENT' || r.status === 'WORKING' || r.status === 'ON_BREAK' || r.status === 'COMPLETED').length;
  const lateDays = monthRecords.filter(r => r.isLate || r.status === 'LATE').length;
  const absentDays = monthRecords.filter(r => r.status === 'ABSENT').length;
  const leaveDays = monthRecords.filter(r => r.status === 'LEAVE').length;

  const totalWorkSec = monthRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
  const totalBreakSec = monthRecords.reduce((acc, r) => acc + (r.totalBreakSeconds || 0), 0);
  const totalOvertimeSec = monthRecords.reduce((acc, r) => acc + (r.overtimeSeconds || 0), 0);

  const totalWorkHours = Math.round((totalWorkSec / 3600) * 10) / 10;
  const totalOvertimeHours = Math.round((totalOvertimeSec / 3600) * 10) / 10;

  const attendancePct = Math.min(100, Math.round(((presentDays + lateDays) / Math.max(1, presentDays + lateDays + absentDays + leaveDays)) * 100));

  const filteredRecords = monthRecords.filter(r => {
    return r.date.includes(searchQuery) ||
      r.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.initialTask || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl mx-auto">
      {/* Top Header & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Monthly Timesheet</h2>
          <p className="text-xs text-slate-500">Breakdown of daily clock stamps, break allocations, and worked hours</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/90 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs font-bold text-slate-900">
            {monthNames[currentMonthIndex]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">Present Days</span>
          <div className="text-xl font-bold text-emerald-600">{presentDays}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">Late Days</span>
          <div className="text-xl font-bold text-amber-600">{lateDays}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">On Leave</span>
          <div className="text-xl font-bold text-purple-600">{leaveDays}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Work</span>
          <div className="text-xl font-bold text-slate-900 font-mono">{totalWorkHours}h</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Overtime</span>
          <div className="text-xl font-bold text-purple-600 font-mono">{totalOvertimeHours}h</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500 block">Attendance Rate</span>
          <div className="text-xl font-bold text-brand-700">{attendancePct}%</div>
        </div>
      </div>

      {/* Table of Monthly Rows */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by date or day..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-600 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-3 py-2.5">Day</th>
                <th className="px-3 py-2.5">Clock In</th>
                <th className="px-3 py-2.5">Clock Out</th>
                <th className="px-3 py-2.5">Break</th>
                <th className="px-3 py-2.5">Worked</th>
                <th className="px-3 py-2.5">Overtime</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No attendance records for {monthNames[currentMonthIndex]} {currentYear}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isLate = r.isLate || r.status === 'LATE';
                  const isLeave = r.status === 'LEAVE';
                  const isAbsent = r.status === 'ABSENT';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {r.date}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {r.dayName}
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-700">
                        {r.clockIn || '—'}
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-700">
                        {r.clockOut || '—'}
                      </td>

                      <td className="px-3 py-3 text-slate-500 font-mono">
                        {formatShortHM(r.totalBreakSeconds)}
                      </td>

                      <td className="px-3 py-3 font-bold text-slate-900 font-mono">
                        {formatShortHM(r.netWorkSeconds)}
                      </td>

                      <td className="px-3 py-3 text-purple-700 font-semibold font-mono">
                        {r.overtimeSeconds && r.overtimeSeconds > 0 ? formatShortHM(r.overtimeSeconds) : '—'}
                      </td>

                      <td className="px-3 py-3">
                        {isLeave ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Leave
                          </span>
                        ) : isAbsent ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Absent
                          </span>
                        ) : isLate ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Late ({r.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Present
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
