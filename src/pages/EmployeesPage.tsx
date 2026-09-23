import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Filter, Shield, MoreVertical, Edit2,
  Trash2, CheckCircle2, XCircle, Mail, Phone, MapPin, Calendar,
  Building2, Power, Eye, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabaseDb } from '../services/supabaseDb';
import { User, EmployeeType } from '../types';
import { AddEmployeeModal } from '../components/modals/AddEmployeeModal';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';
import { AssignWorkModal } from '../components/modals/AssignWorkModal';

export const EmployeesPage: React.FC = () => {
  const { user, organization, toggleEmployeeStatus } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetUserId, setAssignTargetUserId] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const data = await api.getEmployees(organization?.id);
      setEmployees(data);
    } catch (e) {
      console.error('Error fetching employees:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 4000);
    const subProfiles = supabaseDb.subscribeToTableChanges('profiles', () => {
      fetchEmployees();
    });
    return () => {
      clearInterval(interval);
      subProfiles?.unsubscribe?.();
    };
  }, [organization?.id]);

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDept = departmentFilter === 'ALL' || e.department === departmentFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? e.status !== 'DEACTIVATED' : e.status === 'DEACTIVATED');

    return matchSearch && matchDept && matchStatus;
  });

  const handleToggleStatus = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleEmployeeStatus(userId);
      await fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>{organization?.name} • Staff Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Employee &amp; Intern Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin Portal: Provision new staff/interns, assign work deliverables, and manage profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setAssignTargetUserId('');
              setIsAssignModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-brand-600" />
            <span>Assign Work</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, email or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-all"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
        >
          <option value="ALL">All Departments ({departments.length})</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
        >
          <option value="ALL">All Account Statuses</option>
          <option value="ACTIVE">Active Employees Only</option>
          <option value="DEACTIVATED">Deactivated Accounts</option>
        </select>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
            No employees found matching the filters.
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isDeactivated = emp.status === 'DEACTIVATED';
            const isAdminRole = emp.role === 'ADMIN';

            return (
              <div
                key={emp.id}
                className={`p-5 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between shadow-sm relative group ${
                  isDeactivated
                    ? 'border-rose-200 opacity-75'
                    : 'border-slate-200 hover:border-brand-400 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {emp.employeeId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isAdminRole ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {emp.employeeType || 'Employee'}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDeactivated
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isDeactivated ? 'Deactivated' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 border-2 border-brand-200 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{emp.name}</h3>
                      <p className="text-xs text-brand-600 font-medium truncate">{emp.designation}</p>
                      <p className="text-[11px] text-slate-500 truncate">{emp.department}</p>
                    </div>
                  </div>

                  {/* Contact & Meta Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.workLocation || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Joined: {emp.joiningDate || '2025-01-01'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(emp);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-600" />
                    <span>Attendance</span>
                  </button>

                  {!isAdminRole && (
                    <>
                      <button
                        onClick={() => {
                          setAssignTargetUserId(emp.id);
                          setIsAssignModalOpen(true);
                        }}
                        title="Assign work deliverable"
                        className="py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-all flex items-center gap-1 border border-brand-200 cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Assign Work</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleStatus(emp.id, e)}
                        title={isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isDeactivated
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          fetchEmployees();
        }}
      />

      {/* Assign Work Modal */}
      <AssignWorkModal
        isOpen={isAssignModalOpen}
        preselectedUserId={assignTargetUserId}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchEmployees}
      />

      {/* Employee Detail Modal */}
      {selectedUser && (
        <EmployeeDetailModal
          member={{
            user: selectedUser,
            currentStatus: 'NOT_CLOCKED_IN',
            totalBreakSecondsToday: 0,
            remainingBreakSecondsToday: 3600,
            totalWorkSecondsToday: 0,
            overtimeSecondsToday: 0,
            lastActive: 'Active'
          }}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};


