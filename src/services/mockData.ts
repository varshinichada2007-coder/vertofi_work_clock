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
    standardWorkHours: 8,
    standardStartTime: '09:00',
    standardEndTime: '17:30',
    lateGraceMinutes: 15,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_WORK_SCHEDULE: WorkScheduleConfig = {
  organizationId: 'org_vertofi',
  schedules: [
    { day: 'Monday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
    { day: 'Tuesday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
    { day: 'Wednesday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
    { day: 'Thursday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
    { day: 'Friday', isWorkday: true, startTime: '09:00', endTime: '17:30', requiredHours: 8 },
    { day: 'Saturday', isWorkday: false, startTime: '09:00', endTime: '13:00', requiredHours: 0 },
    { day: 'Sunday', isWorkday: false, startTime: '09:00', endTime: '13:00', requiredHours: 0 }
  ],
  lateGraceMinutes: 15,
  overtimeThresholdHours: 8,
  maxBreakMinutes: 60
};

export const DEFAULT_SETTINGS: ReminderSettings = {
  clockInReminder: true,
  clockInTime: '09:00',
  clockOutReminder: true,
  clockOutTime: '18:00',
  breakDurationWarning: true,
  maxBreakMinutes: 60,
  activityCheckIn: true,
  activityIntervalMinutes: 120,
  use24HourClock: false,
  timezone: 'Asia/Kolkata',
  emailNotifications: true,
  autoClockOutOnIdle: true,
  idleTimeoutMinutes: 5,
  autoClockOutOnScreenOff: true,
  screenOffGraceSeconds: 10,
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

// Helper to generate rich realistic September 2026 attendance records
export function generateSeedAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const orgId = 'org_vertofi';
  const employees = INITIAL_USERS.filter(u => u.role === 'EMPLOYEE');

  // Days in September 2026: 1st through 15th
  const sepDays = [
    { dayNum: 1, dateStr: '2026-09-01', dayName: 'Tuesday' },
    { dayNum: 2, dateStr: '2026-09-02', dayName: 'Wednesday' },
    { dayNum: 3, dateStr: '2026-09-03', dayName: 'Thursday' },
    { dayNum: 4, dateStr: '2026-09-04', dayName: 'Friday' },
    { dayNum: 7, dateStr: '2026-09-07', dayName: 'Monday' },
    { dayNum: 8, dateStr: '2026-09-08', dayName: 'Tuesday' },
    { dayNum: 9, dateStr: '2026-09-09', dayName: 'Wednesday' },
    { dayNum: 10, dateStr: '2026-09-10', dayName: 'Thursday' },
    { dayNum: 11, dateStr: '2026-09-11', dayName: 'Friday' },
    { dayNum: 14, dateStr: '2026-09-14', dayName: 'Monday' },
    { dayNum: 15, dateStr: '2026-09-15', dayName: 'Tuesday' }
  ];

  employees.forEach((emp) => {
    sepDays.forEach((d) => {
      let clockInTime = '08:57:30 AM';
      let clockOutTime = '05:38:15 PM';
      let inHour = 8;
      let inMin = 57;
      let outHour = 17;
      let outMin = 38;
      let isLate = false;
      let lateMinutes = 0;
      let status: AttendanceRecord['status'] = 'PRESENT';
      let breakSec = 2700; // 45 mins
      let netWorkSec = 29445; // ~8h 10m
      let overtimeSec = 645;
      let leaveType: AttendanceRecord['leaveType'] = undefined;

      if (emp.id === '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7') {
        if (d.dayNum === 3) {
          clockInTime = '09:18:24 AM';
          inHour = 9;
          inMin = 18;
          isLate = true;
          lateMinutes = 18;
          status = 'LATE';
          netWorkSec = 28200;
          overtimeSec = 0;
        } else if (d.dayNum === 9) {
          status = 'LEAVE';
          leaveType = 'Casual Leave';
          clockInTime = undefined as any;
          clockOutTime = undefined as any;
          netWorkSec = 0;
          breakSec = 0;
          overtimeSec = 0;
        }
      } else if (emp.id === '22b17343-5a98-4791-a81a-bef302715d09') {
        if (d.dayNum === 7) {
          clockInTime = '09:12:00 AM';
          inHour = 9;
          inMin = 12;
          isLate = true;
          lateMinutes = 12;
          status = 'LATE';
        } else if (d.dayNum === 10) {
          clockOutTime = '06:45:00 PM';
          outHour = 18;
          outMin = 45;
          overtimeSec = 3600 + 900;
          netWorkSec = 32400;
        }
      }

      const inTimestamp = clockInTime ? new Date(`${d.dateStr}T${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:00`).getTime() : undefined;
      const outTimestamp = clockOutTime ? new Date(`${d.dateStr}T${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00`).getTime() : undefined;
      const totalDurationSec = inTimestamp && outTimestamp ? Math.floor((outTimestamp - inTimestamp) / 1000) : 0;

      records.push({
        id: `att_${d.dateStr}_${emp.id}`,
        organizationId: orgId,
        userId: emp.id,
        date: d.dateStr,
        dayName: d.dayName,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        clockInTimestamp: inTimestamp,
        clockOutTimestamp: outTimestamp,
        totalDurationSeconds: totalDurationSec,
        totalBreakSeconds: breakSec,
        netWorkSeconds: netWorkSec,
        overtimeSeconds: overtimeSec,
        status,
        completionStatus: status === 'LEAVE' ? 'On Leave' : netWorkSec >= 28800 ? '8 Hour Work Completed' : 'Workday Incomplete',
        isLate,
        lateMinutes,
        leaveType,
        initialTask: `${emp.designation} daily tasks`,
        currentActivity: `${emp.designation} daily tasks`,
        createdAt: `${d.dateStr}T08:55:00.000Z`,
        updatedAt: `${d.dateStr}T17:40:00.000Z`
      });
    });
  });

  return records;
}

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lvr_101',
    organizationId: 'org_vertofi',
    userId: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    userName: 'Parvatham Geethika',
    userEmail: 'parvathamgeethika@gmail.com',
    employeeId: 'EMP001',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: '2026-09-09',
    endDate: '2026-09-09',
    daysCount: 1,
    reason: 'Family appointment and personal errands.',
    status: 'Approved',
    adminRemarks: 'Approved for Sep 9.',
    reviewedBy: 'Goutham Badiga',
    reviewedAt: '2026-09-08T10:30:00.000Z',
    createdAt: '2026-09-07T14:20:00.000Z'
  },
  {
    id: 'lvr_102',
    organizationId: 'org_vertofi',
    userId: '22b17343-5a98-4791-a81a-bef302715d09',
    userName: 'Varshini Chada',
    userEmail: 'varshinichada2007@gmail.com',
    employeeId: 'EMP002',
    department: 'Engineering',
    leaveType: 'Annual Vacation',
    startDate: '2026-09-22',
    endDate: '2026-09-24',
    daysCount: 3,
    reason: 'Family vacation travel.',
    status: 'Pending',
    createdAt: '2026-09-15T08:30:00.000Z'
  }
];

export const INITIAL_CORRECTION_REQUESTS: AttendanceCorrectionRequest[] = [
  {
    id: 'crq_201',
    organizationId: 'org_vertofi',
    userId: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    userName: 'Parvatham Geethika',
    userEmail: 'parvathamgeethika@gmail.com',
    employeeId: 'EMP001',
    department: 'Engineering',
    date: '2026-09-03',
    originalClockIn: '09:18:24 AM',
    originalClockOut: '05:38:15 PM',
    requestedClockIn: '09:00:00 AM',
    requestedClockOut: '05:38:15 PM',
    reason: 'Had network latency logging into the portal at 9:00 AM.',
    status: 'Pending',
    createdAt: '2026-09-04T09:10:00.000Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_301',
    organizationId: 'org_vertofi',
    action: 'LEAVE_APPROVAL',
    targetUserId: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    targetUserName: 'Parvatham Geethika',
    targetEmployeeId: 'EMP001',
    fieldName: 'attendance_status',
    originalValue: 'ABSENT',
    newValue: 'LEAVE',
    changedByUserId: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
    changedByUserName: 'Goutham Badiga (Admin)',
    changedByRole: 'ADMIN',
    reason: 'Approved Casual Leave for Sep 9.',
    timestamp: '2026-09-08T10:30:00.000Z'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_401',
    organizationId: 'org_vertofi',
    targetRole: 'ADMIN',
    title: 'New Leave Request Submitted',
    message: 'Varshini Chada applied for 3 days Annual Vacation (Sep 22 - Sep 24).',
    type: 'info',
    isRead: false,
    createdAt: '2026-09-15T08:30:00.000Z'
  },
  {
    id: 'notif_402',
    organizationId: 'org_vertofi',
    targetRole: 'ADMIN',
    title: 'Attendance Correction Pending',
    message: 'Parvatham Geethika submitted an attendance correction request for Sep 3.',
    type: 'warning',
    isRead: false,
    createdAt: '2026-09-04T09:10:00.000Z'
  },
  {
    id: 'notif_403',
    organizationId: 'org_vertofi',
    userId: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    targetRole: 'EMPLOYEE',
    title: 'Leave Request Approved',
    message: 'Your Casual Leave for Sep 9 has been approved by Goutham Badiga.',
    type: 'success',
    isRead: true,
    createdAt: '2026-09-08T10:30:00.000Z'
  }
];

export const INITIAL_ASSIGNED_TASKS = [
  {
    id: 'task_001',
    organizationId: 'org_vertofi',
    assignedByUserId: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
    assignedByUserName: 'Goutham Badiga',
    assignedToUserId: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
    assignedToUserName: 'Parvatham Geethika',
    assignedToUserEmail: 'parvathamgeethika@gmail.com',
    title: 'Frontend Portal Performance & Optimization',
    description: 'Ensure clean responsiveness and real-time punch state synchronization.',
    priority: 'HIGH' as const,
    dueDate: '2026-09-18',
    estimatedHours: 6,
    status: 'IN_PROGRESS' as const,
    createdAt: '2026-09-15T09:30:00.000Z'
  },
  {
    id: 'task_002',
    organizationId: 'org_vertofi',
    assignedByUserId: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
    assignedByUserName: 'Goutham Badiga',
    assignedToUserId: '22b17343-5a98-4791-a81a-bef302715d09',
    assignedToUserName: 'Varshini Chada',
    assignedToUserEmail: 'varshinichada2007@gmail.com',
    title: 'Design System & Timesheets UI Wireframing',
    description: 'Ensure clean SaaS white background styling and responsive mobile punch clock layouts.',
    priority: 'MEDIUM' as const,
    dueDate: '2026-09-19',
    estimatedHours: 4,
    status: 'PENDING' as const,
    createdAt: '2026-09-15T10:00:00.000Z'
  }
];
