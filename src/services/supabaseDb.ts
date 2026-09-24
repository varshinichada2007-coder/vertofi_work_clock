import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User, AttendanceRecord, BreakRecord, Organization,
  AssignedTask, LeaveRequest, AttendanceCorrectionRequest,
  AuditLog, WorkScheduleConfig
} from '../types';

let hasSeededSupabase = false;

export class SupabaseDbService {
  isConfigured() {
    return isSupabaseConfigured();
  }

  // --- Initial Profiles Seed in Supabase ---
  async checkAndSeedDefaults(): Promise<void> {
    if (hasSeededSupabase || !this.isConfigured()) return;
    hasSeededSupabase = true;
    try {
      const defaultProfiles = [
        {
          id: 'f45bd396-988c-4f4a-8c85-f203722a1d41',
          name: 'Goutham Badiga',
          email: 'gouthambadiga01@gmail.com',
          employee_id: 'AD001',
          department: 'Administration',
          designation: 'System Administrator',
          role: 'ADMIN',
          employee_type: 'Employee',
          joining_date: '2026-09-04',
          phone: '+91 9666417876',
          work_location: 'Headquarters',
          manager_name: 'Board of Directors'
        },
        {
          id: '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
          name: 'Parvatham Geethika',
          email: 'parvathamgeethika@gmail.com',
          employee_id: 'EMP001',
          department: 'Engineering',
          designation: 'Frontend Intern',
          role: 'EMPLOYEE',
          employee_type: 'Intern',
          joining_date: '2026-09-04',
          phone: '+91 9603556970',
          work_location: 'Work From Home',
          manager_name: 'Goutham Badiga (Admin)'
        },
        {
          id: '22b17343-5a98-4791-a81a-bef302715d09',
          name: 'Varshini Chada',
          email: 'varshinichada2007@gmail.com',
          employee_id: 'EMP002',
          department: 'Engineering',
          designation: 'Frontend Intern',
          role: 'EMPLOYEE',
          employee_type: 'Intern',
          joining_date: '2026-09-05',
          phone: '+91 9652383330',
          work_location: 'Work From Home',
          manager_name: 'Goutham Badiga (Admin)'
        },
        {
          id: 'f0db1ceb-584e-4282-ae7b-2707bab456ab',
          name: 'Dasari Pravallika',
          email: 'dasaripravallika137@gmail.com',
          employee_id: 'EMP003',
          department: 'Engineering',
          designation: 'Technical Intern',
          role: 'EMPLOYEE',
          employee_type: 'Intern',
          joining_date: '2026-09-05',
          phone: '+91 9701172908',
          work_location: 'Work From Home',
          manager_name: 'Goutham Badiga (Admin)'
        },
        {
          id: 'f9ee9b4b-a254-46d1-8ea6-5d191e5b7718',
          name: 'Polamuri Lohith',
          email: 'lohithpolamuri630@gmail.com',
          employee_id: 'EMP004',
          department: 'Engineering',
          designation: 'Technical Intern ( full stack)',
          role: 'EMPLOYEE',
          employee_type: 'Intern',
          joining_date: '2026-09-05',
          phone: '+91 6303154495',
          work_location: 'Work From Home',
          manager_name: 'Goutham Badiga (Admin)'
        },
        {
          id: '1b97461f-5f16-4976-a6fc-4ade9bc396fc',
          name: 'Mohammad Suhana',
          email: 'mdsuhana231@gmail.com',
          employee_id: 'EMP005',
          department: 'Engineering',
          designation: 'AI&ML engineer ( full stack )',
          role: 'EMPLOYEE',
          employee_type: 'Intern',
          joining_date: '2026-09-05',
          phone: '+91 9059637295',
          work_location: 'Work From Home',
          manager_name: 'Goutham Badiga (Admin)'
        }
      ];

      await supabase.from('profiles').upsert(defaultProfiles);
    } catch (err) {
      console.warn('Supabase profile seed note:', err);
    }
  }

  // --- Profiles / Users ---
  async getProfiles(orgId?: string): Promise<User[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data) {
        console.error('Supabase getProfiles error:', error?.message);
        return null;
      }
      const PASSWORD_LOOKUP: Record<string, string> = {
        'gouthambadiga01@gmail.com': 'Vertofi@Fintech12',
        'parvathamgeethika@gmail.com': 'Geethika@123',
        'varshinichada2007@gmail.com': 'Varshini@123',
        'dasaripravallika137@gmail.com': 'Pravallika@123',
        'lohithpolamuri630@gmail.com': 'Lohith@123',
        'mdsuhana231@gmail.com': 'Suhana@123'
      };

      return data.map(p => {
        const emailLower = (p.email || '').toLowerCase().trim();
        const fallbackPw = PASSWORD_LOOKUP[emailLower] || (p.name ? p.name.split(' ').pop() + '@123' : 'password123');
        return {
          id: p.id,
          organizationId: 'org_vertofi',
          name: p.name,
          email: p.email,
          password: PASSWORD_LOOKUP[emailLower] || fallbackPw,
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
          status: 'ACTIVE',
          createdAt: p.created_at,
          updatedAt: p.updated_at
        };
      });
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
        name: user.name,
        email: user.email,
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
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error('Error upserting profile in Supabase:', error.message);
        return false;
      }
      return true;
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
    return true;
  }

  // --- Attendance Records ---
  async getAttendanceRecords(orgId?: string): Promise<AttendanceRecord[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) {
        console.error('Supabase getAttendanceRecords error:', error?.message);
        return null;
      }
      return data.map(r => ({
        id: r.id,
        organizationId: 'org_vertofi',
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
        overtimeSeconds: Math.max(0, (r.net_work_seconds || 0) - 25200),
        status: (r.status?.toUpperCase() === 'ON_BREAK' ? 'ON_BREAK' : ((r.status?.toUpperCase() === 'LATE' || r.is_late) ? 'LATE' : 'PRESENT')),
        completionStatus: r.completion_status || (r.status?.toUpperCase() === 'ON_BREAK' ? 'On Break' : 'Working'),
        isLate: r.is_late || false,
        lateMinutes: r.late_minutes || 0,
        initialTask: r.initial_task,
        currentActivity: r.current_activity,
        endNotes: r.end_notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch (e) {
      console.error('Error in getAttendanceRecords from Supabase:', e);
      return null;
    }
  }

  async upsertAttendanceRecord(rec: AttendanceRecord): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('attendance_records').upsert({
        id: rec.id,
        user_id: rec.userId,
        date: rec.date,
        day_name: rec.dayName,
        clock_in: rec.clockIn || '—',
        clock_in_timestamp: rec.clockInTimestamp || 0,
        clock_out: rec.clockOut || null,
        clock_out_timestamp: rec.clockOutTimestamp || null,
        total_break_seconds: rec.totalBreakSeconds || 0,
        total_work_seconds: rec.totalDurationSeconds || rec.netWorkSeconds || 0,
        net_work_seconds: rec.netWorkSeconds || 0,
        status: rec.status,
        completion_status: rec.completionStatus || 'Working',
        is_late: rec.isLate || false,
        late_minutes: rec.lateMinutes || 0,
        initial_task: rec.initialTask || null,
        current_activity: rec.currentActivity || null,
        end_notes: rec.endNotes || null,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error('Supabase upsertAttendanceRecord error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error in upsertAttendanceRecord:', e);
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
      if (error) {
        console.error('Supabase upsertBreakRecord error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }  // --- Leave Requests ---
  async getLeaveRequests(orgId?: string): Promise<LeaveRequest[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase.from('leave_requests').select('*');
      if (error || !data) return null;
      return data.map(l => ({
        id: l.id,
        organizationId: 'org_vertofi',
        userId: l.user_id,
        userName: l.user_name,
        userEmail: l.user_email || '',
        employeeId: l.user_employee_id || l.employee_id || '',
        department: l.user_department || l.department || 'Engineering',
        leaveType: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        daysCount: l.total_days || l.days_count || 1,
        reason: l.reason,
        status: l.status,
        adminRemarks: l.review_reason || l.admin_remarks,
        reviewedBy: l.reviewed_by,
        reviewedAt: l.reviewed_at,
        createdAt: l.created_at
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertLeaveRequest(l: LeaveRequest): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('leave_requests').upsert({
        id: l.id,
        user_id: l.userId,
        user_name: l.userName,
        user_email: l.userEmail,
        employee_id: l.employeeId,
        department: l.department,
        leave_type: l.leaveType,
        start_date: l.startDate,
        end_date: l.endDate,
        days_count: l.daysCount,
        reason: l.reason,
        status: l.status,
        admin_remarks: l.adminRemarks,
        reviewed_by: l.reviewedBy,
        reviewed_at: l.reviewedAt,
        created_at: l.createdAt
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
      const { data, error } = await supabase.from('correction_requests').select('*');
      if (error || !data) return null;
      return data.map(c => ({
        id: c.id,
        organizationId: 'org_vertofi',
        userId: c.user_id,
        userName: c.user_name,
        userEmail: c.user_email || '',
        employeeId: c.user_employee_id || c.employee_id || '',
        department: c.user_department || c.department || 'Engineering',
        date: c.date,
        originalClockIn: c.original_clock_in,
        originalClockOut: c.original_clock_out,
        requestedClockIn: c.requested_clock_in || c.proposed_value || '09:00:00 AM',
        requestedClockOut: c.requested_clock_out || '05:30:00 PM',
        reason: c.reason,
        status: c.status,
        adminRemarks: c.review_reason || c.admin_remarks,
        reviewedBy: c.reviewed_by,
        reviewedAt: c.reviewed_at,
        createdAt: c.created_at
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertCorrectionRequest(c: AttendanceCorrectionRequest): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('correction_requests').upsert({
        id: c.id,
        user_id: c.userId,
        user_name: c.userName,
        user_email: c.userEmail,
        employee_id: c.employeeId,
        department: c.department,
        date: c.date,
        original_clock_in: c.originalClockIn,
        original_clock_out: c.originalClockOut,
        requested_clock_in: c.requestedClockIn,
        requested_clock_out: c.requestedClockOut,
        reason: c.reason,
        status: c.status,
        admin_remarks: c.adminRemarks,
        reviewed_by: c.reviewedBy,
        reviewed_at: c.reviewedAt,
        created_at: c.createdAt
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
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(a => ({
        id: a.id,
        organizationId: 'org_vertofi',
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
        reason: a.reason,
        timestamp: a.created_at || new Date().toISOString()
      }));
    } catch (e) {
      return null;
    }
  }

  async insertAuditLog(a: AuditLog): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('audit_logs').insert({
        id: a.id,
        action: a.action,
        target_user_id: a.targetUserId,
        target_user_name: a.targetUserName,
        target_employee_id: a.targetEmployeeId,
        field_name: a.fieldName,
        original_value: a.originalValue,
        new_value: a.newValue,
        changed_by_user_id: a.changedByUserId,
        changed_by_user_name: a.changedByUserName,
        changed_by_role: a.changedByRole,
        reason: a.reason,
        created_at: a.timestamp || new Date().toISOString()
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
      const { data, error } = await supabase.from('assigned_tasks').select('*');
      if (error || !data) return null;
      return data.map(t => ({
        id: t.id,
        organizationId: 'org_vertofi',
        title: t.title,
        description: t.description,
        assignedToUserId: t.assigned_to_user_id,
        assignedToUserName: t.assigned_to_user_name || t.assigned_to_name || '',
        assignedToUserEmail: t.assigned_to_user_email || '',
        assignedByUserId: t.assigned_by_user_id,
        assignedByUserName: t.assigned_by_user_name || t.assigned_by_name || '',
        priority: t.priority,
        status: t.status,
        dueDate: t.due_date || t.deadline || new Date().toISOString().split('T')[0],
        createdAt: t.created_at,
        completedAt: t.completed_at,
        employeeNotes: t.employee_notes || t.notes
      }));
    } catch (e) {
      return null;
    }
  }

  async upsertAssignedTask(t: AssignedTask): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await supabase.from('assigned_tasks').upsert({
        id: t.id,
        title: t.title,
        description: t.description,
        assigned_to_user_id: t.assignedToUserId,
        assigned_to_user_name: t.assignedToUserName,
        assigned_to_user_email: t.assignedToUserEmail,
        assigned_by_user_id: t.assignedByUserId,
        assigned_by_user_name: t.assignedByUserName,
        priority: t.priority,
        status: t.status,
        due_date: t.dueDate,
        created_at: t.createdAt,
        completed_at: t.completedAt,
        employee_notes: t.employeeNotes
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
        .channel(`public:${tableName}_${Date.now()}`)
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
