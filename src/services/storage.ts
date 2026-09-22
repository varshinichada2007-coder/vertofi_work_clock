import {
  Organization, User, AttendanceRecord, BreakRecord, WorkSession,
  ActivityRecord, EmployeeStatus, TimelineEvent, ReminderSettings,
  LeaveRequest, AttendanceCorrectionRequest, AuditLog, NotificationItem,
  WorkScheduleConfig, AssignedTask
} from '../types';
import {
  DEFAULT_ORGANIZATIONS, INITIAL_USERS, generateSeedAttendance,
  INITIAL_LEAVE_REQUESTS, INITIAL_CORRECTION_REQUESTS, INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS, DEFAULT_WORK_SCHEDULE, DEFAULT_SETTINGS,
  INITIAL_ASSIGNED_TASKS
} from './mockData';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'vertofi_organizations_v8',
  CURRENT_ORG_ID: 'vertofi_current_org_id_v8',
  USERS: 'vertofi_users_v8',
  CURRENT_USER_ID: 'vertofi_current_user_id_v8',
  ATTENDANCE: 'vertofi_attendance_v8',
  BREAKS: 'vertofi_breaks_v8',
  SESSIONS: 'vertofi_sessions_v8',
  ACTIVITIES: 'vertofi_activities_v8',
  LEAVE_REQUESTS: 'vertofi_leaves_v8',
  CORRECTIONS: 'vertofi_corrections_v8',
  AUDIT_LOGS: 'vertofi_audit_logs_v8',
  NOTIFICATIONS: 'vertofi_notifications_v8',
  SCHEDULES: 'vertofi_schedules_v8',
  SETTINGS: 'vertofi_settings_v8',
  ASSIGNED_TASKS: 'vertofi_assigned_tasks_v8',
  ACTIVE_CLOCK_PREFIX: 'vertofi_active_clock_v8_',
  TIMELINE_PREFIX: 'vertofi_timeline_v8_',
  SEED_FLAG: 'vertofi_seeded_v8'
};

export interface ActiveClockState {
  status: EmployeeStatus;
  clockInTimestamp: number | null; // epoch ms
  clockOutTimestamp: number | null;
  accumulatedBreakSeconds: number;
  currentBreakStartTimestamp: number | null; // epoch ms
  currentBreakType: string | null;
  currentActivity: string;
  initialTask: string;
  attendanceId: string | null;
  todayDateStr: string; // YYYY-MM-DD
}

class StorageService {
  constructor() {
    this.initStorage();
  }

  private initStorage() {
    // Clean up all legacy mock data keys from older storage versions (v1 to v7)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('vertofi_') && !key.includes('_v8'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Legacy storage cleanup warning:', e);
    }

    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEED_FLAG);
    if (!isSeeded) {
      try {
        localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(DEFAULT_ORGANIZATIONS));
        localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, 'org_vertofi');
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'f45bd396-988c-4f4a-8c85-f203722a1d41');
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([DEFAULT_WORK_SCHEDULE]));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.ASSIGNED_TASKS, JSON.stringify([]));

        localStorage.setItem(STORAGE_KEYS.SEED_FLAG, 'true');
      } catch (e) {
        console.warn('Initial storage seed warning:', e);
      }
    }
  }

  // --- Organization Operations ---
  getOrganizations(): Organization[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
    const orgs: Organization[] = data ? JSON.parse(data) : DEFAULT_ORGANIZATIONS;
    return orgs.map(o => o.id === 'org_vertofi' ? { ...o, name: 'Vertofi', logo: '/logo.svg' } : o);
  }

  getCurrentOrgId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ORG_ID) || 'org_vertofi';
  }

  setCurrentOrgId(orgId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, orgId);
  }

  getCurrentOrganization(): Organization {
    const orgs = this.getOrganizations();
    const currentId = this.getCurrentOrgId();
    const found = orgs.find(o => o.id === currentId) || orgs[0] || DEFAULT_ORGANIZATIONS[0];
    return found.id === 'org_vertofi' ? { ...found, name: 'Vertofi', logo: '/logo.svg' } : found;
  }

  updateOrganization(updated: Organization): void {
    const orgs = this.getOrganizations().map(o => o.id === updated.id ? updated : o);
    localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(orgs));
  }

  // --- Work Schedule Config ---
  getWorkSchedule(orgId: string = this.getCurrentOrgId()): WorkScheduleConfig {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (data) {
      const schedules: WorkScheduleConfig[] = JSON.parse(data);
      const found = schedules.find(s => s.organizationId === orgId);
      if (found) return found;
    }
    return { ...DEFAULT_WORK_SCHEDULE, organizationId: orgId };
  }

  saveWorkSchedule(config: WorkScheduleConfig): void {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    let schedules: WorkScheduleConfig[] = data ? JSON.parse(data) : [];
    const idx = schedules.findIndex(s => s.organizationId === config.organizationId);
    if (idx >= 0) {
      schedules[idx] = config;
    } else {
      schedules.push(config);
    }
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  // --- User Operations ---
  getUsers(orgId?: string): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = data ? JSON.parse(data) : [];
    const targetOrgId = orgId || this.getCurrentOrgId();
    return users.filter(u => u.organizationId === targetOrgId);
  }

  getAllUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  getUserById(userId: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.id === userId || u.employeeId === userId);
  }

  addUser(newUser: User): void {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === newUser.id || (u.organizationId === newUser.organizationId && u.employeeId === newUser.employeeId));
    if (index >= 0) {
      users[index] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  updateUser(updatedUser: User): void {
    const users = this.getAllUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  deleteUser(userId: string): void {
    const users = this.getAllUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  }

  setCurrentUserId(id: string | null): void {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    }
  }

  getCurrentUser(): User | null {
    const currentId = this.getCurrentUserId();
    if (!currentId) return null;
    const user = this.getUserById(currentId);
    return user || null;
  }

  // --- Active Clock State ---
  getActiveClockState(userId: string): ActiveClockState {
    const key = `${STORAGE_KEYS.ACTIVE_CLOCK_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    const todayStr = new Date().toISOString().split('T')[0];

    if (data) {
      const state: ActiveClockState = JSON.parse(data);
      if (state.todayDateStr !== todayStr && state.status === 'CLOCKED_OUT') {
        return this.getDefaultClockState(todayStr);
      }
      return state;
    }
    return this.getDefaultClockState(todayStr);
  }

  setActiveClockState(userId: string, state: ActiveClockState): void {
    const key = `${STORAGE_KEYS.ACTIVE_CLOCK_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
  }

  private getDefaultClockState(todayDateStr: string): ActiveClockState {
    return {
      status: 'NOT_CLOCKED_IN',
      clockInTimestamp: null,
      clockOutTimestamp: null,
      accumulatedBreakSeconds: 0,
      currentBreakStartTimestamp: null,
      currentBreakType: null,
      currentActivity: 'No active task',
      initialTask: 'No active task',
      attendanceId: null,
      todayDateStr
    };
  }

  // --- Timeline Events ---
  getTimelineEvents(userId: string): TimelineEvent[] {
    const key = `${STORAGE_KEYS.TIMELINE_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    return [];
  }

  addTimelineEvent(userId: string, event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const events = this.getTimelineEvents(userId);
    const newEvent: TimelineEvent = {
      ...event,
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    const updated = [newEvent, ...events];
    localStorage.setItem(`${STORAGE_KEYS.TIMELINE_PREFIX}${userId}`, JSON.stringify(updated));
    return newEvent;
  }

  // --- Attendance Records ---
  getAttendanceRecords(orgId: string = this.getCurrentOrgId()): AttendanceRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const records: AttendanceRecord[] = data ? JSON.parse(data) : [];
    return records.filter(r => r.organizationId === orgId);
  }

  saveAttendanceRecord(record: AttendanceRecord): void {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let records: AttendanceRecord[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  // --- Break Records ---
  getBreakRecords(orgId: string = this.getCurrentOrgId()): BreakRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.BREAKS);
    const records: BreakRecord[] = data ? JSON.parse(data) : [];
    return records.filter(b => b.organizationId === orgId);
  }

  saveBreakRecord(record: BreakRecord): void {
    const data = localStorage.getItem(STORAGE_KEYS.BREAKS);
    let records: BreakRecord[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(records));
  }

  // --- Work Sessions & Activities ---
  getWorkSessions(orgId: string = this.getCurrentOrgId()): WorkSession[] {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const records: WorkSession[] = data ? JSON.parse(data) : [];
    return records.filter(s => s.organizationId === orgId);
  }

  saveWorkSession(session: WorkSession): void {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    let records: WorkSession[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(s => s.id === session.id);
    if (index >= 0) {
      records[index] = session;
    } else {
      records.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(records));
  }

  getActivityRecords(orgId: string = this.getCurrentOrgId()): ActivityRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const records: ActivityRecord[] = data ? JSON.parse(data) : [];
    return records.filter(a => a.organizationId === orgId);
  }

  saveActivityRecord(activity: ActivityRecord): void {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    let records: ActivityRecord[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(a => a.id === activity.id);
    if (index >= 0) {
      records[index] = activity;
    } else {
      records.unshift(activity);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(records));
  }

  // --- Leave Requests ---
  getLeaveRequests(orgId: string = this.getCurrentOrgId()): LeaveRequest[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    const records: LeaveRequest[] = data ? JSON.parse(data) : [];
    return records.filter(r => r.organizationId === orgId);
  }

  saveLeaveRequest(request: LeaveRequest): void {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    let records: LeaveRequest[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(r => r.id === request.id);
    if (index >= 0) {
      records[index] = request;
    } else {
      records.unshift(request);
    }
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(records));
  }

  // --- Attendance Corrections ---
  getCorrectionRequests(orgId: string = this.getCurrentOrgId()): AttendanceCorrectionRequest[] {
    const data = localStorage.getItem(STORAGE_KEYS.CORRECTIONS);
    const records: AttendanceCorrectionRequest[] = data ? JSON.parse(data) : [];
    return records.filter(r => r.organizationId === orgId);
  }

  saveCorrectionRequest(request: AttendanceCorrectionRequest): void {
    const data = localStorage.getItem(STORAGE_KEYS.CORRECTIONS);
    let records: AttendanceCorrectionRequest[] = data ? JSON.parse(data) : [];
    const index = records.findIndex(r => r.id === request.id);
    if (index >= 0) {
      records[index] = request;
    } else {
      records.unshift(request);
    }
    localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(records));
  }

  // --- Audit Logs ---
  getAuditLogs(orgId: string = this.getCurrentOrgId()): AuditLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const records: AuditLog[] = data ? JSON.parse(data) : [];
    return records.filter(r => r.organizationId === orgId);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    let records: AuditLog[] = data ? JSON.parse(data) : [];
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    records.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(records));
    return newLog;
  }

  // --- Notifications ---
  getNotifications(orgId: string = this.getCurrentOrgId()): NotificationItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const records: NotificationItem[] = data ? JSON.parse(data) : [];
    return records.filter(r => r.organizationId === orgId);
  }

  addNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): NotificationItem {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let records: NotificationItem[] = data ? JSON.parse(data) : [];
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    records.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(records));
    return newItem;
  }

  markNotificationAsRead(id: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let records: NotificationItem[] = data ? JSON.parse(data) : [];
    records = records.map(r => r.id === id ? { ...r, isRead: true } : r);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(records));
  }

  markAllNotificationsAsRead(orgId: string = this.getCurrentOrgId()): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let records: NotificationItem[] = data ? JSON.parse(data) : [];
    records = records.map(r => r.organizationId === orgId ? { ...r, isRead: true } : r);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(records));
  }

  // --- Settings ---
  getSettings(): ReminderSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  }

  saveSettings(settings: ReminderSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Assigned Tasks (Admin Work Assignment Engine) ---
  getAssignedTasks(orgId: string = this.getCurrentOrgId()): AssignedTask[] {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNED_TASKS);
    const tasks: AssignedTask[] = data ? JSON.parse(data) : [];
    return tasks.filter(t => t.organizationId === orgId);
  }

  saveAssignedTask(task: AssignedTask): void {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNED_TASKS);
    let tasks: AssignedTask[] = data ? JSON.parse(data) : [];
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    localStorage.setItem(STORAGE_KEYS.ASSIGNED_TASKS, JSON.stringify(tasks));
  }

  updateAssignedTask(task: AssignedTask): void {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNED_TASKS);
    let tasks: AssignedTask[] = data ? JSON.parse(data) : [];
    tasks = tasks.map(t => t.id === task.id ? task : t);
    localStorage.setItem(STORAGE_KEYS.ASSIGNED_TASKS, JSON.stringify(tasks));
  }

  deleteAssignedTask(taskId: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNED_TASKS);
    let tasks: AssignedTask[] = data ? JSON.parse(data) : [];
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.ASSIGNED_TASKS, JSON.stringify(tasks));
  }

  // --- Remote Sync Replacements ---
  setUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  setAttendanceRecords(records: AttendanceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  setAssignedTasks(tasks: AssignedTask[]): void {
    localStorage.setItem(STORAGE_KEYS.ASSIGNED_TASKS, JSON.stringify(tasks));
  }

  setLeaveRequests(requests: LeaveRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  }

  setCorrectionRequests(requests: AttendanceCorrectionRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(requests));
  }

  setAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }
}

export const storage = new StorageService();

