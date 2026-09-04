import {
  User, AttendanceRecord, BreakRecord, WorkSession, ActivityRecord,
  EmployeeStatus, TimelineEvent, ReminderSettings
} from '../types';
import { DEFAULT_SETTINGS } from './mockData';

const STORAGE_KEYS = {
  USERS: 'vertofi_users',
  CURRENT_USER_ID: 'vertofi_current_user_id',
  ATTENDANCE: 'vertofi_attendance',
  BREAKS: 'vertofi_breaks',
  SESSIONS: 'vertofi_sessions',
  ACTIVITIES: 'vertofi_activities',
  ACTIVE_CLOCK_PREFIX: 'vertofi_active_clock_',
  TIMELINE_PREFIX: 'vertofi_timeline_',
  SETTINGS: 'vertofi_settings',
  CLEANED_FLAG: 'vertofi_demo_purged_v2'
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
    this.purgeLegacyDemoData();
    this.initStorage();
  }

  private purgeLegacyDemoData() {
    // Check if legacy cleanup is needed or if demo users exist
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    if (usersStr) {
      try {
        const users: User[] = JSON.parse(usersStr);
        const hasDemoUser = users.some(u =>
          u.name.toLowerCase().includes('geethika') ||
          u.name.toLowerCase().includes('parvatham') ||
          u.name.toLowerCase().includes('rahul') ||
          u.name.toLowerCase().includes('priya') ||
          u.name.toLowerCase().includes('jenkins') ||
          u.name.toLowerCase().includes('vertofi admin') ||
          u.id === 'usr_admin' ||
          u.id === 'user_geethika'
        );

        if (hasDemoUser || !localStorage.getItem(STORAGE_KEYS.CLEANED_FLAG)) {
          // Remove demo users from user list
          const cleanUsers = users.filter(u =>
            !u.name.toLowerCase().includes('geethika') &&
            !u.name.toLowerCase().includes('parvatham') &&
            !u.name.toLowerCase().includes('rahul') &&
            !u.name.toLowerCase().includes('priya') &&
            !u.name.toLowerCase().includes('jenkins') &&
            !u.name.toLowerCase().includes('vertofi admin') &&
            u.id !== 'usr_admin' &&
            u.id !== 'user_geethika'
          );

          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanUsers));
          localStorage.setItem(STORAGE_KEYS.CLEANED_FLAG, 'true');

          // If active logged-in user was a demo user, log out
          const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
          if (currentId === 'usr_admin' || currentId === 'user_geethika' || !cleanUsers.some(u => u.id === currentId)) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
          }
        }
      } catch (e) {
        // Fallback clear if corrupted
        localStorage.clear();
      }
    }
  }

  private initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BREAKS)) {
      localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  // User Management
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  addUser(newUser: User): void {
    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cleanup related records
    const attendance = this.getAttendanceRecords().filter(a => a.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));

    const breaks = this.getBreakRecords().filter(b => b.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(breaks));

    const sessions = this.getWorkSessions().filter(s => s.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    const activities = this.getActivityRecords().filter(a => a.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

    localStorage.removeItem(`${STORAGE_KEYS.ACTIVE_CLOCK_PREFIX}${userId}`);
    localStorage.removeItem(`${STORAGE_KEYS.TIMELINE_PREFIX}${userId}`);

    if (this.getCurrentUserId() === userId) {
      this.setCurrentUserId(null);
    }
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
    const users = this.getUsers();
    const currentId = this.getCurrentUserId();
    if (!currentId) return null;
    return users.find(u => u.id === currentId) || null;
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Active Clock State (Persisted across refreshes)
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

  // Timeline Events
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

  clearTimeline(userId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.TIMELINE_PREFIX}${userId}`);
  }

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  }

  saveAttendanceRecord(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  // Breaks
  getBreakRecords(): BreakRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.BREAKS);
    return data ? JSON.parse(data) : [];
  }

  saveBreakRecord(record: BreakRecord): void {
    const records = this.getBreakRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(records));
  }

  // Work Sessions
  getWorkSessions(): WorkSession[] {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  }

  saveWorkSession(session: WorkSession): void {
    const sessions = this.getWorkSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  // Activity Records
  getActivityRecords(): ActivityRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return data ? JSON.parse(data) : [];
  }

  saveActivityRecord(activity: ActivityRecord): void {
    const records = this.getActivityRecords();
    const index = records.findIndex(a => a.id === activity.id);
    if (index >= 0) {
      records[index] = activity;
    } else {
      records.unshift(activity);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(records));
  }

  // Settings
  getSettings(): ReminderSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  }

  saveSettings(settings: ReminderSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}

export const storage = new StorageService();
