import {
  Organization, User, AttendanceRecord, BreakRecord, WorkSession,
  ActivityRecord, LeaveRequest, AttendanceCorrectionRequest, AuditLog,
  NotificationItem, WorkScheduleConfig, ReminderSettings
} from '../types';

export const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_vertofi',
    name: 'Vertofi',
    code: 'VERTOFI',
    logo: '/logo.svg',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    standardWorkHours: 7,
    standardStartTime: '18:00',
    standardEndTime: '01:00',
    lateGraceMinutes: 15,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_WORK_SCHEDULE: WorkScheduleConfig = {
  organizationId: 'org_vertofi',
  schedules: [
    { day: 'Monday', isWorkday: true, startTime: '18:00', endTime: '01:00', requiredHours: 7 },
    { day: 'Tuesday', isWorkday: true, startTime: '18:00', endTime: '01:00', requiredHours: 7 },
    { day: 'Wednesday', isWorkday: true, startTime: '18:00', endTime: '01:00', requiredHours: 7 },
    { day: 'Thursday', isWorkday: true, startTime: '18:00', endTime: '01:00', requiredHours: 7 },
    { day: 'Friday', isWorkday: true, startTime: '18:00', endTime: '01:00', requiredHours: 7 },
    { day: 'Saturday', isWorkday: false, startTime: '18:00', endTime: '22:00', requiredHours: 0 },
    { day: 'Sunday', isWorkday: false, startTime: '18:00', endTime: '22:00', requiredHours: 0 }
  ],
  lateGraceMinutes: 15,
  overtimeThresholdHours: 7,
  maxBreakMinutes: 60
};

export const DEFAULT_SETTINGS: ReminderSettings = {
  clockInReminder: true,
  clockInTime: '18:00',
  clockOutReminder: true,
  clockOutTime: '01:00',
  breakDurationWarning: true,
  maxBreakMinutes: 60,
  activityCheckIn: true,
  activityIntervalMinutes: 120,
  use24HourClock: false,
  timezone: 'Asia/Kolkata',
  emailNotifications: true,
  autoClockOutOnIdle: false,
  idleTimeoutMinutes: 30,
  autoClockOutOnScreenOff: false,
  screenOffGraceSeconds: 60,
  idleWarningSeconds: 30
};

export const INITIAL_USERS: User[] = [
  // Admin User
  {
    id: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
    organizationId: 'org_vertofi',
    name: 'Goutham Badiga',
    email: 'gouthambadiga01@gmail.com',
    password: 'Vertofi@Fintech12',
    employeeId: 'AD001',
    department: 'Administration',
    designation: 'System Administrator',
    role: 'ADMIN',
    employeeType: 'Employee',
    joiningDate: '2026-09-04',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Goutham%20Badiga&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Headquarters',
    phone: '+91 9666417876',
    managerName: 'Board of Directors',
    status: 'ACTIVE',
    createdAt: '2026-09-04T12:30:42.622Z'
  },
  // 5 Authentic Employee Accounts
  {
    id: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    organizationId: 'org_vertofi',
    name: 'Parvatham Geethika',
    email: 'parvathamgeethika@gmail.com',
    password: 'Geethika@123',
    employeeId: 'EMP001',
    department: 'Engineering',
    designation: 'Frontend Intern',
    role: 'EMPLOYEE',
    employeeType: 'Intern',
    joiningDate: '2026-09-04',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Parvatham%20Geethika&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Work From Home',
    phone: '+91 9603556970',
    managerName: 'Goutham Badiga (Admin)',
    status: 'ACTIVE',
    createdAt: '2026-09-04T13:30:19.897Z'
  },
  {
    id: '22b17343-5a98-4791-a81a-bef302715d09',
    organizationId: 'org_vertofi',
    name: 'Varshini Chada',
    email: 'varshinichada2007@gmail.com',
    password: 'Varshini@123',
    employeeId: 'EMP002',
    department: 'Engineering',
    designation: 'Frontend Intern',
    role: 'EMPLOYEE',
    employeeType: 'Intern',
    joiningDate: '2026-09-05',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Varshini%20Chada&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Work From Home',
    phone: '+91 9652383330',
    managerName: 'Goutham Badiga (Admin)',
    status: 'ACTIVE',
    createdAt: '2026-09-05T12:38:46.633Z'
  },
  {
    id: 'f0db1ceb-584e-4282-ae7b-2707bab456ab',
    organizationId: 'org_vertofi',
    name: 'Dasari Pravallika',
    email: 'dasaripravallika137@gmail.com',
    password: 'Pravallika@123',
    employeeId: 'EMP003',
    department: 'Engineering',
    designation: 'Technical Intern',
    role: 'EMPLOYEE',
    employeeType: 'Intern',
    joiningDate: '2026-09-05',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Dasari%20Pravallika&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Work From Home',
    phone: '+91 9701172908',
    managerName: 'Goutham Badiga (Admin)',
    status: 'ACTIVE',
    createdAt: '2026-09-05T12:35:19.633Z'
  },
  {
    id: 'f9ee9b4b-a254-46d1-8ea6-5d191e5b7718',
    organizationId: 'org_vertofi',
    name: 'Polamuri Lohith',
    email: 'lohithpolamuri630@gmail.com',
    password: 'Lohith@123',
    employeeId: 'EMP004',
    department: 'Engineering',
    designation: 'Technical Intern ( full stack)',
    role: 'EMPLOYEE',
    employeeType: 'Intern',
    joiningDate: '2026-09-05',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Polamuri%20Lohith&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Work From Home',
    phone: '+91 6303154495',
    managerName: 'Goutham Badiga (Admin)',
    status: 'ACTIVE',
    createdAt: '2026-09-05T12:36:40.707Z'
  },
  {
    id: '1b97461f-5f16-4976-a6fc-4ade9bc396fc',
    organizationId: 'org_vertofi',
    name: 'Mohammad Suhana',
    email: 'mdsuhana231@gmail.com',
    password: 'Suhana@123',
    employeeId: 'EMP005',
    department: 'Engineering',
    designation: 'AI&ML engineer ( full stack )',
    role: 'EMPLOYEE',
    employeeType: 'Intern',
    joiningDate: '2026-09-05',
    profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Mohammad%20Suhana&backgroundColor=0c8ee9,0270c7',
    workLocation: 'Work From Home',
    phone: '+91 9059637295',
    managerName: 'Goutham Badiga (Admin)',
    status: 'ACTIVE',
    createdAt: '2026-09-05T12:37:54.955Z'
  }
];

// Clean seed function returning empty attendance array so records are only created when users login/punch from today
export function generateSeedAttendance(): AttendanceRecord[] {
  return [];
}

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

export const INITIAL_CORRECTION_REQUESTS: AttendanceCorrectionRequest[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ASSIGNED_TASKS: any[] = [];

