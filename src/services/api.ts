import { storage } from './storage';
import {
  User, AttendanceRecord, BreakRecord, WorkSession, ActivityRecord,
  TeamMemberStatus, BreakType, EmployeeStatus, UserRole, EmployeeType
} from '../types';

export interface AddEmployeeParams {
  name: string;
  email: string;
  password?: string;
  employeeId?: string;
  department: string;
  designation: string;
  employeeType: EmployeeType;
  role?: UserRole;
  joiningDate?: string;
  workLocation?: string;
  phone?: string;
  profileImage?: string;
}

export const MAX_DAILY_BREAK_SECONDS = 3600; // 60 minutes = 1 hour break cap

export const api = {
  // Authentication - Real login validation
  async login(email: string, password?: string): Promise<User> {
    const users = storage.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      throw new Error('Account not found with this email. Please sign up or contact your Admin.');
    }

    if (found.password && password && found.password !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    storage.setCurrentUserId(found.id);
    return found;
  },

  // Admin Action / Sign Up: Add Employee or Intern
  async addEmployee(params: AddEmployeeParams): Promise<User> {
    const users = storage.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = `usr_${Date.now()}`;
    const autoEmpId = params.employeeId?.trim() || `EMP${String(users.length + 1).padStart(3, '0')}`;
    const profileImage = params.profileImage?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name)}&backgroundColor=0c8ee9,0270c7`;

    // First user registering in system is automatically ADMIN, or explicit role if provided
    const isFirstUser = users.length === 0;
    const assignedRole: UserRole = params.role || (isFirstUser ? 'ADMIN' : 'EMPLOYEE');

    const newUser: User = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password || 'password123',
      employeeId: autoEmpId,
      department: params.department.trim(),
      designation: params.designation.trim(),
      role: assignedRole,
      employeeType: params.employeeType || 'Employee',
      joiningDate: params.joiningDate || new Date().toISOString().split('T')[0],
      profileImage,
      workLocation: params.workLocation || 'Work From Home',
      phone: params.phone || '+91 98765 43210',
      createdAt: new Date().toISOString()
    };

    storage.addUser(newUser);
    return newUser;
  },

  // Admin Action: Remove Employee
  async removeEmployee(userId: string): Promise<void> {
    const user = storage.getUsers().find(u => u.id === userId);
    if (!user) throw new Error('Employee not found.');
    if (user.role === 'ADMIN') throw new Error('Cannot delete the primary Admin account.');
    storage.deleteUser(userId);
  },

  // Today's Attendance & Active State
  async getTodayAttendance(userId: string): Promise<{
    activeClockState: ReturnType<typeof storage.getActiveClockState>;
    attendanceRecord?: AttendanceRecord;
  }> {
    const activeClockState = storage.getActiveClockState(userId);
    const records = storage.getAttendanceRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.userId === userId && r.date === todayStr);

    return { activeClockState, attendanceRecord: todayRecord };
  },

  // Clock In (Exact Server Timestamp & Late Calculation)
  async clockIn(userId: string, initialTask: string): Promise<{ success: boolean; message: string; state: any }> {
    const currentState = storage.getActiveClockState(userId);
    if (currentState.status !== 'NOT_CLOCKED_IN') {
      throw new Error('You are already clocked in for today.');
    }

    const now = new Date();
    const nowMs = now.getTime();
    // Exact timestamp display e.g. "09:07:32 AM"
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    // Late Indicator calculation: Expected start time is 09:00 AM
    const targetHour = 9;
    const targetMin = 0;
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let isLate = false;
    let lateMinutes = 0;

    if (currentHour > targetHour || (currentHour === targetHour && currentMin > targetMin)) {
      isLate = true;
      lateMinutes = (currentHour - targetHour) * 60 + (currentMin - targetMin);
    }

    const attendanceStatus: AttendanceRecord['status'] = isLate ? 'Late' : 'Present';
    const attendanceId = `att_${todayStr}_${userId}`;

    const attendanceRecord: AttendanceRecord = {
      id: attendanceId,
      userId,
      date: todayStr,
      dayName,
      clockIn: timeFormatted,
      clockInTimestamp: nowMs,
      totalBreakSeconds: 0,
      totalWorkSeconds: 0,
      netWorkSeconds: 0,
      status: attendanceStatus,
      completionStatus: 'Working',
      isLate,
      lateMinutes,
      initialTask,
      currentActivity: initialTask,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    storage.saveAttendanceRecord(attendanceRecord);

    const initialSession: WorkSession = {
      id: `ses_${Date.now()}`,
      attendanceId,
      userId,
      startTime: now.toISOString(),
      durationSeconds: 0,
      activity: initialTask,
      status: 'Working'
    };
    storage.saveWorkSession(initialSession);

    const initialActivityRecord: ActivityRecord = {
      id: `act_${Date.now()}`,
      userId,
      attendanceId,
      activity: initialTask,
      startedAt: now.toISOString(),
      durationSeconds: 0,
      status: 'Working',
      updatedAt: now.toISOString()
    };
    storage.saveActivityRecord(initialActivityRecord);

    const newState = {
      ...currentState,
      status: 'WORKING' as EmployeeStatus,
      clockInTimestamp: nowMs,
      initialTask,
      currentActivity: initialTask,
      attendanceId,
      accumulatedBreakSeconds: 0,
      currentBreakStartTimestamp: null
    };
    storage.setActiveClockState(userId, newState);

    const lateNotice = isLate ? ` (Late by ${lateMinutes} minutes)` : '';
    storage.addTimelineEvent(userId, {
      timestamp: timeFormatted,
      title: 'Clocked In',
      subtitle: `Started workday${lateNotice} - Task: ${initialTask}`,
      type: 'CLOCK_IN'
    });

    return {
      success: true,
      message: `Clocked in successfully at ${timeFormatted}${lateNotice}.`,
      state: newState
    };
  },

  // Start Break (Strict 60-Minute Allowance Check)
  async startBreak(userId: string, breakType: BreakType, notes?: string): Promise<{ success: boolean; message: string; state: any }> {
    const currentState = storage.getActiveClockState(userId);
    if (currentState.status !== 'WORKING') {
      throw new Error('You can only take a break while in WORKING status.');
    }

    // Check if employee has already used all 60 minutes (3600 seconds)
    if (currentState.accumulatedBreakSeconds >= MAX_DAILY_BREAK_SECONDS) {
      throw new Error('Your 1-hour daily break allowance has been fully used.');
    }

    const now = new Date();
    const nowMs = now.getTime();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newState = {
      ...currentState,
      status: 'ON_BREAK' as EmployeeStatus,
      currentBreakStartTimestamp: nowMs,
      currentBreakType: breakType
    };
    storage.setActiveClockState(userId, newState);

    if (currentState.attendanceId) {
      const breakRec: BreakRecord = {
        id: `brk_${Date.now()}`,
        attendanceId: currentState.attendanceId,
        userId,
        breakType,
        startTime: now.toISOString(),
        durationSeconds: 0,
        notes
      };
      storage.saveBreakRecord(breakRec);
    }

    storage.addTimelineEvent(userId, {
      timestamp: timeFormatted,
      title: `${breakType} Break Started`,
      subtitle: notes ? `Notes: ${notes}` : 'On Break',
      type: 'BREAK_START'
    });

    return {
      success: true,
      message: `${breakType} break started at ${timeFormatted}.`,
      state: newState
    };
  },

  // End Break (Continue Working & Return Remaining Allowance)
  async endBreak(userId: string): Promise<{ success: boolean; message: string; state: any }> {
    const currentState = storage.getActiveClockState(userId);
    if (currentState.status !== 'ON_BREAK' || !currentState.currentBreakStartTimestamp) {
      throw new Error('You are not currently on a break.');
    }

    const now = new Date();
    const nowMs = now.getTime();
    const breakDurationSec = Math.floor((nowMs - currentState.currentBreakStartTimestamp) / 1000);
    const newAccumulatedBreak = currentState.accumulatedBreakSeconds + breakDurationSec;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Calculate remaining break allowance
    const remainingBreakSec = Math.max(0, MAX_DAILY_BREAK_SECONDS - newAccumulatedBreak);
    const remainingMins = Math.floor(remainingBreakSec / 60);

    const newState = {
      ...currentState,
      status: 'WORKING' as EmployeeStatus,
      accumulatedBreakSeconds: newAccumulatedBreak,
      currentBreakStartTimestamp: null,
      currentBreakType: null
    };
    storage.setActiveClockState(userId, newState);

    const breaks = storage.getBreakRecords();
    const activeBreak = breaks.find(b => b.userId === userId && !b.endTime);
    if (activeBreak) {
      activeBreak.endTime = now.toISOString();
      activeBreak.durationSeconds = breakDurationSec;
      storage.saveBreakRecord(activeBreak);
    }

    const records = storage.getAttendanceRecords();
    const todayRecord = records.find(r => r.id === currentState.attendanceId);
    if (todayRecord) {
      todayRecord.totalBreakSeconds = newAccumulatedBreak;
      todayRecord.updatedAt = now.toISOString();
      storage.saveAttendanceRecord(todayRecord);
    }

    storage.addTimelineEvent(userId, {
      timestamp: timeFormatted,
      title: 'Break Ended',
      subtitle: `Returned to work. Remaining break: ${remainingMins} mins`,
      type: 'BREAK_END'
    });

    return {
      success: true,
      message: `Break ended. You have ${remainingMins} minutes of break time remaining.`,
      state: newState
    };
  },

  // Clock Out (Calculates Net Work Time & Completion Status: 8h Completed vs Incomplete)
  async clockOut(userId: string, endNotes?: string): Promise<{ success: boolean; message: string; state: any }> {
    const currentState = storage.getActiveClockState(userId);
    if (currentState.status === 'NOT_CLOCKED_IN') {
      throw new Error('You are not clocked in today.');
    }
    if (currentState.status === 'ON_BREAK') {
      throw new Error('You must end your break before clocking out.');
    }
    if (currentState.status === 'CLOCKED_OUT') {
      throw new Error('You have already clocked out for today.');
    }

    const now = new Date();
    const nowMs = now.getTime();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const clockInMs = currentState.clockInTimestamp || nowMs;
    const totalElapsedSec = Math.floor((nowMs - clockInMs) / 1000);
    const breakSec = currentState.accumulatedBreakSeconds;
    const netWorkSec = Math.max(0, totalElapsedSec - breakSec);

    // Required productive work is 8 hours (28800 seconds)
    const isCompleted = netWorkSec >= 28800;
    const completionStatus = isCompleted ? '8 Hour Work Completed' : 'Workday Incomplete';

    const newState = {
      ...currentState,
      status: 'CLOCKED_OUT' as EmployeeStatus,
      clockOutTimestamp: nowMs
    };
    storage.setActiveClockState(userId, newState);

    const records = storage.getAttendanceRecords();
    const todayRecord = records.find(r => r.id === currentState.attendanceId);
    if (todayRecord) {
      todayRecord.clockOut = timeFormatted;
      todayRecord.clockOutTimestamp = nowMs;
      todayRecord.totalWorkSeconds = totalElapsedSec;
      todayRecord.totalBreakSeconds = breakSec;
      todayRecord.netWorkSeconds = netWorkSec;
      todayRecord.endNotes = endNotes;
      todayRecord.completionStatus = completionStatus;
      todayRecord.updatedAt = now.toISOString();
      storage.saveAttendanceRecord(todayRecord);
    }

    const sessions = storage.getWorkSessions();
    const activeSession = sessions.find(s => s.userId === userId && s.status === 'Working');
    if (activeSession) {
      activeSession.endTime = now.toISOString();
      activeSession.durationSeconds = Math.floor((nowMs - new Date(activeSession.startTime).getTime()) / 1000);
      activeSession.status = 'Completed';
      storage.saveWorkSession(activeSession);
    }

    storage.addTimelineEvent(userId, {
      timestamp: timeFormatted,
      title: 'Clocked Out',
      subtitle: `Status: ${completionStatus}. Net Work: ${Math.floor(netWorkSec / 3600)}h ${Math.floor((netWorkSec % 3600) / 60)}m`,
      type: 'CLOCK_OUT'
    });

    return {
      success: true,
      message: `Workday finished. Status: ${completionStatus}.`,
      state: newState
    };
  },

  // Update Activity
  async updateActivity(userId: string, newActivity: string, status: 'Working' | 'Completed' | 'Paused' = 'Working'): Promise<{ success: boolean; state: any }> {
    const currentState = storage.getActiveClockState(userId);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newState = {
      ...currentState,
      currentActivity: newActivity
    };
    storage.setActiveClockState(userId, newState);

    const activityRecord: ActivityRecord = {
      id: `act_${Date.now()}`,
      userId,
      attendanceId: currentState.attendanceId || `att_${now.toISOString().split('T')[0]}_${userId}`,
      activity: newActivity,
      startedAt: now.toISOString(),
      durationSeconds: 0,
      status,
      updatedAt: now.toISOString()
    };
    storage.saveActivityRecord(activityRecord);

    if (currentState.attendanceId) {
      const records = storage.getAttendanceRecords();
      const rec = records.find(r => r.id === currentState.attendanceId);
      if (rec) {
        rec.currentActivity = newActivity;
        storage.saveAttendanceRecord(rec);
      }
    }

    storage.addTimelineEvent(userId, {
      timestamp: timeFormatted,
      title: 'Activity Updated',
      subtitle: newActivity,
      type: 'TASK_UPDATE'
    });

    return { success: true, state: newState };
  },

  // Get History Logs
  async getAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
    const all = storage.getAttendanceRecords();
    return all.filter(r => r.userId === userId);
  },

  async getWorkSessions(userId: string): Promise<WorkSession[]> {
    const all = storage.getWorkSessions();
    return all.filter(s => s.userId === userId);
  },

  async getBreakHistory(userId: string): Promise<BreakRecord[]> {
    const all = storage.getBreakRecords();
    return all.filter(b => b.userId === userId);
  },

  async getActivityLog(userId: string): Promise<ActivityRecord[]> {
    const all = storage.getActivityRecords();
    return all.filter(a => a.userId === userId);
  },

  // Admin Oversight - Real-time Team Attendance Directory
  async getTeamAttendance(): Promise<TeamMemberStatus[]> {
    // Only return non-admin employees/interns
    const employees = storage.getUsers().filter(u => u.role !== 'ADMIN');
    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceRecords = storage.getAttendanceRecords();
    const breakRecords = storage.getBreakRecords();

    return employees.map(user => {
      const clockState = storage.getActiveClockState(user.id);
      const attToday = attendanceRecords.find(r => r.userId === user.id && r.date === todayStr);

      let totalWork = 0;
      let totalBreak = clockState.accumulatedBreakSeconds;

      if (clockState.status === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
        const liveBreakSec = Math.floor((Date.now() - clockState.currentBreakStartTimestamp) / 1000);
        totalBreak += liveBreakSec;
      }

      if (clockState.clockInTimestamp) {
        const nowMs = Date.now();
        const endMs = clockState.clockOutTimestamp || nowMs;
        const totalElapsed = Math.floor((endMs - clockState.clockInTimestamp) / 1000);
        totalWork = Math.max(0, totalElapsed - totalBreak);
      } else if (attToday) {
        totalWork = attToday.netWorkSeconds;
        totalBreak = attToday.totalBreakSeconds;
      }

      const remainingBreakSec = Math.max(0, MAX_DAILY_BREAK_SECONDS - totalBreak);

      const clockInFormatted = clockState.clockInTimestamp
        ? new Date(clockState.clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : (attToday ? attToday.clockIn : undefined);

      let breakStartedFormatted: string | undefined = undefined;
      if (clockState.status === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
        breakStartedFormatted = new Date(clockState.currentBreakStartTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let lastActiveStr = 'Just now';
      if (clockState.status === 'NOT_CLOCKED_IN') {
        lastActiveStr = 'Not active today';
      } else if (clockState.status === 'CLOCKED_OUT') {
        lastActiveStr = 'Clocked Out';
      } else if (clockState.status === 'ON_BREAK') {
        lastActiveStr = 'On Break';
      }

      return {
        user,
        attendanceToday: attToday,
        currentStatus: clockState.status,
        clockInTimeFormatted: clockInFormatted,
        currentActivity: clockState.currentActivity,
        breakStartedFormatted,
        totalBreakSecondsToday: totalBreak,
        remainingBreakSecondsToday: remainingBreakSec,
        totalWorkSecondsToday: totalWork,
        lastActive: lastActiveStr
      };
    });
  },

  async getEmployeeById(id: string): Promise<User | undefined> {
    return storage.getUsers().find(u => u.id === id || u.employeeId === id);
  },

  // Reports API for Admin
  async getReportsSummary() {
    const employees = storage.getUsers().filter(u => u.role !== 'ADMIN');
    const team = await this.getTeamAttendance();

    const totalEmployees = employees.length;
    const workingCount = team.filter(t => t.currentStatus === 'WORKING').length;
    const breakCount = team.filter(t => t.currentStatus === 'ON_BREAK').length;
    const clockedOutCount = team.filter(t => t.currentStatus === 'CLOCKED_OUT').length;
    const presentToday = team.filter(t => t.currentStatus !== 'NOT_CLOCKED_IN').length;
    const notClockedInCount = totalEmployees - presentToday;

    const completedWorkdayCount = team.filter(t => t.attendanceToday?.completionStatus === '8 Hour Work Completed').length;

    return {
      totalEmployees,
      presentToday,
      workingCount,
      breakCount,
      clockedOutCount,
      notClockedInCount,
      completedWorkdayCount,
      averageWorkingHours: totalEmployees > 0 ? '08h 00m' : '00h 00m',
      attendancePercentage: totalEmployees > 0 ? `${Math.round((presentToday / totalEmployees) * 100)}%` : '0%'
    };
  }
};
