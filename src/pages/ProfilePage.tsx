import React, { useState } from 'react';
import {
  User as UserIcon, Save, CheckCircle2, AlertCircle, Loader2,
  ArrowLeft, Building2, ShieldCheck, Mail, Phone, MapPin, Briefcase,
  Calendar, Check, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onNavigate?: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, organization, role, updateProfile } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.workLocation || '');
  const [designation, setDesignation] = useState(user?.designation || '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reflect live name in the banner while the user types
  const displayName = name.trim() || user?.name || '';
  const displayDesignation = designation.trim() || user?.designation || '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateProfile({
        name: trimmedName,
        phone: phone.trim(),
        workLocation: location.trim(),
        designation: designation.trim()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        {onNavigate && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Building2 className="w-3.5 h-3.5 text-brand-600" />
          <span>{organization?.name || 'Vertofi'}</span>
        </div>
      </div>

      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-2xl shadow-xs">
            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Active Account" />
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{displayName}</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-mono">
              {user?.employeeId}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isAdmin
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isAdmin ? '🛡 Super Admin' : `👤 ${user?.employeeType || 'Employee'}`}
            </span>
          </div>

          <p className="text-sm font-semibold text-brand-600 mt-1">
            {displayDesignation || (isAdmin ? 'Operations Head' : 'Staff')} • <span className="text-slate-500">{user?.department || 'Operations'}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {phone.trim() || user?.phone || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-brand-600" />
            {isAdmin ? 'Administrator Profile Settings' : 'Employee Profile Details'}
          </h3>
          <span className="text-xs text-slate-400 font-medium">Fields with lock are verified</span>
        </div>

        {/* Success Banner */}
        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Profile saved successfully! Your changes are synchronized everywhere.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors font-medium"
            />
          </div>

          {/* Employee ID — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Employee / Admin ID</label>
            <input
              type="text"
              disabled
              value={user?.employeeId || ''}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed font-mono"
            />
          </div>

          {/* Email Address — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
            />
          </div>

          {/* Phone Number — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Designation — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Designation / Role Title</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer, Operations Lead"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Department — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Department</label>
            <input
              type="text"
              disabled
              value={user?.department || 'Operations'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
            />
          </div>

          {/* Work Location — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Work Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Work From Home / Headquarters Office"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Organization / Manager info */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              {isAdmin ? 'Organization Entity' : 'Reporting Manager'}
            </label>
            <input
              type="text"
              disabled
              value={isAdmin ? (organization?.name || 'Vertofi') : (user?.managerName || 'Goutham Badiga (Admin)')}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Last profile sync: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
