export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export type EmployeeType = 'Employee' | 'Intern';

export type EmployeeStatus = 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT';

export type BreakType = 'Lunch' | 'Tea/Coffee' | 'Personal' | 'Meeting' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
  employeeType?: EmployeeType; // Employee vs Intern
  joiningDate?: string;
  profileImage: string;
  workLocation: string;
  phone: string;
  managerName?: string;
  createdAt: string;
}

export interface BreakRecord {
  id: string;
  attendanceId: string;
  userId: string;
  breakType: BreakType;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  durationSeconds: number;
  notes?: string;
}

export interface WorkSession {
  id: string;
  attendanceId: string;
  userId: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  durationSeconds: number;
  activity: string;
  status: 'Working' | 'Completed' | 'Paused';
}

export interface ActivityRecord {
  id: string;
  userId: string;
  attendanceId: string;
  activity: string;
  startedAt: string; // ISO string
  endedAt?: string; // ISO string
  durationSeconds: number;
  status: 'Working' | 'Completed' | 'Paused';
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO String or Time string
  title: string;
  subtitle: string;
  type: 'CLOCK_IN' | 'BREAK_START' | 'BREAK_END' | 'TASK_UPDATE' | 'CLOCK_OUT';
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Friday
  clockIn: string; // Formatted "09:07:32 AM"
  clockOut?: string; // Formatted "06:00:00 PM"
  clockInTimestamp: number;
  clockOutTimestamp?: number;
  totalBreakSeconds: number;
  totalWorkSeconds: number;
  netWorkSeconds: number;
  status: 'Present' | 'Late' | 'Completed' | 'Incomplete' | 'Not Started';
  completionStatus?: '8 Hour Work Completed' | 'Workday Incomplete' | 'Working' | 'On Break' | 'Not Started';
  isLate?: boolean;
  lateMinutes?: number;
  currentActivity?: string;
  initialTask?: string;
  endNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberStatus {
  user: User;
  attendanceToday?: AttendanceRecord;
  currentStatus: EmployeeStatus;
  clockInTimeFormatted?: string;
  currentActivity?: string;
  breakStartedFormatted?: string;
  totalBreakSecondsToday: number;
  remainingBreakSecondsToday: number;
  totalWorkSecondsToday: number;
  lastActive: string;
}

export interface ReminderSettings {
  clockInReminder: boolean;
  clockInTime: string; // "09:00"
  clockOutReminder: boolean;
  clockOutTime: string; // "18:00"
  breakDurationWarning: boolean;
  maxBreakMinutes: number; // 60
  activityCheckIn: boolean;
  activityIntervalMinutes: number; // 120
  use24HourClock: boolean;
  timezone: string;
  emailNotifications: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}
