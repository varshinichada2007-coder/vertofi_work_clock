import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkClockProvider } from './context/WorkClockContext';
import { Sidebar } from './components/common/Sidebar';
import { TopHeader } from './components/common/TopHeader';
import { ToastContainer } from './components/common/Toast';
import { ClockInModal } from './components/modals/ClockInModal';
import { StartBreakModal } from './components/modals/StartBreakModal';
import { ClockOutModal } from './components/modals/ClockOutModal';
import { EditTaskModal } from './components/modals/EditTaskModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MyAttendancePage } from './pages/MyAttendancePage';
import { WorkSessionsPage } from './pages/WorkSessionsPage';
import { BreakHistoryPage } from './pages/BreakHistoryPage';
import { ActivityPage } from './pages/ActivityPage';
import { TeamAttendancePage } from './pages/TeamAttendancePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const MainContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER';

  const getPageDetails = () => {
    switch (currentPath) {
      case 'dashboard':
        return {
          title: isAdmin ? 'Admin Dashboard Overview' : 'My Workday Dashboard',
          description: isAdmin ? "Real-time employee attendance summary & controls." : "Here's your live workday clock, timers, break allowance & activity."
        };
      case 'attendance':
        return { title: 'My Attendance Logs', description: 'View your clock-in, clock-out, break duration & attendance history.' };
      case 'sessions':
        return { title: 'Work Sessions', description: 'Detailed log of your focus sessions and productive work blocks.' };
      case 'breaks':
        return { title: 'Break History', description: 'Audit trail of meal breaks, tea breaks & personal rests.' };
      case 'activity':
        return { title: 'Activity & Task Tracker', description: 'Record and update what you are currently working on.' };
      case 'team':
        return { title: 'Team Attendance', description: 'Real-time employee & intern status, login times, break durations & tasks.' };
      case 'employees':
        return { title: 'Employees & Interns Directory', description: 'Manage employee records, joining dates, roles & profiles (+ Add Employee/Intern).' };
      case 'reports':
        return { title: 'Analytics & Reports', description: 'Executive charts, attendance rates, work hours & export options.' };
      case 'profile':
        return { title: isAdmin ? 'Admin Profile' : 'My Profile', description: 'View and update your profile details.' };
      case 'settings':
        return { title: 'Settings & Preferences', description: 'Configure break warnings, clock-in reminders & timezone options.' };
      default:
        return { title: 'Dashboard Overview', description: 'Workday overview' };
    }
  };

  const pageDetails = getPageDetails();

  const renderActivePage = () => {
    // Permission guard for employee trying to access admin pages
    if (!isAdmin && (currentPath === 'team' || currentPath === 'employees' || currentPath === 'reports')) {
      return <DashboardPage />;
    }

    switch (currentPath) {
      case 'dashboard':
        return <DashboardPage />;
      case 'attendance':
        return <MyAttendancePage />;
      case 'sessions':
        return <WorkSessionsPage />;
      case 'breaks':
        return <BreakHistoryPage />;
      case 'activity':
        return <ActivityPage />;
      case 'team':
        return <TeamAttendancePage />;
      case 'employees':
        return <EmployeesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
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
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkClockProvider>
        <MainContent />
      </WorkClockProvider>
    </AuthProvider>
  );
}
