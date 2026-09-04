import React, { useState } from 'react';
import { Menu, Bell, Calendar as CalendarIcon, Shield, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';

interface TopHeaderProps {
  title: string;
  description: string;
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  description,
  onOpenMobileSidebar
}) => {
  const { user } = useAuth();
  const { currentDateFormatted, clockState, settings } = useWorkClock();
  const [showNotifications, setShowNotifications] = useState(false);

  // Notifications summary
  const sampleNotifications = [
    {
      id: 'n1',
      title: 'Workday Status',
      message: clockState.status === 'WORKING' ? 'You are currently clocked in and working.' : 'Don\'t forget to clock in when starting work.',
      time: 'Just now',
      type: clockState.status === 'WORKING' ? 'success' : 'warning'
    },
    {
      id: 'n2',
      title: 'Break Reminder',
      message: `Break warning set to ${settings.maxBreakMinutes} mins max duration.`,
      time: '1 hour ago',
      type: 'info'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-4 flex items-center justify-between">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          aria-label="Open Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">{description}</p>
        </div>
      </div>

      {/* Right User & Dynamic Date Controls */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Dynamic Date */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-90 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-400" /> Notifications & Alerts
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {sampleNotifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex gap-3 items-start">
                    {n.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Header Badge */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
          <img
            src={user?.profileImage}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-brand-500/40"
          />
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white leading-none">{user?.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online Status"></span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">{user?.employeeId} • {user?.department}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
