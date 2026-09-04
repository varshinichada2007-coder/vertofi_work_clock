import React, { useState } from 'react';
import { Clock, Lock, Mail, ArrowRight, UserPlus, LogIn, User as UserIcon, Building, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmployeeType, UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, addEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [employeeType, setEmployeeType] = useState<EmployeeType>('Employee');
  const [accountRole, setAccountRole] = useState<UserRole>('EMPLOYEE');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (signupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please try again.');
      return;
    }

    if (signupPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      const newUser = await addEmployee({
        name,
        email: signupEmail,
        password: signupPassword,
        employeeId: employeeId || undefined,
        department,
        designation,
        employeeType,
        role: accountRole,
        joiningDate: new Date().toISOString().split('T')[0]
      });

      // Auto login after signup
      await login(newUser.email, signupPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign up failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden my-auto">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10 my-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/30">
            <Clock className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Vertofi <span className="text-brand-400">WorkClock</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Work From Home Employee & Intern Time & Attendance System</p>
        </div>

        {/* Auth Card Container */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl glass-panel overflow-hidden">
          {/* Top Tab Bar: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-brand-500 text-brand-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
              className={`py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'signup'
                  ? 'border-brand-500 text-brand-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up (Create Account)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {activeTab === 'login' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-base font-bold text-white">Welcome Back</h2>
                  <p className="text-xs text-slate-400">Enter your credentials to access the workclock portal</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@vertofi.com or employee@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500 rounded" />
                    <span>Remember me</span>
                  </label>
                  <span className="text-slate-500 text-[11px]">Protected Portal</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-xs shadow-xl shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <span>Login to WorkClock</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
                      className="text-brand-400 font-bold hover:underline"
                    >
                      Sign Up Here
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="text-center mb-1">
                  <h2 className="text-base font-bold text-white">Create New Account</h2>
                  <p className="text-xs text-slate-400">Sign up to get started with time & attendance tracking</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Confirm *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Account Role
                    </label>
                    <select
                      value={accountRole}
                      onChange={(e) => setAccountRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer font-bold text-amber-400"
                    >
                      <option value="ADMIN">Admin / Manager</option>
                      <option value="EMPLOYEE">Employee / Intern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={employeeType}
                      onChange={(e) => setEmployeeType(e.target.value as EmployeeType)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer font-bold text-brand-300"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP001"
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
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
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Engineer"
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-xs shadow-xl shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start</span>
                </button>

                <p className="text-center text-xs text-slate-400 pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                    className="text-brand-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
