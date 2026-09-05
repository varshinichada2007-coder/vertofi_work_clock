import React, { useState } from 'react';
import { Clock, Lock, Mail, ArrowRight, UserPlus, LogIn, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
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
          <p className="text-xs text-slate-400 font-medium">Work From Home Employee &amp; Intern Time &amp; Attendance System</p>
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
              /* ── SIGN IN FORM ── */
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
                    Don&apos;t have an account yet?{' '}
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
              /* ── SIGN UP — Admin-only creation notice ── */
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-brand-400" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-bold text-white">Account Created by Admin Only</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Employee accounts on Vertofi WorkClock are created exclusively by the{' '}
                    <strong className="text-brand-300">System Administrator</strong>.
                    Self-registration is disabled for security.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-left space-y-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">How to get access:</p>
                  <ol className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      Contact your Administrator to create your account.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      Admin uses <strong className="text-white">Employees &amp; Interns → Add Employee</strong> to create your account in the system.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      You receive your email and password, then sign in here.
                    </li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
