import { storage } from './storage';
import { supabase } from '../lib/supabase';
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
  managerName?: string;
}

export const MAX_DAILY_BREAK_SECONDS = 3600; // 60 minutes = 1 hour break cap

// Helper to map Supabase snake_case profiles to User interface
export const mapProfileToUser = (p: any): User => ({
  id: p.id,
  name: p.name,
  email: p.email,
  employeeId: p.employee_id || p.employeeId,
  department: p.department || 'Engineering',
  designation: p.designation || 'Software Engineer',
  role: p.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
  employeeType: (p.employee_type || p.employeeType) === 'Intern' ? 'Intern' : 'Employee',
  joiningDate: p.joining_date || p.joiningDate || new Date().toISOString().split('T')[0],
  profileImage: p.profile_image || p.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=0c8ee9,0270c7`,
  workLocation: p.work_location || p.workLocation || 'Work From Home',
  phone: p.phone || '+91 98765 43210',
  managerName: p.manager_name || p.managerName,
  createdAt: p.created_at || p.createdAt || new Date().toISOString()
});

export const api = {
  // Authentication - Supabase email/password login with fallback
  async login(email: string, password?: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!password) {
      throw new Error('Password is required.');
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile) {
          const user = mapProfileToUser(profile);
          storage.setCurrentUserId(user.id);
          storage.addUser(user);
          return user;
        }
      }
    } catch (e) {
      console.warn('Supabase authentication unconfigured, attempting local login:', e);
    }

    // Local Storage Fallback Login
    const users = storage.getUsers();
    const found = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      throw new Error('Account not found with this email. Please sign up or contact your Admin.');
    }

    if (found.password && password && found.password !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    storage.setCurrentUserId(found.id);
    return found;
  },

  // Employee Creation with Supabase & Local Fallback
  async addEmployee(params: AddEmployeeParams): Promise<User> {
    const users = storage.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const payload = {
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password || 'password123',
      employeeId: params.employeeId?.trim(),
      department: params.department.trim(),
      designation: params.designation.trim(),
      employeeType: params.employeeType || 'Employee',
      joiningDate: params.joiningDate || new Date().toISOString().split('T')[0],
      workLocation: params.workLocation || 'Work From Home',
      phone: params.phone || '+91 98765 43210',
      profileImage: params.profileImage?.trim()
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: payload
      });

      if (!error && data?.user) {
        const createdUser: User = mapProfileToUser(data.user);
        storage.addUser(createdUser);
        return createdUser;
      }
    } catch (e) {
      console.warn('Supabase edge function unconfigured, creating user in local storage:', e);
    }

    // Local Storage Fallback User Creation
    // SECURITY: ALWAYS assigns EMPLOYEE role — ADMIN can only be created via initial setup
    const userId = `usr_${Date.now()}`;
    const autoEmpId = params.employeeId?.trim() || `EMP${String(users.length + 1).padStart(3, '0')}`;
    const profileImage = params.profileImage?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name)}&backgroundColor=0c8ee9,0270c7`;

    // ALWAYS EMPLOYEE — never allow role escalation through the fallback path
    const assignedRole: UserRole = 'EMPLOYEE';

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

  // Update own profile (name, phone, workLocation, designation) in Supabase
  async updateProfile(userId: string, updates: { name?: string; phone?: string; workLocation?: string; designation?: string }): Promise<User> {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone.trim();
    if (updates.workLocation !== undefined) payload.work_location = updates.workLocation.trim();
    if (updates.designation !== undefined) payload.designation = updates.designation.trim();

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update profile in database.');
    }

    const updatedUser = mapProfileToUser(data);
    storage.updateUser(updatedUser);
    return updatedUser;
  },

  // Admin Action: Remove Employee
  async removeEmployee(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.warn('Supabase profile deletion warning:', error.message);
    }

    storage.deleteUser(userId);
  },

  // Fetch all profiles from Supabase (for Admin)
  async getProfiles(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return storage.getUsers();
    }

    const mapped = data.map(mapProfileToUser);
    mapped.forEach(u => storage.addUser(u));
    return mapped;
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

    const isCompleted = netWorkSec >= 28800; // 8 hours = 28,800s
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
    let employees = storage.getUsers().filter(u => u.role !== 'ADMIN');

    // Attempt to refresh from Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'ADMIN');

      if (!error && data && data.length > 0) {
        employees = data.map(mapProfileToUser);
        employees.forEach(u => storage.addUser(u));
      }
    } catch (e) {
      // Fallback to local
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceRecords = storage.getAttendanceRecords();

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
    const local = storage.getUsers().find(u => u.id === id || u.employeeId === id);
    if (local) return local;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${id},employee_id.eq.${id}`)
        .maybeSingle();

      if (data) {
        const mapped = mapProfileToUser(data);
        storage.addUser(mapped);
        return mapped;
      }
    } catch (e) {
      // Fallback
    }
    return undefined;
  },

  // Reports API for Admin - Calculated dynamically from real employee records
  async getReportsSummary() {
    const team = await this.getTeamAttendance();
    const totalEmployees = team.length;
    const workingCount = team.filter(t => t.currentStatus === 'WORKING').length;
    const breakCount = team.filter(t => t.currentStatus === 'ON_BREAK').length;
    const clockedOutCount = team.filter(t => t.currentStatus === 'CLOCKED_OUT').length;
    const presentToday = team.filter(t => t.currentStatus !== 'NOT_CLOCKED_IN').length;
    const notClockedInCount = Math.max(0, totalEmployees - presentToday);

    const completedWorkdayCount = team.filter(t => t.attendanceToday?.completionStatus === '8 Hour Work Completed').length;

    // Calculate real average working hours
    const totalWorkSec = team.reduce((acc, m) => acc + m.totalWorkSecondsToday, 0);
    const avgSec = presentToday > 0 ? Math.floor(totalWorkSec / presentToday) : 0;
    const avgHoursStr = `${Math.floor(avgSec / 3600).toString().padStart(2, '0')}h ${Math.floor((avgSec % 3600) / 60).toString().padStart(2, '0')}m`;

    const attendancePctStr = totalEmployees > 0 ? `${Math.round((presentToday / totalEmployees) * 100)}%` : '0%';

    // Dynamic Daily Work Hours for current week (Mon to Fri)
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));

    const allAttendance = storage.getAttendanceRecords();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dailyWorkData = days.map((dayName, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);
      const dateStr = targetDate.toISOString().split('T')[0];
      const isToday = dateStr === now.toISOString().split('T')[0];

      const dayRecords = allAttendance.filter(r => r.date === dateStr);
      let dayWorkHours = 0;
      let dayBreakMins = 0;

      if (dayRecords.length > 0) {
        const totalNetWork = dayRecords.reduce((acc, r) => acc + r.netWorkSeconds, 0);
        const totalBreaks = dayRecords.reduce((acc, r) => acc + r.totalBreakSeconds, 0);
        dayWorkHours = Math.round((totalNetWork / dayRecords.length / 3600) * 10) / 10;
        dayBreakMins = Math.round(totalBreaks / dayRecords.length / 60);
      } else if (isToday && presentToday > 0) {
        dayWorkHours = Math.round((totalWorkSec / presentToday / 3600) * 10) / 10;
        const totalBreakSec = team.reduce((acc, m) => acc + m.totalBreakSecondsToday, 0);
        dayBreakMins = Math.round(totalBreakSec / presentToday / 60);
      }

      return {
        day: isToday ? `${dayName} (Today)` : dayName,
        workHours: dayWorkHours,
        breakMins: dayBreakMins,
        target: 8.0
      };
    });

    // Dynamic Break Distribution from real break records
    const allBreaks = storage.getBreakRecords();
    const breakColorMap: Record<string, string> = {
      'Lunch': '#f59e0b',
      'Tea/Coffee': '#3b82f6',
      'Personal': '#8b5cf6',
      'Meeting': '#10b981',
      'Other': '#ec4899'
    };

    const breakCountMap: Record<string, number> = {
      'Lunch': 0,
      'Tea/Coffee': 0,
      'Personal': 0,
      'Meeting': 0,
      'Other': 0
    };

    allBreaks.forEach(b => {
      if (breakCountMap[b.breakType] !== undefined) {
        breakCountMap[b.breakType] += 1;
      } else {
        breakCountMap['Other'] += 1;
      }
    });

    const totalBreaksCount = Object.values(breakCountMap).reduce((a, b) => a + b, 0);
    const breakDistributionData = totalBreaksCount > 0
      ? Object.entries(breakCountMap)
          .filter(([_, val]) => val > 0)
          .map(([name, val]) => ({
            name,
            value: Math.round((val / totalBreaksCount) * 100),
            color: breakColorMap[name] || '#64748b'
          }))
      : [];

    // Dynamic Monthly Trend from real records
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendData = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const mYear = d.getFullYear();
      const mRecords = allAttendance.filter(r => {
        const rd = new Date(r.date);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === mYear;
      });

      const mPresent = mRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const mPct = totalEmployees > 0 && mRecords.length > 0 ? Math.min(100, Math.round((mPresent / (totalEmployees * 20)) * 100)) : 0;
      const mAvgHours = mRecords.length > 0
        ? Math.round((mRecords.reduce((acc, r) => acc + r.netWorkSeconds, 0) / mRecords.length / 3600) * 10) / 10
        : 0;

      monthlyTrendData.push({
        month: mName,
        attendancePct: mPct,
        avgHours: mAvgHours
      });
    }

    return {
      totalEmployees,
      presentToday,
      workingCount,
      breakCount,
      clockedOutCount,
      notClockedInCount,
      completedWorkdayCount,
      averageWorkingHours: avgHoursStr,
      attendancePercentage: attendancePctStr,
      dailyWorkData,
      breakDistributionData,
      monthlyTrendData
    };
  }
};
