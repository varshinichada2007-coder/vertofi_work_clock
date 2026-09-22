import React, { useState, useEffect } from 'react';
import {
  CalendarRange, ChevronLeft, ChevronRight, Download, Search,
  Eye, CheckCircle2, Clock, Coffee, TrendingUp, AlertTriangle,
  FileSpreadsheet, Sparkles, Building2, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';

export const AdminTimesheetsPage: React.FC = () => {
  const { organization } = useAuth();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(8); // 8 = September (0-indexed)
  const [summaryData, setSummaryData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeSummary, setSelectedEmployeeSummary] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchTimesheetData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMonthAttendanceSummary(currentYear, currentMonthIndex, organization?.id);
      setSummaryData(data);
    } catch (e) {
      console.error('Error fetching month timesheets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheetData();
  }, [currentYear, currentMonthIndex, organization?.id]);

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

  const filteredSummaries = summaryData?.employeeSummaries?.filter((e: any) => {
    return e.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee.department.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Timesheets</h2>
          <p className="text-xs text-slate-500">Aggregated attendance summary, present days, work hours &amp; overtime</p>
        </div>

        {/* Month Selector Controls */}
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

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by employee name, ID or department..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-600 transition-colors shadow-2xs"
        />
      </div>

      {/* Main Aggregated Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-3 py-2.5 text-center">Present</th>
                <th className="px-3 py-2.5 text-center">Absent</th>
                <th className="px-3 py-2.5 text-center">Late</th>
                <th className="px-3 py-2.5 text-center">Leave</th>
                <th className="px-3 py-2.5 text-right">Work Hours</th>
                <th className="px-3 py-2.5 text-right">Overtime</th>
                <th className="px-3 py-2.5 text-right">Net Work Time</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No records found for {monthNames[currentMonthIndex]} {currentYear}.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item: any) => (
                  <tr
                    key={item.employee.id}
                    onClick={() => {
                      setSelectedEmployeeSummary(item);
                      setIsDetailModalOpen(true);
                    }}
                    className="hover:bg-slate-50/75 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {item.employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.employee.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.employee.employeeId} • {item.employee.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        {item.presentDays} d
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-[11px]">
                        {item.absentDays} d
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[11px]">
                        {item.lateDays}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px]">
                        {item.leaveDays} d
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      {item.totalWorkHours}h
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-purple-700 font-semibold">
                      {item.totalOvertimeHours > 0 ? `${item.totalOvertimeHours}h` : '—'}
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-brand-700">
                      {formatShortHM(item.totalWorkSeconds)}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeSummary(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Bottom Month Summary Footer */}
            {summaryData && (
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-700 text-xs">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    Total ({monthNames[currentMonthIndex]} {currentYear})
                  </td>
                  <td className="px-3 py-3 text-center text-emerald-700 font-mono">
                    {summaryData.totalPresentSum} Days
                  </td>
                  <td className="px-3 py-3 text-center text-rose-700 font-mono">
                    {summaryData.totalAbsentSum} Days
                  </td>
                  <td className="px-3 py-3 text-center text-amber-700 font-mono">
                    {summaryData.totalLateSum}
                  </td>
                  <td className="px-3 py-3 text-center text-purple-700 font-mono">
                    {summaryData.totalLeaveSum} Days
                  </td>
                  <td className="px-3 py-3 text-right text-slate-900 font-mono font-bold">
                    {summaryData.totalWorkHoursSum}h
                  </td>
                  <td className="px-3 py-3 text-right text-purple-700 font-mono font-bold">
                    {summaryData.totalOvertimeHoursSum}h
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-brand-700 font-mono">
                    {formatShortHM(summaryData.employeeSummaries?.reduce((acc: number, e: any) => acc + (e.totalWorkSeconds || 0), 0))}
                  </td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Drill-Down Breakdown Modal for Selected Employee */}
      {selectedEmployeeSummary && (
        <EmployeeDetailModal
          member={{
            user: selectedEmployeeSummary.employee,
            currentStatus: 'NOT_CLOCKED_IN',
            totalBreakSecondsToday: selectedEmployeeSummary.totalBreakSeconds,
            remainingBreakSecondsToday: 3600,
            totalWorkSecondsToday: selectedEmployeeSummary.totalWorkSeconds,
            overtimeSecondsToday: selectedEmployeeSummary.totalOvertimeSeconds,
            lastActive: 'Active'
          }}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};
