export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type EmployeeType = 'Employee' | 'Intern';

export type EmployeeStatus = 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT';

export type AttendanceStatusType = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'WORKING' | 'ON_BREAK' | 'COMPLETED';

export type BreakType = 'Lunch' | 'Tea/Coffee' | 'Personal' | 'Meeting' | 'Other';

export type LeaveType = 'Sick Leave' | 'Casual Leave' | 'Annual Vacation' | 'Maternity/Paternity' | 'Unpaid Leave';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo?: string;
  timezone: string;
  currency: string;
  standardWorkHours: number; // e.g. 8
  standardStartTime: string; // "09:00"
  standardEndTime: string;   // "17:30"
  lateGraceMinutes: number;  // e.g. 15
  createdAt: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isWorkday: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:30"
  requiredHours: number; // 8
}

export interface WorkScheduleConfig {
  organizationId: string;
  schedules: DaySchedule[];
  lateGraceMinutes: number;
  overtimeThresholdHours: number;
  maxBreakMinutes: number;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  password?: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
  employeeType?: EmployeeType;
  joiningDate?: string;
  profileImage: string;
  workLocation: string;
  phone: string;
  managerName?: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  createdAt: string;
  updatedAt?: string;
}

export interface AssignedTask {
  id: string;
  organizationId: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedToUserEmail: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  estimatedHours?: number;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  employeeNotes?: string;
}

export interface BreakRecord {
  id: string;
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
  userId: string;
  timestamp: string; // Formatted or ISO
  title: string;
  subtitle: string;
  type: 'CLOCK_IN' | 'BREAK_START' | 'BREAK_END' | 'TASK_UPDATE' | 'CLOCK_OUT' | 'LEAVE' | 'CORRECTION' | 'TASK_ASSIGNED';
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday, etc.
  clockIn?: string; // Formatted "09:02:14 AM"
  clockOut?: string; // Formatted "05:36:42 PM"
  clockInTimestamp?: number; // epoch ms
  clockOutTimestamp?: number; // epoch ms
  totalDurationSeconds: number; // clockOut - clockIn
  totalBreakSeconds: number; // accumulated breaks
  netWorkSeconds: number; // totalDuration - totalBreak
  overtimeSeconds: number; // netWork - standardRequired
  status: AttendanceStatusType;
  completionStatus?: string;
  isLate: boolean;
  lateMinutes: number;
  currentActivity?: string;
  initialTask?: string;
  endNotes?: string;
  isCorrected?: boolean;
  correctionReason?: string;
  leaveType?: LeaveType;
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
  overtimeSecondsToday: number;
  lastActive: string;
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  employeeId: string;
  department: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: RequestStatus;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  employeeId: string;
  department: string;
  date: string; // YYYY-MM-DD
  originalClockIn?: string;
  originalClockOut?: string;
  requestedClockIn: string; // "09:00:00 AM"
  requestedClockOut: string; // "05:30:00 PM"
  reason: string;
  status: RequestStatus;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  action: 'ATTENDANCE_CORRECTION' | 'EMPLOYEE_STATUS_CHANGE' | 'SCHEDULE_UPDATE' | 'LEAVE_APPROVAL' | 'MANUAL_OVERRIDE' | 'TASK_ASSIGNMENT' | 'PASSWORD_RESET';
  targetUserId?: string;
  targetUserName?: string;
  targetEmployeeId?: string;
  fieldName: string;
  originalValue: string;
  newValue: string;
  changedByUserId: string;
  changedByUserName: string;
  changedByRole: UserRole;
  reason: string;
  timestamp: string; // ISO String
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId?: string; // If null, broadcasts to all admins
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
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
  autoClockOutOnIdle: boolean; // Auto clock out if cursor is not moving
  idleTimeoutMinutes: number; // Minutes of inactivity before auto clock out (e.g. 5)
  autoClockOutOnScreenOff: boolean; // Auto clock out if screen is turned off or locked
  screenOffGraceSeconds: number; // Grace period in seconds before screen-off clock-out (e.g. 10)
  idleWarningSeconds: number; // Warning countdown before idle clock-out (e.g. 30)
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}
