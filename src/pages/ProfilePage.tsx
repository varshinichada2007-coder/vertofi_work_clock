import React, { useState } from 'react';
import { User as UserIcon, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.workLocation || '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reflect live changes in the banner while the user types
  const displayName = name.trim() || user?.name || '';

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
        workLocation: location.trim()
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
      {/* Profile Header Banner — updates live as user types */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0c8ee9,0270c7`}
          alt={displayName}
          className="w-24 h-24 rounded-full object-cover border-4 border-brand-500/50 shadow-2xl shrink-0"
        />
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{displayName}</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {user?.employeeId}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-400 mt-1">{user?.designation} • {user?.department}</p>
          <p className="text-xs text-slate-400 mt-1">
            {phone.trim() || user?.phone || '—'}
          </p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl glass-card space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-brand-400" /> Employee Profile Details
        </h3>

        {/* Success Banner */}
        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Profile saved successfully! Your name and phone number are now updated everywhere.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Employee ID — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Employee ID</label>
            <input
              type="text"
              disabled
              value={user?.employeeId || ''}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          {/* Phone Number — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Department — read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Department</label>
            <input
              type="text"
              disabled
              value={user?.department || ''}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          {/* Work Location — editable */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Work Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Work From Home / Headquarters"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
