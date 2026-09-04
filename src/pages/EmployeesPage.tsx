import React, { useState } from 'react';
import { UserCheck, Search, Mail, Phone, MapPin, ExternalLink, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { User } from '../types';
import { EmployeeDetailModal } from '../components/modals/EmployeeDetailModal';
import { AddEmployeeModal } from '../components/modals/AddEmployeeModal';

export const EmployeesPage: React.FC = () => {
  const { users } = useAuth();
  const { setIsAddEmployeeModalOpen } = useWorkClock();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Exclude Admin from general employee list
  const employees = users.filter(u => u.role !== 'ADMIN');

  const filtered = employees.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-400" /> Employee & Intern Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage employee records, joining dates, roles & profiles</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search directory..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 w-full sm:w-56"
            />
          </div>

          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Employee
          </button>
        </div>
      </div>

      {/* Employees Cards Grid / Empty State */}
      {employees.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-4 bg-slate-900/80 rounded-3xl border border-slate-800 glass-card">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">No employees added yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You are currently logged in as the System Administrator. Add employees or interns to populate the directory.
            </p>
          </div>
          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 shadow-xl glass-card cursor-pointer transition-all duration-200 space-y-4 group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={emp.profileImage}
                  alt={emp.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-brand-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 truncate">{emp.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                      {emp.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{emp.designation}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {emp.employeeType || 'Employee'}
                    </span>
                    <span className="text-[11px] text-slate-400">{emp.department}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{emp.workLocation}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <span className="text-xs font-semibold text-brand-400 group-hover:underline flex items-center gap-1">
                  View Profile & Exact Breaks <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEmployeeModal />
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};
