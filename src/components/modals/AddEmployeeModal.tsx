import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, Phone, User, Calendar, Briefcase, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';
import { EmployeeType } from '../../types';

export const AddEmployeeModal: React.FC = () => {
  const { addEmployee } = useAuth();
  const { isAddEmployeeModalOpen, setIsAddEmployeeModalOpen, addToast } = useWorkClock();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [employeeType, setEmployeeType] = useState<EmployeeType>('Employee');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [profileImage, setProfileImage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAddEmployeeModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await addEmployee({
        name,
        email,
        password,
        employeeId: employeeId || undefined,
        phone,
        department,
        designation,
        employeeType,
        joiningDate,
        profileImage: profileImage.trim() || undefined
      });

      addToast('Success', 'Employee added successfully.', 'success');
      setIsAddEmployeeModalOpen(false);

      // Reset form
      setName('');
      setEmail('');
      setEmployeeId('');
      setPhone('+91 ');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to add employee.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Add New Employee / Intern</h3>
              <p className="text-xs text-slate-400">Create login credentials and employee profile</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddEmployeeModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@vertofi.com"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP001 (Auto-generated if blank)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Employee Type *
              </label>
              <select
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value as EmployeeType)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer font-bold text-brand-300"
              >
                <option value="Employee">Employee (Full Time)</option>
                <option value="Intern">Intern (Trainee)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Designation / Role *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Software Engineer Intern"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Profile Picture URL (Optional)
            </label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEmployeeModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:from-brand-600 hover:to-brand-700 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
