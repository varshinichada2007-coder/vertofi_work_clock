import React, { useState } from 'react';
import {
  Clock, Lock, Mail, ArrowRight, Shield, Building2,
  CheckCircle2, AlertCircle, RefreshCw, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { VertofiLogo } from '../components/common/VertofiLogo';

import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, organization } = useAuth();
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State - Clean initial state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email and password.');
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
        setSuccessMsg('New password activated. Click "Sign In to Account" to proceed.');
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-amber-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#0066FF] selection:text-white overflow-hidden">
      {/* Visible Ambient Vertofi Brand Color Auras */}
      <div className="absolute top-[-10%] left-[15%] w-[450px] h-[450px] bg-[#0066FF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[25%] right-[10%] w-[380px] h-[380px] bg-[#D99B16]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-[#E52320]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Accent Ribbon */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0066FF] via-[#D99B16] to-[#E52320] z-50" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Official Company Logo */}
        <div className="flex justify-center mb-3">
          <VertofiLogo variant="mark" size={76} />
        </div>
        
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Sign in to <span className="text-[#0066FF]">Vertofi</span> WorkClock
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Enterprise workforce time tracking &amp; attendance management portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        {/* Workspace Bar */}
        <div className="mb-4 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-xs">
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
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employee@vertofi.com or admin"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
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
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Policy & Security Notice */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <Shield className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Authorized Access Only:</strong> Employee and Intern accounts are provisioned exclusively through the Admin portal. Unauthorized self-registration is strictly disabled.
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
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600"
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

