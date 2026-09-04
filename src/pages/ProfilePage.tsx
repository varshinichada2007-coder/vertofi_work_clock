import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Building, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [location, setLocation] = useState(user?.workLocation || 'Work From Home');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updated = {
      ...user,
      name,
      phone,
      workLocation: location
    };
    storage.updateUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Profile Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl glass-panel relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user?.profileImage}
          alt={user?.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-brand-500/50 shadow-2xl shrink-0"
        />
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{user?.name}</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {user?.employeeId}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-400 mt-1">{user?.designation} • {user?.department}</p>
          <p className="text-xs text-slate-400 mt-1">Reports to: <strong className="text-white">{user?.managerName || 'Sarah Jenkins'}</strong></p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl glass-card space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-brand-400" /> Employee Profile Details
        </h3>

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            Profile information saved successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Employee ID</label>
            <input
              type="text"
              disabled
              value={user?.employeeId}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Department</label>
            <input
              type="text"
              disabled
              value={user?.department}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Work Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
