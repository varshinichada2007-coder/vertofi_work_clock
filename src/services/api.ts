import { storage } from './storage';
import { supabaseDb } from './supabaseDb';
import {
  User, AttendanceRecord, BreakRecord, WorkSession, ActivityRecord,
  TeamMemberStatus, BreakType, EmployeeStatus, UserRole, EmployeeType,
  LeaveRequest, AttendanceCorrectionRequest, AuditLog, NotificationItem,
  WorkScheduleConfig, DaySchedule, Organization, AssignedTask,
  TaskPriority, TaskStatus
} from '../types';

export interface AddEmployeeParams {
  name: string;
  email: string;
  password?: string;
  employeeId?: string;
  department: string;
  designation: string;
  employeeType?: EmployeeType;
  role?: UserRole;
  joiningDate?: string;
  workLocation?: string;
  phone?: string;
  profileImage?: string;
  managerName?: string;
  organizationId?: string;
}

export const MAX_DAILY_BREAK_SECONDS = 3600; // 60 minutes break cap

export const api = {
  // --- Authentication ---
  async login(email: string, password?: string, secretCode?: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!password) {
      throw new Error('Password is required.');
    }

    // 1. Sync latest profiles from Supabase cloud database
    try {
      await supabaseDb.checkAndSeedDefaults();
      const remoteUsers = await supabaseDb.getProfiles();
      if (remoteUsers && remoteUsers.length > 0) {
        storage.setUsers(remoteUsers);
      }
    } catch (e) {
      console.warn('Supabase sync during login:', e);
    }

    const allUsers = storage.getAllUsers();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      throw new Error('Account not found with this email. Please check your credentials or contact your Administrator.');
    }

    if (found.status === 'DEACTIVATED') {
      throw new Error('This account has been deactivated. Please contact your organization administrator.');
    }

    // Admin Secret Code verification for Administrator access
    if (found.role === 'ADMIN') {
      const trimmedSecret = secretCode?.trim();
      if (!trimmedSecret) {
        throw new Error('Admin Secret Code is required to access the Admin Portal.');
      }
      if (trimmedSecret !== 'Goutham01') {
        throw new Error('Invalid Admin Secret Code. Access to Admin Portal denied.');
      }
    }

    const PASSWORD_LOOKUP: Record<string, string> = {
      'gouthambadiga01@gmail.com': 'Vertofi@Fintech12',
      'parvathamgeethika@gmail.com': 'Geethika@123',
      'varshinichada2007@gmail.com': 'Varshini@123',
      'dasaripravallika137@gmail.com': 'Pravallika@123',
      'lohithpolamuri630@gmail.com': 'Lohith@123',
      'mdsuhana231@gmail.com': 'Suhana@123'
    };

    const trimmedInputPassword = password.trim();
    const expectedPassword = found.password || PASSWORD_LOOKUP[trimmedEmail] || 'password123';
    
    // Check if entered password matches found password, default lookup, or standard name format
    const nameParts = found.name.split(' ');
    const isNamePassword = nameParts.some(part => trimmedInputPassword.toLowerCase() === `${part.toLowerCase()}@123`);

    const isPasswordValid = 
      trimmedInputPassword === expectedPassword ||
      trimmedInputPassword === PASSWORD_LOOKUP[trimmedEmail] ||
      (found.password && trimmedInputPassword === found.password) ||
      isNamePassword;

    if (!isPasswordValid) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    storage.setCurrentUserId(found.id);
    storage.setCurrentOrgId(found.organizationId);
    return found;
  },

  async logout(): Promise<void> {
    storage.setCurrentUserId(null);
  },

  async verifyEmailForReset(email: string): Promise<{ success: boolean; name: string; email: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) throw new Error('Please enter your work email address.');

    // 1. Sync profiles from Supabase if connected
    try {
      const remoteUsers = await supabaseDb.getProfiles();
      if (remoteUsers && remoteUsers.length > 0) {
        storage.setUsers(remoteUsers);
      }
    } catch (e) {
      console.warn('Supabase profile sync check:', e);
    }

    const allUsers = storage.getAllUsers();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      throw new Error('No account found with this email address. Please check your credentials or contact your administrator.');
    }

    if (found.status === 'DEACTIVATED') {
      throw new Error('This account has been deactivated. Please contact your administrator.');
    }

    return { success: true, name: found.name, email: found.email };
  },

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // Check user existence
    let allUsers = storage.getAllUsers();
    let found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      try {
        const remoteUsers = await supabaseDb.getProfiles();
        if (remoteUsers && remoteUsers.length > 0) {
          storage.setUsers(remoteUsers);
          allUsers = remoteUsers;
          found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!found) {
      throw new Error('No account registered with this email.');
    }

    // 1. Update in local storage
    const updatedUser: User = {
      ...found,
      password: newPassword,
      updatedAt: new Date().toISOString()
    };
    storage.updateUser(updatedUser);

    // 2. Update in Supabase cloud database
    try {
      await supabaseDb.updatePasswordByEmail(trimmedEmail, newPassword);
    } catch (e) {
      console.warn('Supabase password update error:', e);
    }

    // 3. Add Audit Log
    try {
      storage.addAuditLog({
        organizationId: found.organizationId,
        action: 'PASSWORD_RESET',
        targetUserId: found.id,
        targetUserName: found.name,
        targetEmployeeId: found.employeeId,
        fieldName: 'password',
        originalValue: '••••••••',
        newValue: '••••••••',
        changedByUserId: found.id,
        changedByUserName: found.name,
        changedByRole: found.role,
        reason: 'User initiated password reset'
      });
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    };
  },

  // --- Organization Management ---
  async getOrganizations(): Promise<Organization[]> {
    return storage.getOrganizations();
  },

  async getCurrentOrganization(): Promise<Organization> {
    return storage.getCurrentOrganization();
  },

  async switchOrganization(orgId: string): Promise<Organization> {
    storage.setCurrentOrgId(orgId);
    return storage.getCurrentOrganization();
  },

  async updateOrganizationSettings(updates: Partial<Organization>): Promise<Organization> {
    const current = storage.getCurrentOrganization();
    const updated: Organization = {
      ...current,
      ...updates
    };
    storage.updateOrganization(updated);

    // Write audit log
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const log = {
        organizationId: current.id,
        action: 'SCHEDULE_UPDATE' as const,
        fieldName: 'organization_settings',
        originalValue: JSON.stringify(current),
        newValue: JSON.stringify(updated),
        changedByUserId: currentUser.id,
        changedByUserName: currentUser.name,
        changedByRole: currentUser.role,
        reason: 'Updated organization settings and working hours.'
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    return updated;
  },

  // --- Work Schedule Management ---
  async getWorkSchedule(orgId?: string): Promise<WorkScheduleConfig> {
    return storage.getWorkSchedule(orgId);
  },

  async updateWorkSchedule(config: WorkScheduleConfig): Promise<WorkScheduleConfig> {
    storage.saveWorkSchedule(config);
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const log = {
        organizationId: config.organizationId,
        action: 'SCHEDULE_UPDATE' as const,
        fieldName: 'work_schedule',
        originalValue: 'Previous Schedule',
        newValue: `Schedule updated with ${config.schedules.filter(s => s.isWorkday).length} active workdays`,
        changedByUserId: currentUser.id,
        changedByUserName: currentUser.name,
        changedByRole: currentUser.role,
        reason: 'Updated company standard working schedule.'
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }
    return config;
  },

  // --- Employee Management ---
  async getEmployees(orgId?: string): Promise<User[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getProfiles(targetOrg);
      if (remote && remote.length > 0) {
        const otherUsers = storage.getAllUsers().filter(u => u.organizationId !== targetOrg);
        storage.setUsers([...otherUsers, ...remote]);
        return remote;
      }
    } catch (e) {
      console.warn('Supabase getEmployees fallback:', e);
    }
    return storage.getUsers(targetOrg);
  },

  async getEmployeeById(id: string): Promise<User | undefined> {
    return storage.getUserById(id);
  },

  async addEmployee(params: AddEmployeeParams): Promise<User> {
    const currentOrgId = params.organizationId || storage.getCurrentOrgId();
    const existingUsers = await this.getEmployees(currentOrgId);
    const existing = existingUsers.find(u => u.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists in this organization.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const autoEmpId = params.employeeId?.trim() || `EMP${String(existingUsers.length + 101).padStart(3, '0')}`;
    const profileImage = params.profileImage?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name)}&backgroundColor=0c8ee9,0270c7`;

    const newUser: User = {
      id: userId,
      organizationId: currentOrgId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password || 'password123',
      employeeId: autoEmpId,
      department: params.department.trim(),
      designation: params.designation.trim(),
      role: params.role || 'EMPLOYEE',
      employeeType: params.employeeType || 'Employee',
      joiningDate: params.joiningDate || new Date().toISOString().split('T')[0],
      profileImage,
      workLocation: params.workLocation || 'Work From Home',
      phone: params.phone || '+91 98765 43210',
      managerName: params.managerName || 'Goutham Badiga (Admin)',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    storage.addUser(newUser);
    supabaseDb.upsertProfile(newUser).catch(e => console.warn('Supabase addEmployee err:', e));

    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const log = {
        organizationId: currentOrgId,
        action: 'EMPLOYEE_STATUS_CHANGE' as const,
        targetUserId: newUser.id,
        targetUserName: newUser.name,
        targetEmployeeId: newUser.employeeId,
        fieldName: 'account_created',
        originalValue: 'None',
        newValue: 'ACTIVE',
        changedByUserId: currentUser.id,
        changedByUserName: currentUser.name,
        changedByRole: currentUser.role,
        reason: `New employee created (${newUser.designation} - ${newUser.department})`
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    return newUser;
  },

  async updateEmployee(userId: string, updates: Partial<User>): Promise<User> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('Employee not found.');

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    storage.updateUser(updatedUser);
    supabaseDb.upsertProfile(updatedUser).catch(e => console.warn('Supabase updateEmployee err:', e));

    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const log = {
        organizationId: user.organizationId,
        action: 'EMPLOYEE_STATUS_CHANGE' as const,
        targetUserId: user.id,
        targetUserName: user.name,
        targetEmployeeId: user.employeeId,
        fieldName: 'profile_update',
        originalValue: JSON.stringify({ name: user.name, dept: user.department, desig: user.designation }),
        newValue: JSON.stringify({ name: updatedUser.name, dept: updatedUser.department, desig: updatedUser.designation }),
        changedByUserId: currentUser.id,
        changedByUserName: currentUser.name,
        changedByRole: currentUser.role,
        reason: 'Employee profile information updated by Admin.'
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    return updatedUser;
  },

  async toggleEmployeeStatus(userId: string): Promise<User> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('Employee not found.');

    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    const updatedUser: User = {
      ...user,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    storage.updateUser(updatedUser);
    supabaseDb.upsertProfile(updatedUser).catch(e => console.warn('Supabase toggleEmployee err:', e));

    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      const log = {
        organizationId: user.organizationId,
        action: 'EMPLOYEE_STATUS_CHANGE' as const,
        targetUserId: user.id,
        targetUserName: user.name,
        targetEmployeeId: user.employeeId,
        fieldName: 'status',
        originalValue: user.status,
        newValue: newStatus,
        changedByUserId: currentUser.id,
        changedByUserName: currentUser.name,
        changedByRole: currentUser.role,
        reason: `Employee account was ${newStatus.toLowerCase()} by Admin.`
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    return updatedUser;
  },

  // --- Today's Live Attendance & Clock State ---
  async getTodayAttendance(userId: string): Promise<{
    activeClockState: ReturnType<typeof storage.getActiveClockState>;
    attendanceRecord?: AttendanceRecord;
  }> {
    const user = storage.getUserById(userId);
    const orgId = user?.organizationId || storage.getCurrentOrgId();
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch fresh cloud records from Supabase
    let records = storage.getAttendanceRecords(orgId);
    try {
      const remote = await supabaseDb.getAttendanceRecords(orgId);
      if (remote !== null) {
        storage.setAttendanceRecords(remote);
        records = remote;
      }
    } catch (e) {
      console.warn('Supabase sync in getTodayAttendance:', e);
    }

    const todayRecord = records.find(r => r.userId === userId && r.date === todayStr);
    let activeClockState = storage.getActiveClockState(userId);

    if (todayRecord) {
      let status: EmployeeStatus = 'NOT_CLOCKED_IN';
      if (todayRecord.clockOutTimestamp || (todayRecord.clockOut && todayRecord.clockOut !== '—')) {
        status = 'CLOCKED_OUT';
      } else if (todayRecord.status === 'ON_BREAK') {
        status = 'ON_BREAK';
      } else if (todayRecord.clockInTimestamp || (todayRecord.clockIn && todayRecord.clockIn !== '—')) {
        status = 'WORKING';
      }

      activeClockState = {
        status,
        clockInTimestamp: todayRecord.clockInTimestamp || activeClockState.clockInTimestamp,
        clockOutTimestamp: todayRecord.clockOutTimestamp || activeClockState.clockOutTimestamp,
        accumulatedBreakSeconds: todayRecord.totalBreakSeconds || 0,
        currentBreakStartTimestamp: status === 'ON_BREAK' ? (activeClockState.currentBreakStartTimestamp || Date.now()) : null,
        currentBreakType: status === 'ON_BREAK' ? (activeClockState.currentBreakType || 'Personal') : null,
        currentActivity: todayRecord.currentActivity || todayRecord.initialTask || 'Working',
        initialTask: todayRecord.initialTask || 'Work Shift',
        attendanceId: todayRecord.id,
        todayDateStr: todayStr
      };
      storage.setActiveClockState(userId, activeClockState);
    }

    return { activeClockState, attendanceRecord: todayRecord };
  },

  // --- Clock In Transaction ---
  async clockIn(userId: string, initialTask: string): Promise<{ success: boolean; message: string; state: any }> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

    const currentState = storage.getActiveClockState(userId);
    if (currentState.status !== 'NOT_CLOCKED_IN') {
      throw new Error('You are already clocked in for today.');
    }

    // Backend-generated server timestamp
    const now = new Date();
    const nowMs = now.getTime();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    // Late Detection against configured organization schedule
    const scheduleConfig = storage.getWorkSchedule(orgId);
    const daySched = scheduleConfig.schedules.find(s => s.day === dayName);
    const expectedStart = daySched?.startTime || '09:00';
    const [expHourStr, expMinStr] = expectedStart.split(':');
    const targetHour = parseInt(expHourStr, 10);
    const targetMin = parseInt(expMinStr, 10);
    const graceMin = scheduleConfig.lateGraceMinutes || 15;

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let isLate = false;
    let lateMinutes = 0;

    const totalCurrentMins = currentHour * 60 + currentMin;
    const totalExpectedMins = targetHour * 60 + targetMin;

    if (totalCurrentMins > totalExpectedMins + graceMin) {
      isLate = true;
      lateMinutes = totalCurrentMins - totalExpectedMins;
    }

    const attendanceId = `att_${todayStr}_${userId}`;
    const attendanceStatus: AttendanceRecord['status'] = isLate ? 'LATE' : 'WORKING';

    const attendanceRecord: AttendanceRecord = {
      id: attendanceId,
      organizationId: orgId,
      userId,
      date: todayStr,
      dayName,
      clockIn: timeFormatted,
      clockInTimestamp: nowMs,
      totalDurationSeconds: 0,
      totalBreakSeconds: 0,
      netWorkSeconds: 0,
      overtimeSeconds: 0,
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
    try {
      await supabaseDb.upsertProfile(user);
      await supabaseDb.upsertAttendanceRecord(attendanceRecord);
    } catch (e) {
      console.warn('Supabase clockIn sync warning:', e);
    }

    const initialSession: WorkSession = {
      id: `ses_${Date.now()}`,
      organizationId: orgId,
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
      organizationId: orgId,
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

    const lateNotice = isLate ? ` (Late by ${lateMinutes}m)` : '';
    storage.addTimelineEvent(userId, {
      organizationId: orgId,
      userId,
      timestamp: timeFormatted,
      title: 'Clocked In',
      subtitle: `Started workday${lateNotice} — Task: ${initialTask}`,
      type: 'CLOCK_IN'
    });

    // Notify Admin if employee is late
    if (isLate) {
      storage.addNotification({
        organizationId: orgId,
        targetRole: 'ADMIN',
        title: 'Late Arrival Detected',
        message: `${user.name} (${user.employeeId}) clocked in late at ${timeFormatted} (${lateMinutes} minutes late).`,
        type: 'warning'
      });
    }

    return {
      success: true,
      message: `Clocked in successfully at ${timeFormatted}${lateNotice}.`,
      state: newState
    };
  },

  // --- Start Break Transaction ---
  async startBreak(userId: string, breakType: BreakType, notes?: string): Promise<{ success: boolean; message: string; state: any }> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

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
        organizationId: orgId,
        attendanceId: currentState.attendanceId,
        userId,
        breakType,
        startTime: now.toISOString(),
        durationSeconds: 0,
        notes
      };
      storage.saveBreakRecord(breakRec);
      try {
        await supabaseDb.upsertBreakRecord(breakRec);
      } catch (e) {
        console.warn('Supabase break record warning:', e);
      }

      // Update today's attendance record status
      const records = storage.getAttendanceRecords(orgId);
      const todayRecord = records.find(r => r.id === currentState.attendanceId);
      if (todayRecord) {
        todayRecord.status = 'ON_BREAK';
        todayRecord.completionStatus = 'On Break';
        todayRecord.updatedAt = now.toISOString();
        storage.saveAttendanceRecord(todayRecord);
        try {
          await supabaseDb.upsertAttendanceRecord(todayRecord);
        } catch (e) {
          console.warn('Supabase attendance status warning:', e);
        }
      }
    }

    storage.addTimelineEvent(userId, {
      organizationId: orgId,
      userId,
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

  // --- End Break Transaction ---
  async endBreak(userId: string): Promise<{ success: boolean; message: string; state: any }> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

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

    const breaks = storage.getBreakRecords(orgId);
    const activeBreak = breaks.find(b => b.userId === userId && !b.endTime);
    if (activeBreak) {
      activeBreak.endTime = now.toISOString();
      activeBreak.durationSeconds = breakDurationSec;
      storage.saveBreakRecord(activeBreak);
      try {
        await supabaseDb.upsertBreakRecord(activeBreak);
      } catch (e) {
        console.warn('Supabase endBreak break warning:', e);
      }
    }

    const records = storage.getAttendanceRecords(orgId);
    const todayRecord = records.find(r => r.id === currentState.attendanceId);
    if (todayRecord) {
      todayRecord.totalBreakSeconds = newAccumulatedBreak;
      todayRecord.status = 'WORKING';
      todayRecord.completionStatus = 'Working';
      todayRecord.updatedAt = now.toISOString();
      storage.saveAttendanceRecord(todayRecord);
      try {
        await supabaseDb.upsertAttendanceRecord(todayRecord);
      } catch (e) {
        console.warn('Supabase endBreak att warning:', e);
      }
    }

    storage.addTimelineEvent(userId, {
      organizationId: orgId,
      userId,
      timestamp: timeFormatted,
      title: 'Break Ended',
      subtitle: `Returned to work. Remaining allowance: ${remainingMins}m`,
      type: 'BREAK_END'
    });

    return {
      success: true,
      message: `Break ended. You have ${remainingMins}m of break time remaining today.`,
      state: newState
    };
  },

  // --- Clock Out Transaction ---
  async clockOut(userId: string, endNotes?: string): Promise<{ success: boolean; message: string; state: any }> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

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

    // Exact backend server timestamp
    const now = new Date();
    const nowMs = now.getTime();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const clockInMs = currentState.clockInTimestamp || nowMs;
    const totalElapsedSec = Math.floor((nowMs - clockInMs) / 1000);
    const breakSec = currentState.accumulatedBreakSeconds;
    const netWorkSec = Math.max(0, totalElapsedSec - breakSec);

    // Standard required work hours (e.g. 8 hours = 28,800s)
    const scheduleConfig = storage.getWorkSchedule(orgId);
    const requiredHours = scheduleConfig.overtimeThresholdHours || 8;
    const requiredSeconds = requiredHours * 3600;

    const overtimeSec = Math.max(0, netWorkSec - requiredSeconds);
    const isCompleted = netWorkSec >= requiredSeconds;
    const completionStatus = isCompleted ? '8 Hour Work Completed' : 'Workday Incomplete';

    const newState = {
      ...currentState,
      status: 'CLOCKED_OUT' as EmployeeStatus,
      clockOutTimestamp: nowMs
    };
    storage.setActiveClockState(userId, newState);

    const records = storage.getAttendanceRecords(orgId);
    const todayRecord = records.find(r => r.id === currentState.attendanceId);
    if (todayRecord) {
      todayRecord.clockOut = timeFormatted;
      todayRecord.clockOutTimestamp = nowMs;
      todayRecord.totalDurationSeconds = totalElapsedSec;
      todayRecord.totalBreakSeconds = breakSec;
      todayRecord.netWorkSeconds = netWorkSec;
      todayRecord.overtimeSeconds = overtimeSec;
      todayRecord.status = todayRecord.isLate ? 'LATE' : 'PRESENT';
      todayRecord.completionStatus = completionStatus;
      todayRecord.endNotes = endNotes;
      todayRecord.updatedAt = now.toISOString();
      storage.saveAttendanceRecord(todayRecord);
      try {
        await supabaseDb.upsertAttendanceRecord(todayRecord);
      } catch (e) {
        console.warn('Supabase clockOut warning:', e);
      }
    }

    const sessions = storage.getWorkSessions(orgId);
    const activeSession = sessions.find(s => s.userId === userId && s.status === 'Working');
    if (activeSession) {
      activeSession.endTime = now.toISOString();
      activeSession.durationSeconds = Math.floor((nowMs - new Date(activeSession.startTime).getTime()) / 1000);
      activeSession.status = 'Completed';
      storage.saveWorkSession(activeSession);
    }

    const overtimeStr = overtimeSec > 0 ? ` (Overtime: ${Math.floor(overtimeSec / 3600)}h ${Math.floor((overtimeSec % 3600) / 60)}m)` : '';

    storage.addTimelineEvent(userId, {
      organizationId: orgId,
      userId,
      timestamp: timeFormatted,
      title: 'Clocked Out',
      subtitle: `Status: ${completionStatus}. Net Work: ${Math.floor(netWorkSec / 3600)}h ${Math.floor((netWorkSec % 3600) / 60)}m${overtimeStr}`,
      type: 'CLOCK_OUT'
    });

    return {
      success: true,
      message: `Workday finished at ${timeFormatted}. Net Work: ${Math.floor(netWorkSec / 3600)}h ${Math.floor((netWorkSec % 3600) / 60)}m.`,
      state: newState
    };
  },

  // --- Task & Activity Tracker ---
  async updateActivity(userId: string, newActivity: string, status: 'Working' | 'Completed' | 'Paused' = 'Working'): Promise<{ success: boolean; state: any }> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

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
      organizationId: orgId,
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
      const records = storage.getAttendanceRecords(orgId);
      const rec = records.find(r => r.id === currentState.attendanceId);
      if (rec) {
        rec.currentActivity = newActivity;
        storage.saveAttendanceRecord(rec);
        supabaseDb.upsertAttendanceRecord(rec).catch(e => console.warn('Supabase updateActivity err:', e));
      }
    }

    storage.addTimelineEvent(userId, {
      organizationId: orgId,
      userId,
      timestamp: timeFormatted,
      title: 'Activity Updated',
      subtitle: newActivity,
      type: 'TASK_UPDATE'
    });

    return { success: true, state: newState };
  },

  // --- History & Logs ---
  async getAttendanceHistory(userId: string, orgId?: string): Promise<AttendanceRecord[]> {
    const user = storage.getUserById(userId);
    const targetOrg = orgId || user?.organizationId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getAttendanceRecords(targetOrg);
      if (remote !== null) {
        storage.setAttendanceRecords(remote);
        return remote.filter(r => r.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (e) {
      console.warn('Supabase getAttendanceHistory fallback:', e);
    }
    const all = storage.getAttendanceRecords(targetOrg);
    return all.filter(r => r.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getAllAttendanceRecords(orgId?: string): Promise<AttendanceRecord[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getAttendanceRecords(targetOrg);
      if (remote !== null) {
        storage.setAttendanceRecords(remote);
        return remote.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (e) {
      console.warn('Supabase getAllAttendanceRecords fallback:', e);
    }
    return storage.getAttendanceRecords(targetOrg).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getWorkSessions(userId: string): Promise<WorkSession[]> {
    const user = storage.getUserById(userId);
    const targetOrg = user?.organizationId || storage.getCurrentOrgId();
    return storage.getWorkSessions(targetOrg).filter(s => s.userId === userId);
  },

  async getBreakHistory(userId: string): Promise<BreakRecord[]> {
    const user = storage.getUserById(userId);
    const targetOrg = user?.organizationId || storage.getCurrentOrgId();
    try {
      const remoteBreaks = await supabaseDb.getBreakRecords();
      if (remoteBreaks && remoteBreaks.length > 0) {
        return remoteBreaks.filter(b => b.userId === userId);
      }
    } catch (e) {
      console.warn('Supabase getBreakHistory fallback:', e);
    }
    return storage.getBreakRecords(targetOrg).filter(b => b.userId === userId);
  },

  async getActivityLog(userId: string): Promise<ActivityRecord[]> {
    const user = storage.getUserById(userId);
    const targetOrg = user?.organizationId || storage.getCurrentOrgId();
    return storage.getActivityRecords(targetOrg).filter(a => a.userId === userId);
  },

  // --- Live Team Status (Admin Dashboard & Attendance Table) ---
  async getTeamAttendance(orgId?: string): Promise<TeamMemberStatus[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    await Promise.allSettled([
      this.getEmployees(targetOrg),
      this.getAllAttendanceRecords(targetOrg)
    ]);
    const employees = storage.getUsers(targetOrg).filter(u => u.role !== 'ADMIN');
    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceRecords = storage.getAttendanceRecords(targetOrg);

    return employees.map(user => {
      const attToday = attendanceRecords.find(r => r.date === todayStr && r.userId === user.id);
      const clockState = storage.getActiveClockState(user.id);

      let effectiveStatus: EmployeeStatus = 'NOT_CLOCKED_IN';
      let effectiveActivity = 'Not clocked in';
      let effectiveClockInTs: number | null = null;
      let effectiveClockOutTs: number | null = null;
      let totalBreak = 0;

      if (attToday) {
        effectiveClockInTs = attToday.clockInTimestamp || (attToday.clockIn && attToday.clockIn !== '—' ? clockState.clockInTimestamp : null);
        effectiveClockOutTs = attToday.clockOutTimestamp || (attToday.clockOut && attToday.clockOut !== '—' ? clockState.clockOutTimestamp : null);
        totalBreak = attToday.totalBreakSeconds || 0;
        effectiveActivity = attToday.currentActivity || attToday.initialTask || 'Working';

        if (attToday.clockOutTimestamp || (attToday.clockOut && attToday.clockOut !== '—')) {
          effectiveStatus = 'CLOCKED_OUT';
        } else if (attToday.status === 'ON_BREAK') {
          effectiveStatus = 'ON_BREAK';
          if (clockState.currentBreakStartTimestamp) {
            totalBreak += Math.floor((Date.now() - clockState.currentBreakStartTimestamp) / 1000);
          }
        } else if (attToday.clockInTimestamp || (attToday.clockIn && attToday.clockIn !== '—') || attToday.status === 'WORKING' || attToday.status === 'LATE' || attToday.status === 'PRESENT') {
          effectiveStatus = 'WORKING';
        } else if (attToday.status === 'LEAVE') {
          effectiveStatus = 'NOT_CLOCKED_IN';
          effectiveActivity = 'On Approved Leave';
        }
      } else if (clockState && clockState.todayDateStr === todayStr && clockState.status !== 'NOT_CLOCKED_IN') {
        // Fallback to local clock state if on the same browser
        effectiveStatus = clockState.status;
        effectiveActivity = clockState.currentActivity;
        effectiveClockInTs = clockState.clockInTimestamp;
        effectiveClockOutTs = clockState.clockOutTimestamp;
        totalBreak = clockState.accumulatedBreakSeconds || 0;
        if (effectiveStatus === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
          totalBreak += Math.floor((Date.now() - clockState.currentBreakStartTimestamp) / 1000);
        }
      }

      let totalWork = 0;
      if (effectiveClockInTs) {
        const nowMs = Date.now();
        const endMs = effectiveClockOutTs || nowMs;
        const totalElapsed = Math.floor((endMs - effectiveClockInTs) / 1000);
        totalWork = Math.max(0, totalElapsed - totalBreak);
      } else if (attToday) {
        totalWork = attToday.netWorkSeconds || 0;
        totalBreak = attToday.totalBreakSeconds || 0;
      }

      const remainingBreakSec = Math.max(0, MAX_DAILY_BREAK_SECONDS - totalBreak);
      const overtimeSec = Math.max(0, totalWork - 28800);

      const clockInFormatted = effectiveClockInTs
        ? new Date(effectiveClockInTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : (attToday?.clockIn && attToday.clockIn !== '—' ? attToday.clockIn : undefined);

      let breakStartedFormatted: string | undefined = undefined;
      if (effectiveStatus === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
        breakStartedFormatted = new Date(clockState.currentBreakStartTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let lastActiveStr = 'Active now';
      if (user.status === 'DEACTIVATED') {
        lastActiveStr = 'Deactivated';
      } else if (effectiveStatus === 'NOT_CLOCKED_IN') {
        lastActiveStr = attToday?.status === 'LEAVE' ? 'On Leave' : 'Not clocked in';
      } else if (effectiveStatus === 'CLOCKED_OUT') {
        lastActiveStr = 'Clocked Out';
      } else if (effectiveStatus === 'ON_BREAK') {
        lastActiveStr = 'On Break';
      }

      return {
        user,
        attendanceToday: attToday,
        currentStatus: effectiveStatus,
        clockInTimeFormatted: clockInFormatted,
        currentActivity: effectiveActivity,
        breakStartedFormatted,
        totalBreakSecondsToday: totalBreak,
        remainingBreakSecondsToday: remainingBreakSec,
        totalWorkSecondsToday: totalWork,
        overtimeSecondsToday: overtimeSec,
        lastActive: lastActiveStr
      };
    });
  },

  // --- Leave Management ---
  async getLeaveRequests(orgId?: string, userId?: string): Promise<LeaveRequest[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getLeaveRequests(targetOrg);
      if (remote !== null) {
        storage.setLeaveRequests(remote);
        return userId ? remote.filter(r => r.userId === userId) : remote;
      }
    } catch (e) {
      console.warn('Supabase getLeaveRequests fallback:', e);
    }
    const all = storage.getLeaveRequests(targetOrg);
    if (userId) {
      return all.filter(r => r.userId === userId);
    }
    return all;
  },

  async submitLeaveRequest(params: {
    userId: string;
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    const user = storage.getUserById(params.userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const newRequest: LeaveRequest = {
      id: `lvr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      employeeId: user.employeeId,
      department: user.department,
      leaveType: params.leaveType,
      startDate: params.startDate,
      endDate: params.endDate,
      daysCount: daysDiff,
      reason: params.reason,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    storage.saveLeaveRequest(newRequest);
    supabaseDb.upsertLeaveRequest(newRequest).catch(e => console.warn('Supabase submitLeave err:', e));

    // Notify Admins
    storage.addNotification({
      organizationId: orgId,
      targetRole: 'ADMIN',
      title: 'New Leave Request',
      message: `${user.name} applied for ${daysDiff} day(s) ${params.leaveType} (${params.startDate} to ${params.endDate}).`,
      type: 'info'
    });

    return newRequest;
  },

  async reviewLeaveRequest(requestId: string, status: 'Approved' | 'Rejected', adminRemarks?: string): Promise<LeaveRequest> {
    const orgId = storage.getCurrentOrgId();
    const requests = storage.getLeaveRequests(orgId);
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error('Leave request not found.');

    const adminUser = storage.getCurrentUser();
    const adminName = adminUser?.name || 'Administrator';

    req.status = status;
    req.adminRemarks = adminRemarks;
    req.reviewedBy = adminName;
    req.reviewedAt = new Date().toISOString();
    storage.saveLeaveRequest(req);
    supabaseDb.upsertLeaveRequest(req).catch(e => console.warn('Supabase reviewLeave err:', e));

    // If Approved, automatically mark attendance record as LEAVE for the dates
    if (status === 'Approved') {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        const attId = `att_${dateStr}_${req.userId}`;

        const leaveAttRecord: AttendanceRecord = {
          id: attId,
          organizationId: req.organizationId,
          userId: req.userId,
          date: dateStr,
          dayName,
          clockIn: '—',
          clockInTimestamp: 0,
          totalDurationSeconds: 0,
          totalBreakSeconds: 0,
          netWorkSeconds: 0,
          overtimeSeconds: 0,
          status: 'LEAVE',
          completionStatus: 'On Leave',
          isLate: false,
          lateMinutes: 0,
          leaveType: req.leaveType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        storage.saveAttendanceRecord(leaveAttRecord);
        supabaseDb.upsertAttendanceRecord(leaveAttRecord).catch(e => console.warn('Supabase leave att err:', e));
        current.setDate(current.getDate() + 1);
      }

      // Add audit log
      const log = {
        organizationId: req.organizationId,
        action: 'LEAVE_APPROVAL' as const,
        targetUserId: req.userId,
        targetUserName: req.userName,
        targetEmployeeId: req.employeeId,
        fieldName: 'attendance_status',
        originalValue: 'ABSENT / PENDING',
        newValue: 'LEAVE',
        changedByUserId: adminUser?.id || 'f45bd396-988c-4f4a-8c85-f203722a1d41',
        changedByUserName: adminName,
        changedByRole: 'ADMIN' as UserRole,
        reason: `Approved ${req.leaveType} for ${req.startDate} to ${req.endDate}. Remarks: ${adminRemarks || 'None'}`
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    // Notify Employee
    storage.addNotification({
      organizationId: req.organizationId,
      userId: req.userId,
      targetRole: 'EMPLOYEE',
      title: `Leave Request ${status}`,
      message: `Your ${req.leaveType} request for ${req.startDate} has been ${status.toLowerCase()} by ${adminName}.`,
      type: status === 'Approved' ? 'success' : 'error'
    });

    return req;
  },

  // --- Attendance Correction / Regularization ---
  async getCorrectionRequests(orgId?: string, userId?: string): Promise<AttendanceCorrectionRequest[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getCorrectionRequests(targetOrg);
      if (remote !== null) {
        storage.setCorrectionRequests(remote);
        return userId ? remote.filter(r => r.userId === userId) : remote;
      }
    } catch (e) {
      console.warn('Supabase getCorrectionRequests fallback:', e);
    }
    const all = storage.getCorrectionRequests(targetOrg);
    if (userId) {
      return all.filter(r => r.userId === userId);
    }
    return all;
  },

  async submitCorrectionRequest(params: {
    userId: string;
    date: string;
    requestedClockIn: string;
    requestedClockOut: string;
    reason: string;
  }): Promise<AttendanceCorrectionRequest> {
    const user = storage.getUserById(params.userId);
    if (!user) throw new Error('User not found.');
    const orgId = user.organizationId;

    const existingRecords = storage.getAttendanceRecords(orgId);
    const existingRec = existingRecords.find(r => r.userId === params.userId && r.date === params.date);

    const newRequest: AttendanceCorrectionRequest = {
      id: `crq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      employeeId: user.employeeId,
      department: user.department,
      date: params.date,
      originalClockIn: existingRec?.clockIn,
      originalClockOut: existingRec?.clockOut,
      requestedClockIn: params.requestedClockIn,
      requestedClockOut: params.requestedClockOut,
      reason: params.reason,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    storage.saveCorrectionRequest(newRequest);
    supabaseDb.upsertCorrectionRequest(newRequest).catch(e => console.warn('Supabase submitCorrection err:', e));

    // Notify Admin
    storage.addNotification({
      organizationId: orgId,
      targetRole: 'ADMIN',
      title: 'Attendance Correction Request',
      message: `${user.name} requested attendance correction for date ${params.date}.`,
      type: 'warning'
    });

    return newRequest;
  },

  async reviewCorrectionRequest(requestId: string, status: 'Approved' | 'Rejected', adminRemarks?: string): Promise<AttendanceCorrectionRequest> {
    const orgId = storage.getCurrentOrgId();
    const requests = storage.getCorrectionRequests(orgId);
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error('Correction request not found.');

    const adminUser = storage.getCurrentUser();
    const adminName = adminUser?.name || 'Administrator';

    req.status = status;
    req.adminRemarks = adminRemarks;
    req.reviewedBy = adminName;
    req.reviewedAt = new Date().toISOString();
    storage.saveCorrectionRequest(req);
    supabaseDb.upsertCorrectionRequest(req).catch(e => console.warn('Supabase reviewCorrection err:', e));

    // If Approved, update the historical attendance record and log to Audit Log
    if (status === 'Approved') {
      const records = storage.getAttendanceRecords(req.organizationId);
      const attId = `att_${req.date}_${req.userId}`;
      let targetRecord = records.find(r => r.userId === req.userId && r.date === req.date);

      const [inH, inM] = req.requestedClockIn.replace(/[^0-9:]/g, '').split(':').map(Number);
      const [outH, outM] = req.requestedClockOut.replace(/[^0-9:]/g, '').split(':').map(Number);
      const isOutPM = req.requestedClockOut.toLowerCase().includes('pm') && outH < 12;
      const adjustedOutH = isOutPM ? outH + 12 : outH;

      const inTimestamp = new Date(`${req.date}T${String(inH || 9).padStart(2, '0')}:${String(inM || 0).padStart(2, '0')}:00`).getTime();
      const outTimestamp = new Date(`${req.date}T${String(adjustedOutH || 17).padStart(2, '0')}:${String(outM || 30).padStart(2, '0')}:00`).getTime();
      const totalDur = Math.max(0, Math.floor((outTimestamp - inTimestamp) / 1000));
      const breakSec = targetRecord ? targetRecord.totalBreakSeconds : 1800;
      const netWorkSec = Math.max(0, totalDur - breakSec);
      const overtimeSec = Math.max(0, netWorkSec - 28800);

      const originalClockIn = targetRecord?.clockIn || 'Not Clocked In';
      const originalClockOut = targetRecord?.clockOut || 'Not Clocked Out';

      if (targetRecord) {
        targetRecord.clockIn = req.requestedClockIn;
        targetRecord.clockOut = req.requestedClockOut;
        targetRecord.clockInTimestamp = inTimestamp;
        targetRecord.clockOutTimestamp = outTimestamp;
        targetRecord.totalDurationSeconds = totalDur;
        targetRecord.netWorkSeconds = netWorkSec;
        targetRecord.overtimeSeconds = overtimeSec;
        targetRecord.status = 'PRESENT';
        targetRecord.completionStatus = netWorkSec >= 28800 ? '8 Hour Work Completed' : 'Workday Incomplete';
        targetRecord.isCorrected = true;
        targetRecord.correctionReason = req.reason;
        targetRecord.updatedAt = new Date().toISOString();
        storage.saveAttendanceRecord(targetRecord);
        supabaseDb.upsertAttendanceRecord(targetRecord).catch(e => console.warn('Supabase correction att err:', e));
      } else {
        const dayName = new Date(req.date).toLocaleDateString('en-US', { weekday: 'long' });
        const newRecord: AttendanceRecord = {
          id: attId,
          organizationId: req.organizationId,
          userId: req.userId,
          date: req.date,
          dayName,
          clockIn: req.requestedClockIn,
          clockOut: req.requestedClockOut,
          clockInTimestamp: inTimestamp,
          clockOutTimestamp: outTimestamp,
          totalDurationSeconds: totalDur,
          totalBreakSeconds: breakSec,
          netWorkSeconds: netWorkSec,
          overtimeSeconds: overtimeSec,
          status: 'PRESENT',
          completionStatus: netWorkSec >= 28800 ? '8 Hour Work Completed' : 'Workday Incomplete',
          isLate: false,
          lateMinutes: 0,
          isCorrected: true,
          correctionReason: req.reason,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storage.saveAttendanceRecord(newRecord);
        supabaseDb.upsertAttendanceRecord(newRecord).catch(e => console.warn('Supabase correction att err:', e));
      }

      // Write immutable entry to Audit Log preserving original values
      const log = {
        organizationId: req.organizationId,
        action: 'ATTENDANCE_CORRECTION' as const,
        targetUserId: req.userId,
        targetUserName: req.userName,
        targetEmployeeId: req.employeeId,
        fieldName: 'clock_in_and_clock_out',
        originalValue: `In: ${originalClockIn}, Out: ${originalClockOut}`,
        newValue: `In: ${req.requestedClockIn}, Out: ${req.requestedClockOut}`,
        changedByUserId: adminUser?.id || 'f45bd396-988c-4f4a-8c85-f203722a1d41',
        changedByUserName: adminName,
        changedByRole: 'ADMIN' as UserRole,
        reason: `Correction Approved for date ${req.date}. Reason: ${req.reason}`
      };
      const createdLog = storage.addAuditLog(log);
      supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));
    }

    // Notify Employee
    storage.addNotification({
      organizationId: req.organizationId,
      userId: req.userId,
      targetRole: 'EMPLOYEE',
      title: `Attendance Correction ${status}`,
      message: `Your correction request for ${req.date} has been ${status.toLowerCase()} by ${adminName}.`,
      type: status === 'Approved' ? 'success' : 'error'
    });

    return req;
  },

  // --- Audit Logs ---
  async getAuditLogs(orgId?: string): Promise<AuditLog[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getAuditLogs(targetOrg);
      if (remote !== null) {
        storage.setAuditLogs(remote);
        return remote;
      }
    } catch (e) {
      console.warn('Supabase getAuditLogs fallback:', e);
    }
    return storage.getAuditLogs(targetOrg);
  },

  // --- Notifications ---
  async getNotifications(orgId?: string, userRole?: UserRole, userId?: string): Promise<NotificationItem[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    const all = storage.getNotifications(targetOrg);
    return all.filter(n => {
      if (userRole === 'ADMIN') return n.targetRole === 'ADMIN' || !n.targetRole;
      return n.userId === userId || n.targetRole === 'EMPLOYEE';
    });
  },

  async markNotificationRead(id: string): Promise<void> {
    storage.markNotificationAsRead(id);
  },

  async markAllNotificationsRead(orgId?: string): Promise<void> {
    storage.markAllNotificationsAsRead(orgId);
  },

  // --- Month-Wise Timesheet Aggregation Engine (Admin & Employee) ---
  async getMonthAttendanceSummary(year: number, monthIndex: number, orgId?: string) {
    const targetOrg = orgId || storage.getCurrentOrgId();
    await Promise.allSettled([
      this.getEmployees(targetOrg),
      this.getAllAttendanceRecords(targetOrg)
    ]);
    const allEmployees = storage.getUsers(targetOrg).filter(u => u.role !== 'ADMIN');
    const allAttendance = storage.getAttendanceRecords(targetOrg);

    const monthRecords = allAttendance.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });

    const employeeSummaries = allEmployees.map(emp => {
      const empRecords = monthRecords.filter(r => r.userId === emp.id);

      const presentCount = empRecords.filter(r => r.status === 'PRESENT' || r.status === 'COMPLETED' || r.status === 'WORKING' || r.status === 'ON_BREAK').length;
      const lateCount = empRecords.filter(r => r.status === 'LATE' || r.isLate).length;
      const absentCount = empRecords.filter(r => r.status === 'ABSENT').length;
      const leaveCount = empRecords.filter(r => r.status === 'LEAVE').length;

      const totalNetWorkSec = empRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
      const totalOvertimeSec = empRecords.reduce((acc, r) => acc + (r.overtimeSeconds || 0), 0);
      const totalBreakSec = empRecords.reduce((acc, r) => acc + (r.totalBreakSeconds || 0), 0);

      const totalWorkHours = Math.round((totalNetWorkSec / 3600) * 10) / 10;
      const totalOvertimeHours = Math.round((totalOvertimeSec / 3600) * 10) / 10;

      // Assume 22 standard workdays per month
      const attendancePercentage = Math.min(100, Math.round(((presentCount + lateCount) / Math.max(1, presentCount + lateCount + absentCount + leaveCount)) * 100));

      return {
        employee: emp,
        presentDays: presentCount,
        lateDays: lateCount,
        absentDays: absentCount,
        leaveDays: leaveCount,
        totalWorkHours,
        totalWorkSeconds: totalNetWorkSec,
        totalOvertimeHours,
        totalOvertimeSeconds: totalOvertimeSec,
        totalBreakSeconds: totalBreakSec,
        attendancePercentage,
        records: empRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    });

    const totalEmployees = allEmployees.length;
    const totalPresentSum = employeeSummaries.reduce((acc, e) => acc + e.presentDays, 0);
    const totalAbsentSum = employeeSummaries.reduce((acc, e) => acc + e.absentDays, 0);
    const totalLateSum = employeeSummaries.reduce((acc, e) => acc + e.lateDays, 0);
    const totalLeaveSum = employeeSummaries.reduce((acc, e) => acc + e.leaveDays, 0);
    const totalWorkHoursSum = employeeSummaries.reduce((acc, e) => acc + e.totalWorkHours, 0);
    const totalOvertimeHoursSum = employeeSummaries.reduce((acc, e) => acc + e.totalOvertimeHours, 0);
    const avgAttendancePct = totalEmployees > 0 ? Math.round(employeeSummaries.reduce((acc, e) => acc + e.attendancePercentage, 0) / totalEmployees) : 0;

    return {
      year,
      monthIndex,
      totalEmployees,
      totalPresentSum,
      totalAbsentSum,
      totalLateSum,
      totalLeaveSum,
      totalWorkHoursSum: Math.round(totalWorkHoursSum * 10) / 10,
      totalOvertimeHoursSum: Math.round(totalOvertimeHoursSum * 10) / 10,
      avgAttendancePct,
      employeeSummaries
    };
  },

  // --- Reports & Analytics API ---
  async getReportsSummary(orgId?: string) {
    const targetOrg = orgId || storage.getCurrentOrgId();
    const team = await this.getTeamAttendance(targetOrg);
    const totalEmployees = team.length;
    const workingCount = team.filter(t => t.currentStatus === 'WORKING').length;
    const breakCount = team.filter(t => t.currentStatus === 'ON_BREAK').length;
    const clockedOutCount = team.filter(t => t.currentStatus === 'CLOCKED_OUT').length;
    const presentToday = team.filter(t => t.currentStatus !== 'NOT_CLOCKED_IN').length;
    const lateToday = team.filter(t => t.attendanceToday?.isLate).length;
    const onLeaveToday = team.filter(t => t.attendanceToday?.status === 'LEAVE').length;
    const notClockedInCount = Math.max(0, totalEmployees - presentToday);

    const totalWorkSec = team.reduce((acc, m) => acc + m.totalWorkSecondsToday, 0);
    const totalOvertimeSec = team.reduce((acc, m) => acc + m.overtimeSecondsToday, 0);
    const avgSec = presentToday > 0 ? Math.floor(totalWorkSec / presentToday) : 0;
    const avgHoursStr = `${Math.floor(avgSec / 3600)}h ${Math.floor((avgSec % 3600) / 60)}m`;
    const attendancePctStr = totalEmployees > 0 ? `${Math.round((presentToday / totalEmployees) * 100)}%` : '0%';

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));

    const allAttendance = storage.getAttendanceRecords(targetOrg);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dailyWorkData = days.map((dayName, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);
      const dateStr = targetDate.toISOString().split('T')[0];
      const isToday = dateStr === now.toISOString().split('T')[0];

      const dayRecords = allAttendance.filter(r => r.date === dateStr);
      let dayWorkHours = 0;
      let dayBreakMins = 0;
      let dayLateCount = 0;

      if (dayRecords.length > 0) {
        const totalNetWork = dayRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0);
        const totalBreaks = dayRecords.reduce((acc, r) => acc + (r.totalBreakSeconds || 0), 0);
        dayWorkHours = Math.round((totalNetWork / dayRecords.length / 3600) * 10) / 10;
        dayBreakMins = Math.round(totalBreaks / dayRecords.length / 60);
        dayLateCount = dayRecords.filter(r => r.isLate).length;
      } else if (isToday && presentToday > 0) {
        dayWorkHours = Math.round((totalWorkSec / presentToday / 3600) * 10) / 10;
        const totalBreakSec = team.reduce((acc, m) => acc + m.totalBreakSecondsToday, 0);
        dayBreakMins = Math.round(totalBreakSec / presentToday / 60);
        dayLateCount = lateToday;
      }

      return {
        day: isToday ? `${dayName} (Today)` : dayName,
        workHours: dayWorkHours,
        breakMins: dayBreakMins,
        lateCount: dayLateCount,
        target: 8.0
      };
    });

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

      const mPresent = mRecords.filter(r => r.status === 'PRESENT' || r.status === 'COMPLETED' || r.status === 'LATE').length;
      const mPct = totalEmployees > 0 && mRecords.length > 0 ? Math.min(100, Math.round((mPresent / (totalEmployees * 20)) * 100)) : 0;
      const mAvgHours = mRecords.length > 0
        ? Math.round((mRecords.reduce((acc, r) => acc + (r.netWorkSeconds || 0), 0) / mRecords.length / 3600) * 10) / 10
        : 0;

      monthlyTrendData.push({
        month: `${mName} ${mYear}`,
        attendancePct: mPct,
        avgHours: mAvgHours
      });
    }

    return {
      totalEmployees,
      presentToday,
      lateToday,
      onLeaveToday,
      workingCount,
      breakCount,
      clockedOutCount,
      notClockedInCount,
      totalWorkingHoursFormatted: `${Math.floor(totalWorkSec / 3600)}h ${Math.floor((totalWorkSec % 3600) / 60)}m`,
      totalOvertimeFormatted: `${Math.floor(totalOvertimeSec / 3600)}h ${Math.floor((totalOvertimeSec % 3600) / 60)}m`,
      averageWorkingHours: avgHoursStr,
      attendancePercentage: attendancePctStr,
      dailyWorkData,
      monthlyTrendData
    };
  },

  // --- Admin Work / Task Assignment Engine ---
  async assignTask(params: {
    organizationId?: string;
    assignedToUserId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    estimatedHours?: number;
  }): Promise<AssignedTask> {
    const orgId = params.organizationId || storage.getCurrentOrgId();
    const currentUser = storage.getCurrentUser();
    const adminName = currentUser?.name || 'Administrator';
    const adminId = currentUser?.id || 'f45bd396-988c-4f4a-8c85-f203722a1d41';

    const targetUser = storage.getUserById(params.assignedToUserId);
    if (!targetUser) {
      throw new Error('Assigned employee was not found.');
    }

    const newTask: AssignedTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      assignedByUserId: adminId,
      assignedByUserName: adminName,
      assignedToUserId: targetUser.id,
      assignedToUserName: targetUser.name,
      assignedToUserEmail: targetUser.email,
      title: params.title.trim(),
      description: params.description.trim(),
      priority: params.priority,
      dueDate: params.dueDate,
      estimatedHours: params.estimatedHours,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    storage.saveAssignedTask(newTask);
    supabaseDb.upsertAssignedTask(newTask).catch(e => console.warn('Supabase assignTask err:', e));

    // 1. Immediately send high-priority notification to the assigned employee
    storage.addNotification({
      organizationId: orgId,
      userId: targetUser.id,
      targetRole: 'EMPLOYEE',
      title: `⚡ New Work Assigned: ${newTask.title}`,
      message: `${adminName} assigned you a new task: "${newTask.title}" (Priority: ${newTask.priority}, Due: ${newTask.dueDate}). Please review and update status.`,
      type: newTask.priority === 'URGENT' || newTask.priority === 'HIGH' ? 'warning' : 'info'
    });

    // 2. Add event to employee's live activity timeline
    storage.addTimelineEvent(targetUser.id, {
      organizationId: orgId,
      userId: targetUser.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'New Task Assigned by Admin',
      subtitle: `${newTask.title} (Priority: ${newTask.priority})`,
      type: 'TASK_ASSIGNED'
    });

    // 3. Write immutable audit log entry
    const log = {
      organizationId: orgId,
      action: 'TASK_ASSIGNMENT' as const,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetEmployeeId: targetUser.employeeId,
      fieldName: 'assigned_task',
      originalValue: 'None',
      newValue: `${newTask.title} [Priority: ${newTask.priority}, Due: ${newTask.dueDate}]`,
      changedByUserId: adminId,
      changedByUserName: adminName,
      changedByRole: 'ADMIN' as UserRole,
      reason: `Assigned work "${newTask.title}" to ${targetUser.name}`
    };
    const createdLog = storage.addAuditLog(log);
    supabaseDb.insertAuditLog(createdLog).catch(e => console.warn('Supabase log error:', e));

    return newTask;
  },

  async getTasksForUser(userId: string, orgId?: string): Promise<AssignedTask[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getAssignedTasks(targetOrg);
      if (remote !== null) {
        storage.setAssignedTasks(remote);
        return remote
          .filter(t => t.assignedToUserId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn('Supabase getTasksForUser fallback:', e);
    }
    const tasks = storage.getAssignedTasks(targetOrg);
    return tasks
      .filter(t => t.assignedToUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllAssignedTasks(orgId?: string): Promise<AssignedTask[]> {
    const targetOrg = orgId || storage.getCurrentOrgId();
    try {
      const remote = await supabaseDb.getAssignedTasks(targetOrg);
      if (remote !== null) {
        storage.setAssignedTasks(remote);
        return remote.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn('Supabase getAllAssignedTasks fallback:', e);
    }
    return storage.getAssignedTasks(targetOrg).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateTaskStatus(taskId: string, status: TaskStatus, employeeNotes?: string): Promise<AssignedTask> {
    const orgId = storage.getCurrentOrgId();
    const tasks = storage.getAssignedTasks(orgId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Assigned task was not found.');
    }

    const updatedTask: AssignedTask = {
      ...task,
      status,
      employeeNotes: employeeNotes !== undefined ? employeeNotes : task.employeeNotes,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : task.completedAt
    };

    storage.updateAssignedTask(updatedTask);
    supabaseDb.upsertAssignedTask(updatedTask).catch(e => console.warn('Supabase updateTaskStatus err:', e));

    // Notify Admin when employee completes or updates task
    const currentUser = storage.getCurrentUser();
    storage.addNotification({
      organizationId: orgId,
      targetRole: 'ADMIN',
      title: `Task Status: ${updatedTask.title}`,
      message: `${currentUser?.name || updatedTask.assignedToUserName} marked "${updatedTask.title}" as ${status.replace('_', ' ')}.`,
      type: status === 'COMPLETED' ? 'success' : 'info'
    });

    return updatedTask;
  },

  async deleteTask(taskId: string): Promise<void> {
    storage.deleteAssignedTask(taskId);
  }
};

