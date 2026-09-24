import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Filter, Download, CheckCircle2, Clock,
  AlertTriangle, Coffee, ArrowUpDown, Eye, ShieldAlert, Sparkles,
  Building2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabaseDb } from '../services/supabaseDb';
import { storage } from '../services/storage';
import { AttendanceRecord, User } from '../types';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';

export const AdminAttendancePage: React.FC = () => {
  const { organization } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      return storage.getAttendanceRecords(organization?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [];
    }
  });
  const [employees, setEmployees] = useState<User[]>(() => {
    try {
      return storage.getUsers(organization?.id);
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [allRecords, allEmps] = await Promise.all([
        api.getAllAttendanceRecords(organization?.id),
        api.getEmployees(organization?.id)
      ]);
      setRecords(allRecords);
      setEmployees(allEmps);
    } catch (e) {
      console.error('Error fetching attendance records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    const subAtt = supabaseDb.subscribeToTableChanges('attendance_records', () => {
      fetchData();
    });
    return () => {
      clearInterval(interval);
      subAtt?.unsubscribe?.();
    };
  }, [organization?.id]);

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    const emp = employees.find(e => e.id === r.userId || e.employeeId === r.userId);
    const empName = emp?.name || 'Unknown';
    const empId = emp?.employeeId || '';
    const dept = emp?.department || '';

    const matchSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter || (statusFilter === 'LATE' && r.isLate);
    const matchDept = departmentFilter === 'ALL' || dept === departmentFilter;
    const matchDate = !dateFilter || r.date === dateFilter;

    return matchSearch && matchStatus && matchDept && matchDate;
  });

  const formatShortHM = (sec?: number) => {
    if (!sec) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>{organization?.name} • Unified Attendance Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            All Employee Attendance Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical day-by-day attendance punches, late durations, break times, and status flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500 shadow-sm"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-brand-600 hover:text-brand-700 font-bold px-2 py-1"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-all"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
        >
          <option value="ALL">All Attendance Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="WORKING">Currently Working</option>
          <option value="ON_BREAK">On Break</option>
          <option value="LEAVE">On Leave</option>
          <option value="ABSENT">Absent</option>
        </select>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Clock In</th>
                <th className="px-4 py-3.5">Clock Out</th>
                <th className="px-4 py-3.5">Net Work</th>
                <th className="px-4 py-3.5">Break Duration</th>
                <th className="px-4 py-3.5">Overtime</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    No attendance records match your search or filter parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const emp = employees.find(e => e.id === r.userId || e.employeeId === r.userId);
                  const isLate = r.isLate || r.status === 'LATE';
                  const isLeave = r.status === 'LEAVE';
                  const isAbsent = r.status === 'ABSENT';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (emp) {
                          setSelectedMember({
                            user: emp,
                            attendanceToday: r,
                            currentStatus: 'NOT_CLOCKED_IN',
                            totalBreakSecondsToday: r.totalBreakSeconds,
                            remainingBreakSecondsToday: 3600,
                            totalWorkSecondsToday: r.netWorkSeconds,
                            overtimeSecondsToday: r.overtimeSeconds,
                            lastActive: 'Active'
                          });
                          setIsDetailModalOpen(true);
                        }
                      }}
                    >
                      <td className="px-5 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <div>{r.date}</div>
                        <div className="text-[10px] text-slate-500">{r.dayName}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {(emp?.name || r.userId).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                              {emp?.name || r.userId}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{emp?.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {emp?.department || '—'}
                      </td>

                      <td className="px-4 py-4">
                        {isLeave ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            LEAVE {r.leaveType ? `(${r.leaveType})` : ''}
                          </span>
                        ) : isAbsent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ABSENT
                          </span>
                        ) : isLate ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            LATE ({r.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PRESENT
                          </span>
                        )}

                        {r.isCorrected && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Corrected
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-800">
                        {r.clockIn || '—'}
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-800">
                        {r.clockOut || '—'}
                      </td>

                      <td className="px-4 py-4 font-bold text-emerald-600">
                        {formatShortHM(r.netWorkSeconds)}
                      </td>

                      <td className="px-4 py-4 text-amber-600 font-medium">
                        {formatShortHM(r.totalBreakSeconds)}
                      </td>

                      <td className="px-4 py-4 text-purple-600 font-medium">
                        {r.overtimeSeconds && r.overtimeSeconds > 0 ? formatShortHM(r.overtimeSeconds) : '—'}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (emp) {
                              setSelectedMember({
                                user: emp,
                                attendanceToday: r,
                                currentStatus: 'NOT_CLOCKED_IN',
                                totalBreakSecondsToday: r.totalBreakSeconds,
                                remainingBreakSecondsToday: 3600,
                                totalWorkSecondsToday: r.netWorkSeconds,
                                overtimeSecondsToday: r.overtimeSeconds,
                                lastActive: 'Active'
                              });
                              setIsDetailModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-700 text-xs font-bold transition-all"
                        >
                          View
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

      {selectedMember && (
        <EmployeeDetailModal
          member={selectedMember}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

