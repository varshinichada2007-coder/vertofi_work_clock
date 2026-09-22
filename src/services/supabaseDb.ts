import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User, AttendanceRecord, BreakRecord, Organization,
  AssignedTask, LeaveRequest, AttendanceCorrectionRequest,
  AuditLog, WorkScheduleConfig
} from '../types';

export class SupabaseDbService {
  isConfigured() {
    return isSupabaseConfigured();
  }

  // --- Initial / Auto Seed ---
  async checkAndSeedDefaults(): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const { data: existingProfiles, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Supabase profiles check error (check if schema is applied):', error.message);
        return;
      }

      if (!existingProfiles || existingProfiles.length === 0) {
        console.log('Seeding initial Supabase default organization and accounts...');
        
        // Seed Organization
        await supabase.from('organizations').upsert([
          {
            id: 'org_vertofi',
            name: 'Vertofi',
            code: 'VERTOFI-HQ',
            standard_hours: 8.0,
            max_break_minutes: 60,
            timezone: 'Asia/Kolkata'
          }
        ]);

        // Seed Profiles with the authentic accounts
        await supabase.from('profiles').upsert([
          {
            id: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
            organization_id: 'org_vertofi',
            name: 'Goutham Badiga',
            email: 'gouthambadiga01@gmail.com',
            password: 'Vertofi@Fintech12',
            employee_id: 'AD001',
            department: 'Administration',
            designation: 'System Administrator',
            role: 'ADMIN',
            employee_type: 'Employee',
            joining_date: '2026-09-04',
            phone: '+91 9666417876',
            work_location: 'Headquarters',
            manager_name: 'Board of Directors',
            status: 'ACTIVE'
          },
          {
            id: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
            organization_id: 'org_vertofi',
            name: 'Parvatham Geethika',
            email: 'parvathamgeethika@gmail.com',
            password: 'Geethika@123',
            employee_id: 'EMP001',
            department: 'Engineering',
            designation: 'Frontend Intern',
            role: 'EMPLOYEE',
            employee_type: 'Intern',
            joining_date: '2026-09-04',
            phone: '+91 9603556970',
            work_location: 'Work From Home',
            manager_name: 'Goutham Badiga (Admin)',
            status: 'ACTIVE'
          },
          {
            id: '22b17343-5a98-4791-a81a-bef302715d09',
            organization_id: 'org_vertofi',
            name: 'Varshini Chada',
            email: 'varshinichada2007@gmail.com',
            password: 'Varshini@123',
            employee_id: 'EMP002',
            department: 'Engineering',
            designation: 'Frontend Intern',
            role: 'EMPLOYEE',
            employee_type: 'Intern',
            joining_date: '2026-09-05',
            phone: '+91 9652383330',
            work_location: 'Work From Home',
            manager_name: 'Goutham Badiga (Admin)',
            status: 'ACTIVE'
          },
          {
            id: 'f0db1ceb-584e-4282-ae7b-2707bab456ab',
            organization_id: 'org_vertofi',
            name: 'Dasari Pravallika',
            email: 'dasaripravallika137@gmail.com',
            password: 'Pravallika@123',
            employee_id: 'EMP003',
            department: 'Engineering',
            designation: 'Technical Intern',
            role: 'EMPLOYEE',
            employee_type: 'Intern',
            joining_date: '2026-09-05',
            phone: '+91 9701172908',
            work_location: 'Work From Home',
            manager_name: 'Goutham Badiga (Admin)',
            status: 'ACTIVE'
          },
          {
            id: 'f9ee9b4b-a254-46d1-8ea6-5d191e5b7718',
            organization_id: 'org_vertofi',
            name: 'Polamuri Lohith',
            email: 'lohithpolamuri630@gmail.com',
            password: 'Lohith@123',
            employee_id: 'EMP004',
            department: 'Engineering',
            designation: 'Technical Intern ( full stack)',
            role: 'EMPLOYEE',
            employee_type: 'Intern',
            joining_date: '2026-09-05',
            phone: '+91 6303154495',
            work_location: 'Work From Home',
            manager_name: 'Goutham Badiga (Admin)',
            status: 'ACTIVE'
          },
          {
            id: '1b97461f-5f16-4976-a6fc-4ade9bc396fc',
            organization_id: 'org_vertofi',
            name: 'Mohammad Suhana',
            email: 'mdsuhana231@gmail.com',
            password: 'Suhana@123',
            employee_id: 'EMP005',
            department: 'Engineering',
            designation: 'AI&ML engineer ( full stack )',
            role: 'EMPLOYEE',
            employee_type: 'Intern',
            joining_date: '2026-09-05',
            phone: '+91 9059637295',
            work_location: 'Work From Home',
            manager_name: 'Goutham Badiga (Admin)',
            status: 'ACTIVE'
          }
        ]);
      }
    } catch (err) {
      console.warn('Supabase seeding attempt notice:', err);
    }
  }

  // --- Profiles / Users ---
  async getProfiles(orgId?: string): Promise<User[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('profiles').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(p => ({
        id: p.id,
        organizationId: p.organization_id || 'org_vertofi',
        name: p.name,
        email: p.email,
        password: p.password,
        employeeId: p.employee_id,
        department: p.department,
        designation: p.designation,
        role: p.role,
        employeeType: p.employee_type || 'Employee',
        joiningDate: p.joining_date,
        profileImage: p.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}`,
        workLocation: p.work_location || 'Work From Home',
        phone: p.phone || '+91 98765 43210',
        managerName: p.manager_name || 'Goutham Badiga (Admin)',
        status: p.status || 'ACTIVE',
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch (e) {
      console.error('Error in getProfiles from Supabase:', e);
      return null;
    }
  }

  async upsertProfile(user: User): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        organization_id: user.organizationId || 'org_vertofi',
        name: user.name,
        email: user.email,
        password: user.password,
        employee_id: user.employeeId,
        department: user.department,
        designation: user.designation,
        role: user.role,
        employee_type: user.employeeType,
        joining_date: user.joiningDate,
        profile_image: user.profileImage,
        work_location: user.workLocation,
        phone: user.phone,
        manager_name: user.managerName,
        status: user.status,
        updated_at: new Date().toISOString()
      });
      return !error;
    } catch (e) {
      console.error('Error upserting profile to Supabase:', e);
      return false;
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      return !error;
    } catch (e) {
      return false;
    }
  }

  async updatePasswordByEmail(email: string, newPassword: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ password: newPassword, updated_at: new Date().toISOString() })
        .ilike('email', email.trim());
      return !error;
    } catch (e) {
      console.error('Error updating password in Supabase:', e);
      return false;
    }
  }

  // --- Attendance Records ---
  async getAttendanceRecords(orgId?: string): Promise<AttendanceRecord[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('attendance_records').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(r => ({
        id: r.id,
        organizationId: r.organization_id || 'org_vertofi',
        userId: r.user_id,
        date: r.date,
        dayName: r.day_name,
        clockIn: r.clock_in,
        clockInTimestamp: r.clock_in_timestamp ? Number(r.clock_in_timestamp) : undefined,
        clockOut: r.clock_out,
        clockOutTimestamp: r.clock_out_timestamp ? Number(r.clock_out_timestamp) : undefined,
        totalDurationSeconds: r.total_work_seconds || 0,
        totalBreakSeconds: r.total_break_seconds || 0,
        netWorkSeconds: r.net_work_seconds || 0,
        overtimeSeconds: Math.max(0, (r.net_work_seconds || 0) - 28800),
        status: r.status,
        completionStatus: r.completion_status,
        isLate: r.is_late || false,
        lateMinutes: r.late_minutes || 0,
        initialTask: r.initial_task,
        currentActivity: r.current_activity,
        endNotes: r.end_notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertAttendanceRecord(rec: AttendanceRecord): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('attendance_records').upsert({
        id: rec.id,
        organization_id: rec.organizationId || 'org_vertofi',
        user_id: rec.userId,
        date: rec.date,
        day_name: rec.dayName,
        clock_in: rec.clockIn || '—',
        clock_in_timestamp: rec.clockInTimestamp || 0,
        clock_out: rec.clockOut,
        clock_out_timestamp: rec.clockOutTimestamp,
        total_break_seconds: rec.totalBreakSeconds || 0,
        total_work_seconds: rec.totalDurationSeconds || rec.netWorkSeconds || 0,
        net_work_seconds: rec.netWorkSeconds || 0,
        status: rec.status,
        completion_status: rec.completionStatus || 'Working',
        is_late: rec.isLate || false,
        late_minutes: rec.lateMinutes || 0,
        initial_task: rec.initialTask,
        current_activity: rec.currentActivity,
        end_notes: rec.endNotes,
        updated_at: new Date().toISOString()
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Break Records ---
  async getBreakRecords(attendanceId?: string): Promise<BreakRecord[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('break_records').select('*');
      if (attendanceId) query = query.eq('attendance_id', attendanceId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(b => ({
        id: b.id,
        organizationId: 'org_vertofi',
        attendanceId: b.attendance_id,
        userId: b.user_id,
        breakType: b.break_type,
        startTime: b.start_time,
        endTime: b.end_time,
        durationSeconds: b.duration_seconds || 0,
        notes: b.notes
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertBreakRecord(b: BreakRecord): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('break_records').upsert({
        id: b.id,
        attendance_id: b.attendanceId,
        user_id: b.userId,
        break_type: b.breakType,
        start_time: b.startTime,
        end_time: b.endTime,
        duration_seconds: b.durationSeconds || 0,
        notes: b.notes
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Assigned Tasks ---
  async getAssignedTasks(orgId?: string): Promise<AssignedTask[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('assigned_tasks').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(t => ({
        id: t.id,
        organizationId: t.organization_id || 'org_vertofi',
        assignedByUserId: t.assigned_by_user_id || 'f45bd396-988c-4f4a-8c85-f203722a1d41',
        assignedByUserName: t.assigned_by_name || 'Goutham Badiga (Admin)',
        assignedToUserId: t.assigned_to_user_id,
        assignedToUserName: t.assigned_to_user_name || 'Employee',
        assignedToUserEmail: t.assigned_to_user_email || '',
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        dueDate: t.due_date,
        estimatedHours: t.estimated_hours ? Number(t.estimated_hours) : 4,
        createdAt: t.created_at,
        completedAt: t.completed_at,
        employeeNotes: t.employee_notes
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertAssignedTask(task: AssignedTask): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('assigned_tasks').upsert({
        id: task.id,
        organization_id: task.organizationId || 'org_vertofi',
        assigned_to_user_id: task.assignedToUserId,
        assigned_by_name: task.assignedByUserName,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate,
        estimated_hours: task.estimatedHours,
        updated_at: new Date().toISOString()
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Leave Requests ---
  async getLeaveRequests(orgId?: string): Promise<LeaveRequest[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('leave_requests').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(l => ({
        id: l.id,
        organizationId: l.organization_id || 'org_vertofi',
        userId: l.user_id,
        userName: l.user_name,
        userEmail: l.user_email || '',
        employeeId: l.employee_id,
        department: l.department,
        leaveType: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        daysCount: l.days_count ? Number(l.days_count) : 1,
        reason: l.reason,
        status: l.status,
        adminRemarks: l.admin_notes,
        createdAt: l.created_at,
        updatedAt: l.updated_at
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertLeaveRequest(req: LeaveRequest): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('leave_requests').upsert({
        id: req.id,
        organization_id: req.organizationId || 'org_vertofi',
        user_id: req.userId,
        user_name: req.userName,
        employee_id: req.employeeId,
        department: req.department,
        leave_type: req.leaveType,
        start_date: req.startDate,
        end_date: req.endDate,
        days_count: req.daysCount,
        reason: req.reason,
        status: req.status,
        admin_notes: req.adminRemarks,
        updated_at: new Date().toISOString()
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Attendance Corrections ---
  async getCorrectionRequests(orgId?: string): Promise<AttendanceCorrectionRequest[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('attendance_corrections').select('*');
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(c => ({
        id: c.id,
        organizationId: c.organization_id || 'org_vertofi',
        userId: c.user_id,
        userName: c.user_name,
        userEmail: c.user_email || '',
        employeeId: c.employee_id,
        department: c.department || '',
        date: c.target_date,
        requestedClockIn: c.requested_clock_in,
        requestedClockOut: c.requested_clock_out,
        reason: c.reason,
        status: c.status,
        adminRemarks: c.admin_notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertCorrectionRequest(req: AttendanceCorrectionRequest): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('attendance_corrections').upsert({
        id: req.id,
        organization_id: req.organizationId || 'org_vertofi',
        user_id: req.userId,
        user_name: req.userName,
        employee_id: req.employeeId,
        target_date: req.date,
        requested_clock_in: req.requestedClockIn,
        requested_clock_out: req.requestedClockOut,
        reason: req.reason,
        status: req.status,
        admin_notes: req.adminRemarks,
        updated_at: new Date().toISOString()
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Audit Logs ---
  async getAuditLogs(orgId?: string): Promise<AuditLog[] | null> {
    if (!this.isConfigured()) return null;
    try {
      let query = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query;
      if (error || !data) return null;
      return data.map(a => ({
        id: a.id,
        organizationId: a.organization_id || 'org_vertofi',
        timestamp: a.timestamp,
        action: a.action,
        targetUserId: a.target_user_id,
        targetUserName: a.target_user_name,
        targetEmployeeId: a.target_employee_id,
        fieldName: a.field_name,
        originalValue: a.original_value,
        newValue: a.new_value,
        changedByUserId: a.changed_by_user_id,
        changedByUserName: a.changed_by_user_name,
        changedByRole: a.changed_by_role,
        reason: a.reason
      }));
    } catch (e) {
      return null;
    }
  }

  async insertAuditLog(log: AuditLog): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('audit_logs').insert({
        id: log.id,
        organization_id: log.organizationId || 'org_vertofi',
        timestamp: log.timestamp,
        action: log.action,
        target_user_id: log.targetUserId,
        target_user_name: log.targetUserName,
        target_employee_id: log.targetEmployeeId,
        field_name: log.fieldName,
        original_value: log.originalValue,
        new_value: log.newValue,
        changed_by_user_id: log.changedByUserId,
        changed_by_user_name: log.changedByUserName,
        changed_by_role: log.changedByRole,
        reason: log.reason
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  // --- Realtime Subscription Helpers ---
  subscribeToTableChanges(tableName: string, onChange: (payload: any) => void) {
    if (!this.isConfigured()) return { unsubscribe: () => {} };
    try {
      const channel = supabase
        .channel(`public:${tableName}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
          onChange(payload);
        })
        .subscribe();

      return {
        unsubscribe: () => {
          supabase.removeChannel(channel);
        }
      };
    } catch (e) {
      console.warn(`Error setting up realtime subscription for ${tableName}:`, e);
      return { unsubscribe: () => {} };
    }
  }
}

export const supabaseDb = new SupabaseDbService();
