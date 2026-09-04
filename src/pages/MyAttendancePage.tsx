import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, FileSpreadsheet, FileText, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { AttendanceRecord } from '../types';
import { api } from '../services/api';
import { formatSecondsToHM, exportAttendanceToCSV, exportAttendanceToExcel, exportAttendanceToPDF } from '../services/exportUtils';
import { storage } from '../services/storage';

export const MyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { workSeconds, breakUsedSeconds } = useWorkClock();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState<Date>(new Date());

  // Master 1-second interval to update live tables
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      api.getAttendanceHistory(user.id).then(setRecords);
    }
  }, [user?.id, workSeconds, breakUsedSeconds]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to get live work seconds & live break seconds for a record
  const getLiveMetrics = (r: AttendanceRecord) => {
    const isTodayOngoing = r.date === todayStr && !r.clockOutTimestamp;
    if (isTodayOngoing) {
      return {
        workSec: workSeconds,
        breakSec: breakUsedSeconds
      };
    }
    return {
      workSec: r.netWorkSeconds,
      breakSec: r.totalBreakSeconds
    };
  };

  // Statistics calculation including live ongoing work time
  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'Present').length;
  const lateDays = records.filter(r => r.status === 'Late').length;
  const absentDays = 0; // WFH active attendance

  const totalWorkSec = records.reduce((acc, r) => {
    const { workSec } = getLiveMetrics(r);
    return acc + workSec;
  }, 0);

  const avgWorkSec = totalDays > 0 ? Math.floor(totalWorkSec / totalDays) : 0;

  // Filter records
  const filteredRecords = records.filter(r => {
    if (searchTerm && !r.date.includes(searchTerm) && !r.dayName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    const recordDate = new Date(r.date);
    const today = new Date();
    if (filter === 'today') {
      return r.date === todayStr;
    }
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-1">
            <span>Present Days</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{presentDays}</div>
          <span className="text-[10px] text-emerald-400">100% On-Time Record</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-1">
            <span>Late Days</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{lateDays}</div>
          <span className="text-[10px] text-slate-400">Grace period applied</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-1">
            <span>Absent Days</span>
            <XCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-400">{absentDays}</div>
          <span className="text-[10px] text-slate-400">Zero leaves taken</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-1">
            <span>Total Work (Live)</span>
            <Award className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-extrabold text-brand-300 font-mono animate-pulse-subtle">{formatSecondsToHM(totalWorkSec)}</div>
          <span className="text-[10px] text-slate-400">Cumulative time</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-1">
            <span>Avg Work/Day</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-blue-300 font-mono">{formatSecondsToHM(avgWorkSec)}</div>
          <span className="text-[10px] text-slate-400">Target: 08h 00m</span>
        </div>
      </div>

      {/* Header Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Records' : f}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAttendanceToCSV(filteredRecords)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => exportAttendanceToExcel(filteredRecords)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => exportAttendanceToPDF(filteredRecords, user?.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-xs font-semibold text-brand-300 border border-brand-500/30"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl glass-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-xs border-b border-slate-800">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Day</th>
                <th className="p-4">Clock In</th>
                <th className="p-4">Clock Out</th>
                <th className="p-4">Break Time</th>
                <th className="p-4">Work Hours (Live)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No attendance records found for this view.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const { workSec, breakSec } = getLiveMetrics(r);
                  const isOngoing = r.date === todayStr && !r.clockOutTimestamp;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold text-white">{r.date}</td>
                      <td className="p-4 text-slate-300">{r.dayName}</td>
                      <td className="p-4 font-mono font-semibold text-emerald-400">{r.clockIn}</td>
                      <td className="p-4 font-mono font-semibold text-rose-400">{r.clockOut || '---'}</td>
                      <td className="p-4 font-mono text-amber-300">{formatSecondsToHM(breakSec)}</td>
                      <td className="p-4 font-mono font-bold text-brand-300">
                        {formatSecondsToHM(workSec)}
                        {isOngoing && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 ml-1.5 animate-ping"></span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          r.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.status}
                        </span>
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
