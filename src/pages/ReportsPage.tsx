import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  BarChart3, Download, FileSpreadsheet, FileText, Users, Clock,
  CheckCircle2, Coffee, TrendingUp, Calendar, Filter, User as UserIcon,
  Timer, Activity, ShieldCheck, Check, Search, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { exportAttendanceToCSV, exportAttendanceToExcel, exportAttendanceToPDF } from '../services/exportUtils';
import { User, AttendanceRecord } from '../types';

export const ReportsPage: React.FC = () => {
  const { organization } = useAuth();
  const { addToast } = useWorkClock();
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY' | 'EMPLOYEE'>('DAILY');
  const [employees, setEmployees] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [allEmps, allRecords] = await Promise.all([
        api.getEmployees(organization?.id),
        api.getAllAttendanceRecords(organization?.id)
      ]);
      setEmployees(allEmps);
      setRecords(allRecords);
    } catch (e) {
      console.error('Error fetching reports data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [organization?.id]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  }, [employees]);

  // Active matching employees
  const activeEmployees = useMemo(() => {
    return employees.filter(e => {
      if (e.role === 'ADMIN') return false;
      if (selectedDepartment !== 'ALL' && e.department !== selectedDepartment) return false;
      if (reportType === 'EMPLOYEE' && selectedEmployeeId !== 'ALL' && e.id !== selectedEmployeeId && e.employeeId !== selectedEmployeeId) return false;
      return true;
    });
  }, [employees, selectedDepartment, selectedEmployeeId, reportType]);

  // Reactive filtered dataset based on active category & filters
  const filteredDataset = useMemo((): AttendanceRecord[] => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.userId || e.employeeId === r.userId);
      const d = new Date(r.date);

      const matchDept = selectedDepartment === 'ALL' || emp?.department === selectedDepartment;
      const matchEmp = selectedEmployeeId === 'ALL' || r.userId === selectedEmployeeId || emp?.id === selectedEmployeeId || emp?.employeeId === selectedEmployeeId;

      if (reportType === 'DAILY') {
        const matchDate = r.date === selectedDate;
        return matchDate && matchDept && (selectedEmployeeId === 'ALL' || matchEmp);
      } else if (reportType === 'MONTHLY') {
        const matchMonth = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        return matchMonth && matchDept && matchEmp;
      } else {
        // Individual Employee
        const matchMonth = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        return matchMonth && matchDept && matchEmp;
      }
    });
  }, [records, employees, reportType, selectedDate, selectedDepartment, selectedEmployeeId, selectedMonth, selectedYear]);

  // Reactive Metrics calculations
  const metrics = useMemo(() => {
    const totalWorkSec = filteredDataset.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
    const totalOvertimeSec = filteredDataset.reduce((acc, r) => acc + (r.overtimeSeconds || 0), 0);
    const totalBreakSec = filteredDataset.reduce((acc, r) => acc + (r.totalBreakSeconds || 0), 0);

    const presentCount = filteredDataset.filter(r => r.status === 'PRESENT' || r.status === 'WORKING' || r.status === 'ON_BREAK' || r.status === 'COMPLETED').length;
    const lateCount = filteredDataset.filter(r => r.isLate || r.status === 'LATE').length;
    const absentCount = filteredDataset.filter(r => r.status === 'ABSENT').length;
    const leaveCount = filteredDataset.filter(r => r.status === 'LEAVE').length;

    const totalHours = Math.round((totalWorkSec / 3600) * 10) / 10;
    const totalOvertimeHours = Math.round((totalOvertimeSec / 3600) * 10) / 10;
    const totalBreakHours = Math.round((totalBreakSec / 3600) * 10) / 10;

    const denominator = Math.max(1, presentCount + lateCount + absentCount + leaveCount);
    const attendancePct = Math.min(100, Math.round(((presentCount + lateCount) / denominator) * 100));

    return {
      totalHours,
      totalOvertimeHours,
      totalBreakHours,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      attendancePct,
      recordCount: filteredDataset.length
    };
  }, [filteredDataset]);

  // Format Helper
  const formatShortHM = (sec?: number) => {
    if (!sec) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // ─────────────────────────────────────────────────────────────
  // ── DYNAMIC GRAPH DATA COMPUTATIONS
  // ─────────────────────────────────────────────────────────────

  // 1. Daily Mode Graphs
  const dailyGraphData = useMemo(() => {
    if (reportType !== 'DAILY') return { employeeBars: [], statusBreakdown: [] };

    const employeeBars = activeEmployees.map(emp => {
      const record = records.find(r => (r.userId === emp.id || r.userId === emp.employeeId) && r.date === selectedDate);
      const workHours = record ? Math.round(((record.netWorkSeconds || 0) / 3600) * 10) / 10 : 0;
      const breakMins = record ? Math.round(((record.totalBreakSeconds || 0) / 60)) : 0;
      const overtimeHours = record ? Math.round(((record.overtimeSeconds || 0) / 3600) * 10) / 10 : 0;

      return {
        name: emp.name.split(' ')[0],
        fullName: emp.name,
        department: emp.department,
        workHours,
        breakMins,
        overtimeHours,
        status: record ? record.status : 'ABSENT',
        target: 8.0
      };
    });

    const statusBreakdown = [
      { name: 'Present', value: metrics.presentCount, color: '#10b981' },
      { name: 'Late Arrivals', value: metrics.lateCount, color: '#f59e0b' },
      { name: 'On Leave', value: metrics.leaveCount, color: '#8b5cf6' },
      { name: 'Absent / Off', value: Math.max(0, activeEmployees.length - (metrics.presentCount + metrics.leaveCount)), color: '#f43f5e' }
    ].filter(item => item.value > 0);

    return { employeeBars, statusBreakdown };
  }, [reportType, activeEmployees, records, selectedDate, metrics]);

  // 2. Monthly Mode Graphs
  const monthlyGraphData = useMemo(() => {
    if (reportType !== 'MONTHLY') return { dailyTrend: [], employeeDistribution: [] };

    // Daily distribution throughout the selected month
    const daysMap = new Map<string, { totalWorkSec: number; totalOvertimeSec: number; count: number; dateStr: string; dayNum: number }>();
    filteredDataset.forEach(r => {
      const d = new Date(r.date);
      const dayNum = d.getDate();
      const existing = daysMap.get(r.date) || { totalWorkSec: 0, totalOvertimeSec: 0, count: 0, dateStr: r.date, dayNum };
      existing.totalWorkSec += (r.netWorkSeconds || 0);
      existing.totalOvertimeSec += (r.overtimeSeconds || 0);
      existing.count += 1;
      daysMap.set(r.date, existing);
    });

    const dailyTrend = Array.from(daysMap.values())
      .sort((a, b) => a.dayNum - b.dayNum)
      .map(item => ({
        day: `${item.dayNum} ${monthNames[selectedMonth].slice(0, 3)}`,
        workHours: Math.round((item.totalWorkSec / 3600) * 10) / 10,
        avgHours: item.count > 0 ? Math.round((item.totalWorkSec / item.count / 3600) * 10) / 10 : 0,
        overtimeHours: Math.round((item.totalOvertimeSec / 3600) * 10) / 10,
        target: 8.0
      }));

    // Employee aggregated hours in the month
    const employeeDistribution = activeEmployees.map(emp => {
      const empRecords = filteredDataset.filter(r => r.userId === emp.id || r.userId === emp.employeeId);
      const totalEmpWorkSec = empRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
      const totalEmpOvertimeSec = empRecords.reduce((acc, r) => acc + (r.overtimeSeconds || 0), 0);

      return {
        name: emp.name.split(' ')[0],
        fullName: emp.name,
        department: emp.department,
        totalHours: Math.round((totalEmpWorkSec / 3600) * 10) / 10,
        overtimeHours: Math.round((totalEmpOvertimeSec / 3600) * 10) / 10,
        presentDays: empRecords.filter(r => r.status === 'PRESENT' || r.status === 'COMPLETED' || r.status === 'WORKING').length
      };
    });

    return { dailyTrend, employeeDistribution };
  }, [reportType, filteredDataset, activeEmployees, selectedMonth, monthNames]);

  // 3. Employee Mode Graphs
  const employeeGraphData = useMemo(() => {
    if (reportType !== 'EMPLOYEE') return { dailyRecords: [], summaryComparison: [] };

    const targetEmp = employees.find(e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId) || activeEmployees[0];

    const empRecords = filteredDataset
      .filter(r => !targetEmp || r.userId === targetEmp.id || r.userId === targetEmp.employeeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dailyRecords = empRecords.map(r => {
      const d = new Date(r.date);
      const workH = Math.round(((r.netWorkSeconds || 0) / 3600) * 10) / 10;
      const breakM = Math.round(((r.totalBreakSeconds || 0) / 60));
      const otH = Math.round(((r.overtimeSeconds || 0) / 3600) * 10) / 10;

      return {
        date: `${d.getDate()} ${monthNames[selectedMonth].slice(0, 3)}`,
        dayName: r.dayName || d.toLocaleDateString('en-US', { weekday: 'short' }),
        workHours: workH,
        breakMins: breakM,
        overtimeHours: otH,
        status: r.status,
        target: 8.0
      };
    });

    const summaryComparison = [
      { category: 'Total Productive Hours', hours: metrics.totalHours, fill: '#0284c7' },
      { category: 'Overtime Hours', hours: metrics.totalOvertimeHours, fill: '#a855f7' },
      { category: 'Break Duration (Hrs)', hours: metrics.totalBreakHours, fill: '#f59e0b' }
    ];

    return { dailyRecords, summaryComparison, targetEmp };
  }, [reportType, selectedEmployeeId, employees, activeEmployees, filteredDataset, selectedMonth, monthNames, metrics]);

  // Export Trigger
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const dataset = filteredDataset;
    const prefix = `vertofi_${reportType.toLowerCase()}_report_${selectedYear}_${monthNames[selectedMonth].toLowerCase()}`;

    if (format === 'csv') {
      exportAttendanceToCSV(dataset, employees, `${prefix}.csv`);
      addToast('Export Complete', 'CSV report downloaded successfully.', 'success');
    } else if (format === 'excel') {
      exportAttendanceToExcel(dataset, employees, `${prefix}.xlsx`);
      addToast('Export Complete', 'Excel spreadsheet downloaded successfully.', 'success');
    } else if (format === 'pdf') {
      exportAttendanceToPDF(
        dataset,
        employees,
        `${organization?.name || 'Vertofi'} — ${reportType} Attendance Report (${monthNames[selectedMonth]} ${selectedYear})`,
        `${prefix}.pdf`
      );
      addToast('Export Complete', 'PDF document generated and downloaded.', 'success');
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-150">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-0.5">
            <BarChart3 className="w-4 h-4" />
            <span>{organization?.name || 'Vertofi'} • Analytics &amp; Reporting Suite</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance &amp; Productivity Reports
          </h1>
          <p className="text-xs text-slate-500">
            Generate, analyze, and export real-time attendance, overtime, and work shifts by day, month, or staff member.
          </p>
        </div>

        {/* Multi-Format Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-xs font-semibold text-brand-700 border border-brand-200 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Switcher & Dynamic Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
          {[
            { id: 'DAILY', label: '1. Daily Attendance Report' },
            { id: 'MONTHLY', label: '2. Monthly Attendance Report' },
            { id: 'EMPLOYEE', label: '3. Individual Employee Report' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === tab.id
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reportType === 'DAILY' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Department Filter
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {reportType === 'EMPLOYEE' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Specific Employee
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium cursor-pointer"
              >
                <option value="ALL">All Staff Members</option>
                {employees.filter(e => e.role !== 'ADMIN').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Employee Filter (Optional)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 font-medium cursor-pointer"
              >
                <option value="ALL">All Employees</option>
                {employees.filter(e => e.role !== 'ADMIN').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Reactive KPI Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Logged Hours</span>
            <Timer className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.totalHours}h</div>
          <div className="text-[11px] text-slate-400">
            {reportType === 'DAILY' ? `On ${selectedDate}` : `In ${monthNames[selectedMonth]} ${selectedYear}`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Overtime</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 font-mono">{metrics.totalOvertimeHours}h</div>
          <div className="text-[11px] text-purple-600 font-medium">Extra hours beyond standard 8h</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Present / Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics.presentCount} <span className="text-xs font-normal text-slate-400">({metrics.attendancePct}%)</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">{metrics.lateCount} late arrivals recorded</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Filtered Staff / Records</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.recordCount} logs</div>
          <div className="text-[11px] text-slate-400">{activeEmployees.length} matching employee(s)</div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── DYNAMIC ANALYTICS CHARTS BASED ON CATEGORY ─────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. DAILY ATTENDANCE REPORT CHARTS */}
      {reportType === 'DAILY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Employee Work Hours Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" /> Employee Work Hours on {selectedDate}
                </h3>
                <p className="text-[11px] text-slate-500">Daily logged productive hours vs standard 8.0h target</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium text-[11px]">
                Target: 8.0h
              </span>
            </div>

            <div className="h-64 w-full">
              {dailyGraphData.employeeBars.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No employee attendance records for {selectedDate}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyGraphData.employeeBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any) => [`${val} hrs`, 'Work Hours']}
                    />
                    <ReferenceLine y={8.0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '8h Target', position: 'top', fill: '#64748b', fontSize: 10 }} />
                    <Bar dataKey="workHours" fill="#0284c7" radius={[6, 6, 0, 0]} name="Work Hours" maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Selected Date: <strong className="text-slate-900">{selectedDate}</strong></span>
              <span className="text-brand-700 font-semibold">● Dynamic Live Sync</span>
            </div>
          </div>

          {/* Daily Status & Presence Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Attendance Status Distribution ({selectedDate})
                </h3>
                <p className="text-[11px] text-slate-500">Breakdown of Present, Late, Leave &amp; Off</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {dailyGraphData.statusBreakdown.length === 0 ? (
                <div className="text-slate-400 text-xs">No status data available for {selectedDate}.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dailyGraphData.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {dailyGraphData.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-xs">
              <span className="text-emerald-700 font-semibold">{metrics.presentCount} Present</span>
              <span className="text-amber-700 font-semibold">{metrics.lateCount} Late</span>
              <span className="text-purple-700 font-semibold">{metrics.leaveCount} Leave</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. MONTHLY ATTENDANCE REPORT CHARTS */}
      {reportType === 'MONTHLY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Daily Work Hours Trend */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" /> Daily Working Hours in {monthNames[selectedMonth]} {selectedYear}
                </h3>
                <p className="text-[11px] text-slate-500">Day-by-day logged hours across all matching employees</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono font-bold text-[11px] border border-brand-200">
                Total: {metrics.totalHours}h
              </span>
            </div>

            <div className="h-64 w-full">
              {monthlyGraphData.dailyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No attendance records logged for {monthNames[selectedMonth]} {selectedYear}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyGraphData.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="workHours" fill="#0284c7" radius={[4, 4, 0, 0]} name="Logged Work Hours" maxBarSize={28} />
                    <Bar dataKey="overtimeHours" fill="#a855f7" radius={[4, 4, 0, 0]} name="Overtime Hours" maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Month: <strong className="text-slate-900">{monthNames[selectedMonth]} {selectedYear}</strong></span>
              <span className="text-brand-700 font-semibold">● Reactively Computed</span>
            </div>
          </div>

          {/* Monthly Employee Work Hours Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Monthly Work Hours by Employee
                </h3>
                <p className="text-[11px] text-slate-500">Total productive hours &amp; overtime in {monthNames[selectedMonth]}</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {monthlyGraphData.employeeDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No employee records found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyGraphData.employeeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="totalHours" fill="#10b981" radius={[4, 4, 0, 0]} name="Work Hours" maxBarSize={32} />
                    <Bar dataKey="overtimeHours" fill="#a855f7" radius={[4, 4, 0, 0]} name="Overtime" maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Department: <strong className="text-slate-900">{selectedDepartment}</strong></span>
              <span>{activeEmployees.length} Staff</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. INDIVIDUAL EMPLOYEE REPORT CHARTS */}
      {reportType === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Individual Daily Hours Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  {employeeGraphData.targetEmp ? `${employeeGraphData.targetEmp.name}'s Daily Hours` : 'Individual Work Hours'}
                </h3>
                <p className="text-[11px] text-slate-500">Daily worked hours in {monthNames[selectedMonth]} {selectedYear}</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono font-bold text-[11px] border border-brand-200">
                Avg: {metrics.totalHours > 0 && employeeGraphData.dailyRecords.length > 0 ? Math.round((metrics.totalHours / employeeGraphData.dailyRecords.length) * 10) / 10 : 8}h / day
              </span>
            </div>

            <div className="h-64 w-full">
              {employeeGraphData.dailyRecords.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No attendance records logged for this employee in {monthNames[selectedMonth]} {selectedYear}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeGraphData.dailyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                    <ReferenceLine y={8.0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '8h Target', position: 'top', fill: '#64748b', fontSize: 10 }} />
                    <Bar dataKey="workHours" fill="#0284c7" radius={[4, 4, 0, 0]} name="Work Hours" maxBarSize={28} />
                    <Bar dataKey="overtimeHours" fill="#a855f7" radius={[4, 4, 0, 0]} name="Overtime" maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Employee: <strong className="text-slate-900">{employeeGraphData.targetEmp?.name || 'Staff Member'}</strong></span>
              <span className="text-emerald-700 font-semibold">{employeeGraphData.dailyRecords.length} Shifts Logged</span>
            </div>
          </div>

          {/* Time Distribution & Break Allocation Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Work, Break &amp; Overtime Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">Aggregated duration allocation for the selected period</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeGraphData.summaryComparison} margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} name="Duration (Hours)" maxBarSize={48}>
                    {employeeGraphData.summaryComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Net Productive: <strong className="text-slate-900">{metrics.totalHours}h</strong></span>
              <span className="text-purple-700 font-semibold">{metrics.totalOvertimeHours}h Overtime</span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── FILTERED DATASET RECORD TABLE PREVIEW ──────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-xs text-slate-900">
              Filtered Records ({filteredDataset.length} Entries)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {reportType} • {monthNames[selectedMonth]} {selectedYear}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-3 py-2.5">Employee</th>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">Clock In</th>
                <th className="px-3 py-2.5">Clock Out</th>
                <th className="px-3 py-2.5">Break</th>
                <th className="px-3 py-2.5 text-right">Net Work</th>
                <th className="px-3 py-2.5 text-right">Overtime</th>
                <th className="px-3 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDataset.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No matching attendance records found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDataset.slice(0, 15).map((r) => {
                  const emp = employees.find(e => e.id === r.userId || e.employeeId === r.userId);
                  const isLate = r.isLate || r.status === 'LATE';
                  const isLeave = r.status === 'LEAVE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">
                        {r.date}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {emp?.name || r.userId}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {emp?.department || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {r.clockIn || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {r.clockOut || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">
                        {formatShortHM(r.totalBreakSeconds)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatShortHM(r.netWorkSeconds)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-purple-700 font-semibold">
                        {r.overtimeSeconds && r.overtimeSeconds > 0 ? formatShortHM(r.overtimeSeconds) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isLeave ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Leave
                          </span>
                        ) : isLate ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Late ({r.lateMinutes || 0}m)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.status || 'Present'}
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

