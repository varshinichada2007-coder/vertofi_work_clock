import React from 'react';
import {
  Clock, LayoutDashboard, Calendar, Timer, Coffee, Activity,
  Users, UserCheck, BarChart3, Settings, User as UserIcon, LogOut,
  X, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';

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

  const isAdmin = role === 'ADMIN' || role === 'MANAGER';

  // Navigation Items defined cleanly per role
  const navItems = isAdmin
    ? [
        { label: 'Admin Dashboard', path: 'dashboard', icon: LayoutDashboard },
        { label: 'Team Attendance', path: 'team', icon: Users },
        { label: 'Employees & Interns', path: 'employees', icon: UserCheck },
        { label: 'Reports & Analytics', path: 'reports', icon: BarChart3 },
        { label: 'Admin Profile', path: 'profile', icon: UserIcon },
        { label: 'Settings', path: 'settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
        { label: 'My Attendance', path: 'attendance', icon: Calendar },
        { label: 'Work Sessions', path: 'sessions', icon: Timer },
        { label: 'Breaks', path: 'breaks', icon: Coffee },
        { label: 'My Activity', path: 'activity', icon: Activity },
        { label: 'My Profile', path: 'profile', icon: UserIcon },
        { label: 'Settings', path: 'settings', icon: Settings },
      ];

  // Status Indicator pill (For employees)
  const getStatusBadge = () => {
    switch (clockState.status) {
      case 'WORKING':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Working</span>;
      case 'ON_BREAK':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> On Break</span>;
      case 'CLOCKED_OUT':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Clocked Out</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Not Clocked In</span>;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none tracking-tight">
                Vertofi <span className="text-brand-400 font-extrabold">WorkClock</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">Time & Attendance</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info & Logout (NO switch account dropdowns) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user?.profileImage}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-brand-500/40"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <p className="text-xs text-slate-400 truncate">
                {user?.employeeId} • {user?.employeeType || (isAdmin ? 'Admin' : 'Employee')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Shield className="w-3.5 h-3.5" /> Administrator
              </span>
            ) : (
              getStatusBadge()
            )}

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
