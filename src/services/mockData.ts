import { User, AttendanceRecord, BreakRecord, WorkSession, ActivityRecord, ReminderSettings } from '../types';

export const INITIAL_USERS: User[] = [];

export const DEFAULT_SETTINGS: ReminderSettings = {
  clockInReminder: true,
  clockInTime: '09:00',
  clockOutReminder: true,
  clockOutTime: '18:00',
  breakDurationWarning: true,
  maxBreakMinutes: 60, // 60 minutes max break per workday
  activityCheckIn: true,
  activityIntervalMinutes: 120,
  use24HourClock: false,
  timezone: 'Asia/Kolkata',
  emailNotifications: true
};

export const INITIAL_ATTENDANCE_HISTORICAL: AttendanceRecord[] = [];
export const INITIAL_BREAKS_HISTORICAL: BreakRecord[] = [];
export const INITIAL_SESSIONS_HISTORICAL: WorkSession[] = [];
export const INITIAL_ACTIVITIES_HISTORICAL: ActivityRecord[] = [];
