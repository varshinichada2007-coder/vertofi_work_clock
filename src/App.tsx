import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkClockProvider, useWorkClock } from './context/WorkClockContext';
import { Sidebar } from './components/common/Sidebar';
import { TopHeader } from './components/common/TopHeader';
import { ToastContainer } from './components/common/Toast';
import { ClockInModal } from './components/modals/ClockInModal';
import { StartBreakModal } from './components/modals/StartBreakModal';
import { ClockOutModal } from './components/modals/ClockOutModal';
import { EditTaskModal } from './components/modals/EditTaskModal';
import { AddEmployeeModal } from './components/modals/AddEmployeeModal';
import { InactivityWarningModal } from './components/modals/InactivityWarningModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AdminAttendancePage } from './pages/AdminAttendancePage';
import { AdminTimesheetsPage } from './pages/AdminTimesheetsPage';
import { AdminLeavePage } from './pages/AdminLeavePage';
import { AdminCorrectionsPage } from './pages/AdminCorrectionsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClockInOutPage } from './pages/ClockInOutPage';
import { MyAttendancePage } from './pages/MyAttendancePage';
import { MyTimesheetPage } from './pages/MyTimesheetPage';
import { EmployeeLeavePage } from './pages/EmployeeLeavePage';
import { EmployeeCorrectionsPage } from './pages/EmployeeCorrectionsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

const MainContent: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading Vertofi WorkClock SaaS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = role === 'ADMIN';

  const getPageDetails = () => {
    switch (currentPath) {
      case 'dashboard':
        return {
          title: isAdmin ? 'Admin Overview Dashboard' : 'My Workday Dashboard',
          description: isAdmin ? 'Real-time attendance summary, shift KPIs & active operations.' : "Here's your live workday clock, timers, break allowance & activity."
        };
      case 'employees':
        return { title: 'Employee & Intern Directory', description: 'Manage employee accounts, joining dates, roles & profiles.' };
      case 'attendance-admin':
        return { title: 'Attendance Ledger', description: 'Daily and historical attendance punches, status indicators, and late logs.' };
      case 'timesheets-admin':
        return { title: 'Month-Wise Timesheets', description: 'Aggregated monthly attendance summary, present days, work hours & overtime.' };
      case 'leave-admin':
        return { title: 'Leave Authorizations', description: 'Review, approve, or reject employee leave of absence requests.' };
      case 'corrections-admin':
        return { title: 'Attendance Regularization', description: 'Review and approve employee punch correction requests with audit logging.' };
      case 'reports':
        return { title: 'Reports & Analytics', description: 'Daily, monthly, and employee attendance reports with CSV/Excel/PDF export.' };
      case 'notifications':
        return { title: 'Notifications & Alerts', description: 'Live event stream of shift punches, leave requests, and administrative actions.' };
      case 'settings':
        return { title: 'Settings & Work Schedules', description: 'Configure weekly standard work hours, late grace threshold, and company settings.' };
      case 'audit-logs':
        return { title: 'System Audit Logs', description: 'Immutable security log of attendance corrections and administrative overrides.' };

      // Employee Routes
      case 'clock-hub':
        return { title: 'Clock In / Out Station', description: 'Interactive time clock station for shifts, breaks, and task updates.' };
      case 'attendance':
        return { title: 'My Attendance Logs', description: 'View your historical attendance punches, break times, and status flags.' };
      case 'my-timesheet':
        return { title: 'My Monthly Timesheet', description: 'Month-wise view of worked hours, break allocations, and overtime.' };
      case 'leave-employee':
        return { title: 'Request Leave', description: 'Apply for paid/unpaid leave of absence and track approval status.' };
      case 'corrections-employee':
        return { title: 'Attendance Regularization', description: 'Submit correction requests for missed or erroneous clock punches.' };
      case 'profile':
        return { title: isAdmin ? 'Admin Profile' : 'My Profile', description: 'View and update your personal and contact information.' };
      default:
        return { title: 'Dashboard', description: 'Workday Portal' };
    }
  };

  const pageDetails = getPageDetails();

  const renderActivePage = () => {
    // Admin RBAC Protection
    if (isAdmin) {
      switch (currentPath) {
        case 'dashboard':
          return <DashboardPage onNavigate={setCurrentPath} />;
        case 'employees':
          return <EmployeesPage />;
        case 'attendance-admin':
          return <AdminAttendancePage />;
        case 'timesheets-admin':
          return <AdminTimesheetsPage />;
        case 'leave-admin':
          return <AdminLeavePage />;
        case 'corrections-admin':
          return <AdminCorrectionsPage />;
        case 'reports':
          return <ReportsPage />;
        case 'notifications':
          return <NotificationsPage />;
        case 'settings':
          return <SettingsPage />;
        case 'audit-logs':
          return <AuditLogsPage />;
        case 'profile':
          return <ProfilePage onNavigate={setCurrentPath} />;
        default:
          return <DashboardPage onNavigate={setCurrentPath} />;
      }
    }

    // Employee RBAC Protection
    switch (currentPath) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPath} />;
      case 'clock-hub':
        return <ClockInOutPage />;
      case 'attendance':
        return <MyAttendancePage />;
      case 'my-timesheet':
        return <MyTimesheetPage />;
      case 'leave-employee':
        return <EmployeeLeavePage />;
      case 'corrections-employee':
        return <EmployeeCorrectionsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPath} />;
      default:
        return <DashboardPage onNavigate={setCurrentPath} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative">
      {/* Top Vertofi Signature Brand Gradient Stripe */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066FF] via-[#D99B16] to-[#E52320] z-50 pointer-events-none" />

      {/* Navigation Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopHeader
          title={pageDetails.title}
          description={pageDetails.description}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={setCurrentPath}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ClockInModal />
      <StartBreakModal />
      <ClockOutModal />
      <EditTaskModal />
      <AddEmployeeModal />
      <InactivityWarningModalWrapper />
      <ToastContainer />
    </div>
  );
};

const InactivityWarningModalWrapper: React.FC = () => {
  const {
    isInactivityModalOpen,
    inactivitySecondsLeft,
    maxWarningSeconds,
    resetInactivityTimer,
    clockOut,
    settings
  } = useWorkClock();

  return (
    <InactivityWarningModal
      isOpen={isInactivityModalOpen}
      secondsRemaining={inactivitySecondsLeft}
      maxWarningSeconds={maxWarningSeconds}
      onStayClockedIn={resetInactivityTimer}
      onClockOutNow={() => {
        resetInactivityTimer();
        clockOut('Manual Clock Out from Inactivity Prompt');
      }}
      reasonText={`No cursor movement or keyboard activity has been detected for ${settings.idleTimeoutMinutes || 5} minutes. You will be automatically clocked out unless you click or move your mouse.`}
    />
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Vertofi WorkClock caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Vertofi WorkClock</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'Application session recovery required.'}
            </p>
            <button
              onClick={() => {
                try { localStorage.clear(); } catch {}
                window.location.reload();
              }}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 font-bold text-xs text-white transition-all shadow-md"
            >
              Reset Session &amp; Start Clean
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkClockProvider>
          <MainContent />
        </WorkClockProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
