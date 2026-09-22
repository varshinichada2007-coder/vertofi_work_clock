import React, { useState } from 'react';
import { Menu, Bell, Calendar as CalendarIcon, Shield, CheckCircle2, AlertTriangle, X, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';

interface TopHeaderProps {
  title: string;
  description: string;
  onOpenMobileSidebar: () => void;
  onNavigate?: (path: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  description,
  onOpenMobileSidebar,
  onNavigate
}) => {
  const { user } = useAuth();
  const { currentDateFormatted, currentTimeFormatted, clockState, settings } = useWorkClock();
  const [showNotifications, setShowNotifications] = useState(false);

  const sampleNotifications = [
    {
      id: 'n1',
      title: 'Shift Status',
      message: clockState.status === 'WORKING' ? 'You are actively clocked in.' : 'Shift inactive.',
      time: 'Live',
      type: clockState.status === 'WORKING' ? 'success' : 'warning'
    },
    {
      id: 'n2',
      title: 'Break Policy',
      message: `Daily break allowance is ${settings.maxBreakMinutes} minutes.`,
      time: 'Today',
      type: 'info'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 lg:px-6 h-14 flex items-center justify-between">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">WorkClock</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Right Controls: Live Time & Date, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Active Inactivity & Screen Monitor Indicator */}
        {clockState.status === 'WORKING' && settings.autoClockOutOnIdle && (
          <div
            title={`Active Monitoring: Inactivity Auto Clock-Out (${settings.idleTimeoutMinutes || 5}m) & Screen-Off Protection enabled`}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 font-semibold shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">Activity &amp; Display Monitored ({settings.idleTimeoutMinutes || 5}m)</span>
          </div>
        )}

        {/* Live Timer Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-mono text-slate-900 font-bold tabular-nums">{currentTimeFormatted}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{currentDateFormatted}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-xs text-slate-900">Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {sampleNotifications.map(n => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Profile Navigation */}
        <button
          onClick={() => onNavigate?.('profile')}
          title="View & Edit Profile"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 py-1 px-1.5 rounded-lg transition-colors cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-[11px] group-hover:bg-brand-600 group-hover:text-white transition-colors">
            {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {user?.role === 'ADMIN' ? 'Admin' : user?.designation || 'Staff'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
