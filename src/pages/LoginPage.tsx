import React, { useState } from 'react';
import {
  Clock, Lock, Mail, ArrowRight, Shield, Building2,
  CheckCircle2, AlertCircle, RefreshCw, KeyRound, UserCheck, ShieldAlert,
  Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VertofiLogo } from '../components/common/VertofiLogo';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTabChange = (tab: 'employee' | 'admin') => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your work email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (activeTab === 'admin') {
      const normalizedSecret = secretCode.trim().toLowerCase().replace(/[\s-_]+/g, '');
      if (!normalizedSecret) {
        setErrorMsg('Admin Secret Code is required to access the Admin Portal.');
        return;
      }
      const validAdminSecrets = ['goutham01', 'goutham1', 'goutham', 'admin', 'gouthambadiga01'];
      if (!validAdminSecrets.includes(normalizedSecret)) {
        setErrorMsg('Invalid Admin Secret Code. Access to Admin Portal is restricted.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password, activeTab === 'admin' ? secretCode.trim() : undefined);
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials. Please verify your email and password.';
      if (activeTab === 'employee' && (msg.toLowerCase().includes('admin secret code') || trimmedEmail.toLowerCase().includes('gouthambadiga'))) {
        setErrorMsg('Admin account detected. Please click the "Admin Portal" tab and enter the Admin Secret Code.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = resetEmail.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your registered work email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const verified = await api.verifyEmailForReset(trimmed);
      setSuccessMsg(`Account verified for ${verified.name}. You can now set your new password.`);
      setTimeout(() => {
        setView('reset');
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'No registered account found with this email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.resetPassword(resetEmail, newPassword);
      setSuccessMsg(res.message);
      
      // Auto-populate login form and transition
      setEmail(resetEmail);
      setPassword(newPassword);

      setTimeout(() => {
        setView('login');
        setSuccessMsg('New password activated. Click "Sign In" to proceed.');
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-amber-50/40 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative selection:bg-[#0066FF] selection:text-white overflow-hidden">
      {/* Ambient Vertofi Brand Color Auras */}
      <div className="absolute top-[-10%] left-[15%] w-[450px] h-[450px] bg-[#0066FF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[25%] right-[10%] w-[380px] h-[380px] bg-[#D99B16]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-[#E52320]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Accent Ribbon */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0066FF] via-[#D99B16] to-[#E52320] z-50" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Official Company Logo */}
        <div className="flex justify-center mb-3">
          <VertofiLogo variant="mark" size={72} />
        </div>
        
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Sign in to <span className="text-[#0066FF]">Vertofi</span> WorkClock
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Enterprise workforce time tracking &amp; attendance management portal
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        {/* Workspace Bar */}
        <div className="mb-3.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span className="text-slate-400">Workspace:</span>
            <span className="font-bold text-slate-900 truncate">Vertofi</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
            Official Portal
          </span>
        </div>

        {/* Main Card with Branded Header Bar */}
        <div className="bg-white/95 backdrop-blur-md py-6 px-6 sm:px-8 border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 space-y-4 relative overflow-hidden">
          {/* Top Brand Color Spectrum Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066FF] via-[#D99B16] to-[#E52320]" />

          {/* Portal Switcher Tabs */}
          {view === 'login' && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTabChange('employee')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'employee'
                    ? 'bg-white text-[#0066FF] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Employee Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-rose-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin Portal</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {activeTab === 'admin' && (
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-[11px] font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Admin Security:</strong> Requires Master Secret Code for authorization.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'admin' ? 'Administrator Email' : 'Work Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'gouthambadiga01@gmail.com' : 'e.g. employee@vertofi.com'}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    className="text-xs text-[#0066FF] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secret Code Input ONLY for Admin Portal */}
              {activeTab === 'admin' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                      <span>Admin Secret Code</span>
                      <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Required</span>
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-rose-400 absolute left-3 top-2.5" />
                    <input
                      type={showSecretCode ? 'text' : 'password'}
                      required
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="Enter Admin Secret Code (e.g. Goutham01)"
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-rose-50/40 border border-rose-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretCode(!showSecretCode)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-lg text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : 'bg-[#0066FF] hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {activeTab === 'admin' ? 'Verify Secret Code & Sign In' : 'Sign In to Employee Portal'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Policy & Security Notice */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <Shield className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                <span>
                  {activeTab === 'admin' ? (
                    <><strong>Restricted Area:</strong> This portal is exclusively for System Administrators. Requires master secret code.</>
                  ) : (
                    <><strong>Employee Portal:</strong> Clock in/out, view shift breaks, and check live attendance across all devices.</>
                  )}
                </span>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter your registered work email</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify Email &amp; Continue</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Back to sign in
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">Set New Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Choose a secure password for {resetEmail}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save &amp; Sign In</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
