import React from 'react';
import {
  Clock, LayoutDashboard, Calendar, CalendarRange, Coffee,
  Users, BarChart3, Settings, User as UserIcon, LogOut,
  X, Shield, FileCheck, ClipboardList, History, Bell, Building2,
  Clock3, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';

import { VertofiLogo } from './VertofiLogo';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user, role, logout } = useAuth();
  const { clockState } = useWorkClock();

  const handleNavClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  const isAdmin = role === 'ADMIN';

  // Navigation Groups
  const adminSections = [
    {
      group: 'MAIN MENU',
      items: [
        { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
        { label: 'Employees Directory', path: 'employees', icon: Users },
      ]
    },
    {
      group: 'ATTENDANCE & TIME',
      items: [
        { label: 'Daily Attendance', path: 'attendance-admin', icon: Calendar },
        { label: 'Monthly Timesheets', path: 'timesheets-admin', icon: CalendarRange },
        { label: 'Leave Approvals', path: 'leave-admin', icon: FileCheck },
        { label: 'Punch Regularizations', path: 'corrections-admin', icon: ClipboardList },
      ]
    },
    {
      group: 'ORGANIZATION',
      items: [
        { label: 'Reports & Analytics', path: 'reports', icon: BarChart3 },
        { label: 'Work Schedules', path: 'settings', icon: Settings },
        { label: 'Audit Trail', path: 'audit-logs', icon: History },
        { label: 'Notifications', path: 'notifications', icon: Bell },
        { label: 'Admin Profile', path: 'profile', icon: UserIcon },
      ]
    }
  ];

  const employeeSections = [
    {
      group: 'WORKFLOW',
      items: [
        { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
        { label: 'Punch Clock Station', path: 'clock-hub', icon: Clock3 },
      ]
    },
    {
      group: 'MY ATTENDANCE',
      items: [
        { label: 'Daily Logs', path: 'attendance', icon: Calendar },
        { label: 'Monthly Timesheet', path: 'my-timesheet', icon: CalendarRange },
        { label: 'Time Off & Leave', path: 'leave-employee', icon: FileCheck },
        { label: 'Punch Corrections', path: 'corrections-employee', icon: ClipboardList },
      ]
    },
    {
      group: 'PREFERENCES',
      items: [
        { label: 'Notifications', path: 'notifications', icon: Bell },
        { label: 'My Profile', path: 'profile', icon: UserIcon }
      ]
    }
  ];

  const sections = isAdmin ? adminSections : employeeSections;

  const getStatusIndicator = () => {
    switch (clockState.status) {
      case 'WORKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            On Break
          </span>
        );
      case 'CLOCKED_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Clocked Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Off Clock
          </span>
        );
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-2xs">
              <VertofiLogo variant="mark" size={26} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 leading-tight flex items-center gap-1 tracking-tight">
                <span>VERTOFI</span>
              </div>
              <div className="text-[10px] text-brand-600 font-semibold tracking-wide uppercase">
                WorkClock Portal
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Pill Indicator */}
        <div className="px-3.5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Workspace</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
            isAdmin
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isAdmin ? 'Admin Portal' : 'Employee Portal'}
          </span>
        </div>

        {/* Navigation Item Groups */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4 custom-scrollbar">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {sec.group}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50/90 text-[#0066FF] font-bold shadow-2xs border-l-[3px] border-[#0066FF]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0066FF]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0 shadow-xs shadow-[#0066FF]/50" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
              {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name}</h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {user?.employeeId} • {user?.department}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <Shield className="w-3 h-3 text-brand-600" /> Admin Access
              </span>
            ) : (
              getStatusIndicator()
            )}

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
