import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { BarChart3, Download, FileSpreadsheet, FileText, Users, Clock, CheckCircle2, Coffee, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { exportAttendanceToCSV, exportAttendanceToExcel, exportAttendanceToPDF } from '../services/exportUtils';
import { storage } from '../services/storage';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.getReportsSummary().then(setSummary);
    const interval = setInterval(() => {
      api.getReportsSummary().then(setSummary);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const dailyWorkData = summary?.dailyWorkData || [];
  const breakDistributionData = summary?.breakDistributionData || [];
  const monthlyTrendData = summary?.monthlyTrendData || [];

  const hasAnyDailyWork = dailyWorkData.some((d: any) => d.workHours > 0 || d.breakMins > 0);
  const hasAnyBreakData = breakDistributionData.length > 0;
  const hasAnyMonthlyData = monthlyTrendData.some((d: any) => d.attendancePct > 0 || d.avgHours > 0);

  const handleExportAll = (type: 'csv' | 'excel' | 'pdf') => {
    const allRecords = storage.getAttendanceRecords();
    if (type === 'csv') exportAttendanceToCSV(allRecords, 'vertofi_company_reports.csv');
    if (type === 'excel') exportAttendanceToExcel(allRecords, 'vertofi_company_reports.xlsx');
    if (type === 'pdf') exportAttendanceToPDF(allRecords, 'Company Overview', 'vertofi_company_reports.pdf');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" /> Executive Analytics & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Productivity breakdown, attendance metrics & break trends</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportAll('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleExportAll('excel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExportAll('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-xs font-semibold text-brand-300 border border-brand-500/30"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Employees</span>
          <div className="text-2xl font-black text-white mt-1">{summary?.totalEmployees ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Present Today</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{summary?.presentToday ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Currently Working</span>
          <div className="text-2xl font-black text-brand-400 mt-1">{summary?.workingCount ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">On Break</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{summary?.breakCount ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Attendance %</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{summary?.attendancePercentage ?? '0%'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-card">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Work Hours</span>
          <div className="text-2xl font-black text-blue-300 font-mono mt-1">{summary?.averageWorkingHours ?? '00h 00m'}</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Work Hours Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Daily Work Hours (This Week)
            </h3>
            <span className="text-xs text-slate-400">Target: 8.0 hrs</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!hasAnyDailyWork ? (
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
                <Clock className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">No daily work hours recorded yet</p>
                <p className="text-[11px] text-slate-500">Data will populate automatically once employees clock in.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyWorkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val} hrs`, 'Work Hours']}
                  />
                  <Bar dataKey="workHours" fill="#0c8ee9" radius={[8, 8, 0, 0]} name="Work Hours" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Break Duration Distribution Pie Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" /> Break Type Distribution
            </h3>
            <span className="text-xs text-slate-400">Percentage share</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!hasAnyBreakData ? (
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
                <Coffee className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">No break records logged yet</p>
                <p className="text-[11px] text-slate-500">Break categories and intervals will appear once taken.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {breakDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val}%`, 'Share']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Attendance & Work Trend Line Chart */}
        <div className="col-span-full p-6 rounded-3xl bg-slate-900/80 border border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Monthly Productivity & Attendance Trend
            </h3>
            <span className="text-xs text-slate-400">Last 5 Months</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!hasAnyMonthlyData ? (
              <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
                <TrendingUp className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">No historical attendance data yet</p>
                <p className="text-[11px] text-slate-500">Monthly attendance rates will update over time.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Line type="monotone" dataKey="attendancePct" stroke="#10b981" strokeWidth={3} name="Attendance Rate %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
