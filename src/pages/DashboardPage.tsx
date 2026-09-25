import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import {
  Users, UserCheck, Clock, Coffee, ShieldAlert, Timer, ArrowUpRight,
  CheckCircle2, AlertTriangle, Play, Square, FileText,
  Calendar, RefreshCw, ChevronRight, Activity, TrendingUp, Search, Filter,
  Building2, ArrowRight, Check, XCircle, Briefcase, Plus, Flag, Sparkles,
  Send, AlertCircle, BarChart3, Mail, Phone, MapPin, Edit3, User, UserCircle,
  Award, Zap, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { supabaseDb } from '../services/supabaseDb';
import {
  TeamMemberStatus, LeaveRequest, AttendanceCorrectionRequest,
  AssignedTask, TaskPriority, TaskStatus, AttendanceRecord
} from '../types';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';
import { AssignWorkModal } from '../components/modals/AssignWorkModal';

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, role, organization } = useAuth();
  const {
    currentTimeFormatted,
    currentDateFormatted,
    clockState,
    workSeconds,
    breakSeconds,
    breakUsedSeconds,
    breakRemainingSeconds,
    timelineEvents,
    setIsClockInModalOpen,
    setIsStartBreakModalOpen,
    endBreak,
    setIsClockOutModalOpen,
    setIsEditTaskModalOpen,
    addToast
  } = useWorkClock();

  const isAdmin = role === 'ADMIN';

  // Admin Dashboard State
  const [teamMembers, setTeamMembers] = useState<TeamMemberStatus[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>(() => {
    try {
      return storage.getLeaveRequests(organization?.id).filter((l: LeaveRequest) => l.status === 'Pending');
    } catch {
      return [];
    }
  });
  const [pendingCorrections, setPendingCorrections] = useState<AttendanceCorrectionRequest[]>(() => {
    try {
      return storage.getCorrectionRequests(organization?.id).filter((c: AttendanceCorrectionRequest) => c.status === 'Pending');
    } catch {
      return [];
    }
  });
  const [adminAssignedTasks, setAdminAssignedTasks] = useState<AssignedTask[]>(() => {
    try {
      return storage.getAssignedTasks(organization?.id);
    } catch {
      return [];
    }
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<TeamMemberStatus | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Employee Assigned Tasks & Attendance History State
  const [employeeTasks, setEmployeeTasks] = useState<AssignedTask[]>(() => {
    try {
      return user ? storage.getAssignedTasks(organization?.id).filter((t: AssignedTask) => t.assignedToUserId === user.id) : [];
    } catch {
      return [];
    }
  });
  const [employeeAttendanceHistory, setEmployeeAttendanceHistory] = useState<AttendanceRecord[]>(() => {
    try {
      return user ? storage.getAttendanceRecords(organization?.id).filter((r: AttendanceRecord) => r.userId === user.id) : [];
    } catch {
      return [];
    }
  });
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchAdminData = async (showFeedback = false) => {
    if (showFeedback) setIsRefreshing(true);
    try {
      const [team, reports, leaves, corrections, tasks, allAttendance] = await Promise.all([
        api.getTeamAttendance(organization?.id),
        api.getReportsSummary(organization?.id),
        api.getLeaveRequests(organization?.id),
        api.getCorrectionRequests(organization?.id),
        api.getAllAssignedTasks(organization?.id),
        api.getAllAttendanceRecords(organization?.id)
      ]);
      setTeamMembers(team);
      setReportsData(reports);
      setPendingLeaves(leaves.filter(l => l.status === 'Pending'));
      setPendingCorrections(corrections.filter(c => c.status === 'Pending'));
      setAdminAssignedTasks(tasks);
      setEmployeeAttendanceHistory(allAttendance || []);
      if (showFeedback) {
        addToast(
          'Dashboard Refreshed',
          'Live attendance metrics, assigned deliverables, and pending requests synced successfully.',
          'success'
        );
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
      if (showFeedback) {
        addToast('Refresh Failed', 'Unable to fetch real-time updates.', 'error');
      }
    } finally {
      setIsLoading(false);
      if (showFeedback) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const fetchEmployeeData = async (showFeedback = false) => {
    if (!user) return;
    if (showFeedback) setIsRefreshing(true);
    try {
      const [tasks, history] = await Promise.all([
        api.getTasksForUser(user.id, organization?.id),
        api.getAttendanceHistory(user.id, organization?.id)
      ]);
      setEmployeeTasks(tasks);
      setEmployeeAttendanceHistory(history);
      if (showFeedback) {
        addToast(
          'Workday Synced',
          'Weekly work hours, punch records, and assigned deliverables updated.',
          'success'
        );
      }
    } catch (e) {
      console.error('Error fetching employee dashboard data:', e);
      if (showFeedback) {
        addToast('Refresh Failed', 'Unable to refresh deliverables and weekly history.', 'error');
      }
    } finally {
      setIsLoading(false);
      if (showFeedback) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 3000);
      const subAtt = supabaseDb.subscribeToTableChanges('attendance_records', () => {
        fetchAdminData();
      });
      const subProfiles = supabaseDb.subscribeToTableChanges('profiles', () => {
        fetchAdminData();
      });
      const subLeaves = supabaseDb.subscribeToTableChanges('leave_requests', () => {
        fetchAdminData();
      });
      const subCorrections = supabaseDb.subscribeToTableChanges('attendance_corrections', () => {
        fetchAdminData();
      });
      return () => {
        clearInterval(interval);
        subAtt?.unsubscribe?.();
        subProfiles?.unsubscribe?.();
        subLeaves?.unsubscribe?.();
        subCorrections?.unsubscribe?.();
      };
    } else if (user) {
      fetchEmployeeData();
      const interval = setInterval(fetchEmployeeData, 3000);
      const subAtt = supabaseDb.subscribeToTableChanges('attendance_records', () => {
        fetchEmployeeData();
      });
      const subTasks = supabaseDb.subscribeToTableChanges('assigned_tasks', () => {
        fetchEmployeeData();
      });
      return () => {
        clearInterval(interval);
        subAtt?.unsubscribe?.();
        subTasks?.unsubscribe?.();
      };
    }
  }, [isAdmin, user?.id, organization?.id]);

  // Compute Weekly Work Time & Attendance for Employee Line Chart
  const weeklyChartData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 5 is Friday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const fullLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const todayYMD = now.toISOString().split('T')[0];

    return dayLabels.map((abbr, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayYMD;

      const historyRec = employeeAttendanceHistory.find(r => r.date === dateStr);

      let netWorkSec = 0;
      let breakSec = 0;
      let statusLabel = 'Upcoming';
      let clockInStr = '—';
      let clockOutStr = '—';
      let isLate = false;
      let isLeave = false;
      let lateMins = 0;

      if (isToday) {
        netWorkSec = workSeconds;
        breakSec = breakUsedSeconds;
        if (clockState.status === 'WORKING') {
          statusLabel = 'Working Now';
          clockInStr = clockState.clockInTimestamp
            ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';
        } else if (clockState.status === 'ON_BREAK') {
          statusLabel = 'On Break';
          clockInStr = clockState.clockInTimestamp
            ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';
        } else if (clockState.status === 'CLOCKED_OUT') {
          statusLabel = historyRec?.isLate ? 'Late' : 'Completed';
          clockInStr = historyRec?.clockIn || (clockState.clockInTimestamp ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
          clockOutStr = historyRec?.clockOut || (clockState.clockOutTimestamp ? new Date(clockState.clockOutTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
        } else {
          statusLabel = 'Not Clocked In';
        }
        if (historyRec) {
          isLate = !!historyRec.isLate;
          lateMins = historyRec.lateMinutes || 0;
        }
      } else if (historyRec) {
        netWorkSec = historyRec.netWorkSeconds || 0;
        breakSec = historyRec.totalBreakSeconds || 0;
        clockInStr = historyRec.clockIn || '—';
        clockOutStr = historyRec.clockOut || '—';
        isLate = !!historyRec.isLate;
        lateMins = historyRec.lateMinutes || 0;
        if (historyRec.status === 'LEAVE') {
          isLeave = true;
          statusLabel = historyRec.leaveType || 'Leave';
        } else if (historyRec.status === 'LATE') {
          statusLabel = `Late (${lateMins}m)`;
        } else if (historyRec.status === 'ABSENT') {
          statusLabel = 'Absent';
        } else {
          statusLabel = 'Present';
        }
      } else {
        if (d < now && !isToday) {
          statusLabel = 'Off / Rest';
        } else {
          statusLabel = 'Scheduled';
        }
      }

      const workHours = +(netWorkSec / 3600).toFixed(2);
      const breakHours = +(breakSec / 3600).toFixed(2);
      const hoursH = Math.floor(netWorkSec / 3600);
      const minsM = Math.floor((netWorkSec % 3600) / 60);

      return {
        day: abbr,
        fullDay: fullLabels[idx],
        date: dateStr,
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workHours,
        workSec: netWorkSec,
        workFormatted: `${hoursH}h ${minsM}m`,
        breakHours,
        breakFormatted: `${Math.floor(breakSec / 60)}m`,
        targetHours: 8.0,
        status: statusLabel,
        isLate,
        isLeave,
        clockIn: clockInStr,
        clockOut: clockOutStr,
        isToday
      };
    });
  }, [employeeAttendanceHistory, workSeconds, breakUsedSeconds, clockState, currentDateFormatted]);

  const weeklySummary = useMemo(() => {
    const totalSec = weeklyChartData.reduce((acc, d) => acc + d.workSec, 0);
    const totalHours = +(totalSec / 3600).toFixed(1);
    const daysWithWork = weeklyChartData.filter(d => d.workSec > 0).length || 1;
    const avgDailySec = Math.round(totalSec / daysWithWork);
    const avgDailyHours = +(avgDailySec / 3600).toFixed(1);
    const totalOvertimeSec = weeklyChartData.reduce((acc, d) => acc + Math.max(0, d.workSec - 28800), 0);
    const totalOvertimeHours = +(totalOvertimeSec / 3600).toFixed(1);
    const workedDays = weeklyChartData.filter(d => d.workSec > 0 || d.isToday);
    const onTimeDays = workedDays.filter(d => !d.isLate && !d.isLeave).length;
    const punctualityScore = workedDays.length > 0 ? Math.round((onTimeDays / workedDays.length) * 100) : 100;

    return {
      totalHours,
      totalFormatted: `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`,
      avgDailyHours,
      avgDailyFormatted: `${Math.floor(avgDailySec / 3600)}h ${Math.floor((avgDailySec % 3600) / 60)}m`,
      totalOvertimeHours,
      totalOvertimeFormatted: `${Math.floor(totalOvertimeSec / 3600)}h ${Math.floor((totalOvertimeSec % 3600) / 60)}m`,
      punctualityScore,
      daysWithWork
    };
  }, [weeklyChartData]);

  const CustomWeeklyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/90 shadow-xl text-xs space-y-2 min-w-[210px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div>
              <span className="font-bold text-slate-900">{data.fullDay}</span>
              <span className="text-[11px] text-slate-500 ml-1.5 font-medium">{data.formattedDate}</span>
            </div>
            {data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                Net Work Time:
              </span>
              <span className="font-bold text-slate-900 font-mono text-sm">{data.workFormatted} ({data.workHours}h)</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Shift Benchmark:</span>
              <span className="font-semibold text-slate-600">8.0 hrs / day</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Break Logged:</span>
              <span className="font-semibold text-amber-600">{data.breakFormatted}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Punch Record:</span>
              <span className="font-semibold text-slate-700">
                {data.clockIn} → {data.clockOut}
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                data.status === 'Working Now'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                  : data.isLate
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : data.isLeave
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : data.workSec > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {data.status}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await api.updateTaskStatus(taskId, newStatus);
      addToast(
        'Task Status Updated',
        `Task status changed to ${newStatus.replace('_', ' ')}. Admin has been notified.`,
        'success'
      );
      await fetchEmployeeData();
    } catch (e: any) {
      addToast(
        'Update Failed',
        e.message || 'Could not update task status.',
        'error'
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatHoursMins = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatShortHM = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  // Custom Chart Tooltip Component
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>{label}</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {entry.value} {entry.dataKey.toLowerCase().includes('hour') ? 'h' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // ─────────────────────────────────────────────────────────────
  // ── 1. ADMIN DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    const totalEmployees = teamMembers.length;
    const workingNow = teamMembers.filter(m => m.currentStatus === 'WORKING').length;
    const onBreakNow = teamMembers.filter(m => m.currentStatus === 'ON_BREAK').length;
    const clockedOutToday = teamMembers.filter(m => m.currentStatus === 'CLOCKED_OUT').length;
    const presentToday = workingNow + onBreakNow + clockedOutToday;
    const absentToday = teamMembers.filter(m => m.attendanceToday?.status === 'ABSENT').length;
    const lateToday = teamMembers.filter(m => m.currentStatus !== 'NOT_CLOCKED_IN' && (m.attendanceToday?.isLate || m.attendanceToday?.status === 'LATE')).length;
    const onLeaveToday = teamMembers.filter(m => m.attendanceToday?.status === 'LEAVE').length;
    const notClockedInToday = teamMembers.filter(m => m.currentStatus === 'NOT_CLOCKED_IN').length;
    const attendancePct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    // 5-day current work week (Monday to Friday) calculation directly from real Supabase records
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const fullLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const todayYMD = now.toISOString().split('T')[0];

    // Weekly live work hours data computed purely from real database attendance records
    const weeklyWorkData = dayLabels.map((abbr, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayYMD;

      if (isToday) {
        const todayLoggedHours = presentToday > 0 ? Math.round((teamMembers.reduce((acc, m) => acc + m.totalWorkSecondsToday, 0) / presentToday / 3600) * 10) / 10 : 0;
        return {
          day: `${abbr} (Today)`,
          fullDay: fullLabels[idx],
          date: dateStr,
          avgWorkHours: todayLoggedHours,
          targetHours: 8.0
        };
      }

      const dayRecords = (employeeAttendanceHistory || []).filter(r => r.date === dateStr);
      const totalSec = dayRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
      const activeCount = dayRecords.filter(r => (r.netWorkSeconds || 0) > 0).length;
      const avgWorkHours = activeCount > 0 ? Math.round((totalSec / activeCount / 3600) * 10) / 10 : 0;

      return {
        day: abbr,
        fullDay: fullLabels[idx],
        date: dateStr,
        avgWorkHours,
        targetHours: 8.0
      };
    });

    // Weekly attendance distribution computed strictly from real Supabase records
    const attendanceBreakdownData = dayLabels.map((abbr, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayYMD;

      if (isToday) {
        return {
          day: `${abbr} (Today)`,
          Present: presentToday,
          Late: lateToday,
          Absent: absentToday,
          Leave: onLeaveToday
        };
      }

      const dayRecords = (employeeAttendanceHistory || []).filter(r => r.date === dateStr);
      const presentCount = dayRecords.filter(r => r.status === 'PRESENT' || r.status === 'WORKING' || r.status === 'ON_BREAK' || r.status === 'COMPLETED').length;
      const lateCount = dayRecords.filter(r => r.isLate || r.status === 'LATE').length;
      const leaveCount = dayRecords.filter(r => r.status === 'LEAVE').length;
      const absentCount = dayRecords.filter(r => r.status === 'ABSENT').length;

      return {
        day: abbr,
        Present: presentCount,
        Late: lateCount,
        Absent: absentCount,
        Leave: leaveCount
      };
    });

    const activeDaysWithData = weeklyWorkData.filter((d: any) => d.avgWorkHours > 0);
    const weeklyAvgHours = activeDaysWithData.length > 0
      ? Math.round((activeDaysWithData.reduce((acc: number, d: any) => acc + d.avgWorkHours, 0) / activeDaysWithData.length) * 10) / 10
      : 0;

    const filteredMembers = teamMembers.filter(m => {
      const matchSearch = m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.department.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'WORKING') return m.currentStatus === 'WORKING';
      if (statusFilter === 'ON_BREAK') return m.currentStatus === 'ON_BREAK';
      if (statusFilter === 'CLOCKED_OUT') return m.currentStatus === 'CLOCKED_OUT';
      if (statusFilter === 'LATE') return m.attendanceToday?.isLate;
      if (statusFilter === 'ABSENT') return m.attendanceToday?.status === 'ABSENT' || m.currentStatus === 'NOT_CLOCKED_IN';
      if (statusFilter === 'LEAVE') return m.attendanceToday?.status === 'LEAVE';
      return true;
    });

    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workforce &amp; Operations Center</h2>
            <p className="text-xs text-slate-500">Live attendance monitoring, work delegation, and shift tracking for {currentDateFormatted}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>+ Assign Work</span>
            </button>
            <button
              onClick={() => fetchAdminData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Refresh live dashboard data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Balanced KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Workforce</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
            <div className="text-[11px] text-slate-400">Registered employees &amp; interns</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Present Today</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{presentToday} <span className="text-xs font-normal text-slate-400">({attendancePct}%)</span></div>
            <div className="text-[11px] text-emerald-600 font-medium">{workingNow} actively on clock</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Late &amp; Breaks</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{lateToday} <span className="text-xs font-normal text-slate-400">late</span></div>
            <div className="text-[11px] text-amber-600 font-medium">{onBreakNow} currently taking break</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Work Hours</span>
              <Timer className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{reportsData?.totalWorkingHoursFormatted || '0h 0m'}</div>
            <div className="text-[11px] text-purple-600 font-medium">{reportsData?.totalOvertimeFormatted || '0h'} overtime logged</div>
          </div>
        </div>

        {/* Live Tracked Graph Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Graph 1: Weekly Average Work Hours & Total Productivity */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600" />
                  <h3 className="font-bold text-sm text-slate-900">Weekly Average Work Hours</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Average work time per day across all employees vs standard target</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono font-bold text-[11px] border border-brand-200/80">
                  Avg: {weeklyAvgHours}h / day
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium text-[11px] border border-slate-200">
                  Target: 8.0h
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyWorkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine y={8.0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Target: 8h', position: 'top', fill: '#64748b', fontSize: 10 }} />
                  <Bar dataKey="avgWorkHours" name="Avg Work Hours" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]" />
                  <span>Logged Work Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-400 border-dashed" />
                  <span>Standard Shift Target (7.0h • 6 PM - 1 AM)</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">● Real-time Live</span>
            </div>
          </div>

          {/* Graph 2: Attendance & Status Distribution Live Tracking */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Attendance &amp; Status Distribution</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time breakdown of Present, Late Arrivals, Absent &amp; Leave</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {presentToday} Present
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  {lateToday} Late
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                  {absentToday} Absent
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis allowDecimals={false} domain={[0, Math.max(3, totalEmployees + 1)]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Leave" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Workforce: <strong className="text-slate-900">{totalEmployees} employees</strong></span>
              <span className="text-[11px] font-semibold text-emerald-600">● Live Synchronization</span>
            </div>
          </div>
        </div>


        {/* Assigned Deliverables Section */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900">Assigned Deliverables &amp; Work Delegation</h3>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
                {adminAssignedTasks.length} Active Tasks
              </span>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Assign New Task
            </button>
          </div>

          {adminAssignedTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No active work assigned yet. Click "+ Assign Work" to allocate deliverables.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminAssignedTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(t.priority)}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold text-brand-700">👤 {t.assignedToUserName}</span>
                    <span className="text-slate-400">Due: {t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Banners for Pending Authorizations */}
        {(pendingLeaves.length > 0 || pendingCorrections.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingLeaves.length > 0 && (
              <div
                onClick={() => onNavigate?.('leave-admin')}
                className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 hover:border-amber-300 transition-all flex items-center justify-between text-xs cursor-pointer group shadow-2xs"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate?.('leave-admin'); }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 group-hover:bg-amber-200 text-amber-700 font-bold flex items-center justify-center text-xs transition-colors">
                    {pendingLeaves.length}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Pending Leave Requests</span>
                    <p className="text-[11px] text-slate-500">{pendingLeaves[0].userName} applied for {pendingLeaves[0].leaveType}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.('leave-admin');
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {pendingCorrections.length > 0 && (
              <div
                onClick={() => onNavigate?.('corrections-admin')}
                className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all flex items-center justify-between text-xs cursor-pointer group shadow-2xs"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate?.('corrections-admin'); }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs transition-colors">
                    {pendingCorrections.length}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Pending Punch Regularizations</span>
                    <p className="text-[11px] text-slate-500">{pendingCorrections[0].userName} submitted correction</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.('corrections-admin');
                  }}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Attendance Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Table Controls */}
          <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees by name, ID or department..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-600 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'WORKING', label: 'Working' },
                { id: 'ON_BREAK', label: 'On Break' },
                { id: 'CLOCKED_OUT', label: 'Clocked Out' },
                { id: 'LATE', label: 'Late' },
                { id: 'LEAVE', label: 'Leave' },
                { id: 'ABSENT', label: 'Absent' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Component */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Clock In</th>
                  <th className="px-3 py-2.5">Clock Out</th>
                  <th className="px-3 py-2.5">Work Hours</th>
                  <th className="px-3 py-2.5">Break</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isWorking = member.currentStatus === 'WORKING';
                    const isOnBreak = member.currentStatus === 'ON_BREAK';
                    const isClockedOut = member.currentStatus === 'CLOCKED_OUT';
                    const isLate = member.attendanceToday?.isLate;
                    const isLeave = member.attendanceToday?.status === 'LEAVE';

                    return (
                      <tr
                        key={member.user.id}
                        onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}
                        className="hover:bg-slate-50/75 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {member.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{member.user.name}</div>
                              <div className="text-[10px] text-slate-400">{member.user.designation}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                          {member.user.employeeId}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {member.user.department}
                        </td>

                        <td className="px-3 py-3">
                          {isLeave ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              On Leave
                            </span>
                          ) : isWorking ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Working
                            </span>
                          ) : isOnBreak ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Break
                            </span>
                          ) : isClockedOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Clocked Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500">
                              Off
                            </span>
                          )}

                          {isLate && member.currentStatus !== 'NOT_CLOCKED_IN' && (
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Late ({member.attendanceToday?.lateMinutes}m)
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-700">
                          {member.currentStatus !== 'NOT_CLOCKED_IN' && member.clockInTimeFormatted ? member.clockInTimeFormatted : '—'}
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-700">
                          {member.currentStatus !== 'NOT_CLOCKED_IN' && member.attendanceToday?.clockOut && member.attendanceToday.clockOut !== '—' ? member.attendanceToday.clockOut : '—'}
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-900 font-mono">
                          {member.currentStatus !== 'NOT_CLOCKED_IN' && member.totalWorkSecondsToday > 0 ? formatShortHM(member.totalWorkSecondsToday) : '—'}
                        </td>

                        <td className="px-3 py-3 text-slate-500 font-mono">
                          {member.currentStatus !== 'NOT_CLOCKED_IN' && member.totalBreakSecondsToday > 0 ? formatShortHM(member.totalBreakSecondsToday) : '—'}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
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

        {/* Modal for Employee Details */}
        {selectedMember && (
          <EmployeeDetailModal
            member={selectedMember}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )}

        {/* Modal for Assigning Work */}
        <AssignWorkModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={fetchAdminData}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── 2. EMPLOYEE DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  const isNotClockedIn = clockState.status === 'NOT_CLOCKED_IN';
  const isWorking = clockState.status === 'WORKING';
  const isOnBreak = clockState.status === 'ON_BREAK';
  const isClockedOut = clockState.status === 'CLOCKED_OUT';

  const scheduledHours = 8;
  const scheduledSeconds = scheduledHours * 3600;
  const overtimeSec = Math.max(0, workSeconds - scheduledSeconds);
  const shiftProgressPct = Math.min(100, Math.round((workSeconds / scheduledSeconds) * 100));

  return (
    <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl mx-auto">
      {/* Top Header Bar for Employee */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Workday Dashboard</h2>
          <p className="text-xs text-slate-500">Live punch station, break timers, and assigned tasks for {currentDateFormatted}</p>
        </div>
        <button
          onClick={() => fetchEmployeeData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
          title="Refresh tasks and shift data"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Weekly Work Time & Attendance Trends (Line Graph & Day-wise Breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Weekly Work Time &amp; Attendance Trends</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visual daily work time vs. 8.0h shift target, break logs, and week punctuality
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>Mon, Sep 14 — Fri, Sep 18, 2026</span>
          </div>
        </div>

        {/* 4 Weekly KPI Summary Mini Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Timer className="w-3 h-3 text-brand-600" /> Weekly Logged
            </span>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {weeklySummary.totalFormatted}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {weeklySummary.totalHours}h of 40h standard
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> Daily Average
            </span>
            <div className="text-lg font-extrabold text-emerald-700 font-mono">
              {weeklySummary.avgDailyFormatted}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ~{weeklySummary.avgDailyHours}h active/day
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-indigo-600" /> On-Time Punctuality
            </span>
            <div className="text-lg font-extrabold text-indigo-700 font-mono">
              {weeklySummary.punctualityScore}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Timely shift clock-ins
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" /> Overtime Logged
            </span>
            <div className="text-lg font-extrabold text-purple-700 font-mono">
              {weeklySummary.totalOvertimeFormatted}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Beyond 8h daily limit
            </p>
          </div>
        </div>

        {/* Recharts Area & Line Chart */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-brand-600" /> Daily Work Hours Trajectory
            </span>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Net Work Time
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" /> 8.0h Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Break Hours
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="workGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  domain={[0, 10]}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `${val}h`}
                />
                <ReferenceLine
                  y={8.0}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: '8.0h Target', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
                />
                <Tooltip content={<CustomWeeklyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="workHours"
                  name="Net Work Hours"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#workGradient)"
                  dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#2563eb', stroke: '#dbeafe', strokeWidth: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="breakHours"
                  name="Break Hours"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-by-Day Visual Cards Grid */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {weeklyChartData.map((dayItem) => {
              const pctOf8h = Math.min(100, Math.round((dayItem.workHours / 8.0) * 100));
              return (
                <div
                  key={dayItem.day}
                  className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                    dayItem.isToday
                      ? 'bg-brand-50/40 border-brand-300 ring-2 ring-brand-100 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{dayItem.fullDay}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{dayItem.formattedDate}</span>
                    </div>
                    {dayItem.isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-brand-600 text-white uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {dayItem.workFormatted}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{dayItem.workHours}h of 8.0h</span>
                      <span className="font-bold text-slate-600">{pctOf8h}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pctOf8h >= 100
                            ? 'bg-emerald-500'
                            : pctOf8h >= 50
                            ? 'bg-brand-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${pctOf8h}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Punches:</span>
                    <span className="font-medium text-slate-700 truncate" title={`${dayItem.clockIn} - ${dayItem.clockOut}`}>
                      {dayItem.clockIn !== '—' ? dayItem.clockIn.split(' ')[0] : '—'}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-block w-full text-center py-0.5 rounded text-[9px] font-bold ${
                      dayItem.status === 'Working Now'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                        : dayItem.isLate
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : dayItem.isLeave
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : dayItem.workSec > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {dayItem.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee Hero Time Clock Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Timer & Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{currentDateFormatted}</span>
              <span>•</span>
              <span className="text-slate-400">Shift: 06:00 PM – 02:00 AM (8h)</span>
            </div>

            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {currentTimeFormatted}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              {isWorking && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Clocked In &amp; Working
                </span>
              )}
              {isOnBreak && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  On Break ({clockState.currentBreakType || 'Rest'})
                </span>
              )}
              {isClockedOut && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Shift Completed
                </span>
              )}
              {isNotClockedIn && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Not Clocked In
                </span>
              )}
            </div>
          </div>

          {/* Right: Primary Punch Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {isNotClockedIn && (
              <button
                onClick={() => setIsClockInModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Clock In</span>
              </button>
            )}

            {isWorking && (
              <>
                <button
                  onClick={() => setIsStartBreakModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Take Break</span>
                </button>

                <button
                  onClick={() => setIsClockOutModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {isOnBreak && (
              <button
                onClick={endBreak}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>End Break</span>
              </button>
            )}

            {isClockedOut && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">✓ Shift Logged.</span> Have a great rest!
              </div>
            )}
          </div>
        </div>

        {/* Shift Progress Line */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
            <span>Shift Target Progress</span>
            <span className="font-semibold text-slate-900">{shiftProgressPct}% of 8.0h</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${shiftProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Working Time</span>
            <Timer className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatHoursMins(workSeconds)}
          </div>
          <div className="text-[11px] text-slate-400">Net active working duration</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Break Duration</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {formatHoursMins(breakUsedSeconds)}
          </div>
          <div className="text-[11px] text-slate-400">{Math.floor(breakRemainingSeconds / 60)}m allowance remaining</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Overtime</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums">
            {formatHoursMins(overtimeSec)}
          </div>
          <div className="text-[11px] text-slate-400">Hours exceeding standard 8.0h</div>
        </div>
      </div>

      {/* Two Column Bottom: Task Activity + Event Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Focus Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900">Current Task</h3>
            </div>
            <button
              onClick={() => setIsEditTaskModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Change Task
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="font-semibold text-slate-900 text-sm">{clockState.currentActivity || 'No active task set'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Initial: {clockState.initialTask || 'Standard Shift'}</div>
          </div>
        </div>

        {/* Right 1 Col: Chronological Timeline */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900">Today's Activity</h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {timelineEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No punch events today yet.</p>
            ) : (
              timelineEvents.map((evt) => (
                <div key={evt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-brand-600 font-mono mb-0.5">
                    <span>{evt.timestamp}</span>
                    <span className="text-slate-400 uppercase">{evt.type}</span>
                  </div>
                  <div className="font-semibold text-slate-900">{evt.title}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

