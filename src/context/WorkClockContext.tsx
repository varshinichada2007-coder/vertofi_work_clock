import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  EmployeeStatus, BreakType, TimelineEvent, ToastMessage, ReminderSettings
} from '../types';
import { storage, ActiveClockState } from '../services/storage';
import { api, MAX_DAILY_BREAK_SECONDS } from '../services/api';
import { useAuth } from './AuthContext';

interface WorkClockContextType {
  currentTimeFormatted: string;
  currentDateFormatted: string;
  clockState: ActiveClockState;
  workSeconds: number;
  breakSeconds: number;
  breakUsedSeconds: number;
  breakRemainingSeconds: number;
  timelineEvents: TimelineEvent[];
  toasts: ToastMessage[];

  // Actions
  clockIn: (initialTask: string) => Promise<void>;
  startBreak: (breakType: BreakType, notes?: string) => Promise<void>;
  endBreak: () => Promise<void>;
  clockOut: (notes?: string) => Promise<void>;
  updateTask: (taskName: string, status?: 'Working' | 'Completed' | 'Paused') => Promise<void>;
  dismissToast: (id: string) => void;
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;

  // Modal Visibilities
  isClockInModalOpen: boolean;
  setIsClockInModalOpen: (open: boolean) => void;
  isStartBreakModalOpen: boolean;
  setIsStartBreakModalOpen: (open: boolean) => void;
  isClockOutModalOpen: boolean;
  setIsClockOutModalOpen: (open: boolean) => void;
  isEditTaskModalOpen: boolean;
  setIsEditTaskModalOpen: (open: boolean) => void;
  isAddEmployeeModalOpen: boolean;
  setIsAddEmployeeModalOpen: (open: boolean) => void;

  // Settings
  settings: ReminderSettings;
  updateSettings: (newSettings: ReminderSettings) => void;
}

const WorkClockContext = createContext<WorkClockContextType | undefined>(undefined);

export const WorkClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_admin';

  const [now, setNow] = useState<Date>(new Date());
  const [clockState, setClockState] = useState<ActiveClockState>(() => {
    try {
      return storage.getActiveClockState(userId);
    } catch {
      return {
        status: 'NOT_CLOCKED_IN',
        clockInTimestamp: null,
        clockOutTimestamp: null,
        accumulatedBreakSeconds: 0,
        currentBreakStartTimestamp: null,
        currentBreakType: null,
        currentActivity: 'No active task',
        initialTask: 'No active task',
        attendanceId: null,
        todayDateStr: new Date().toISOString().split('T')[0]
      };
    }
  });

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => {
    try {
      return storage.getTimelineEvents(userId);
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    try {
      return storage.getSettings();
    } catch {
      return {
        clockInReminder: true,
        clockInTime: '09:00',
        clockOutReminder: true,
        clockOutTime: '18:00',
        breakDurationWarning: true,
        maxBreakMinutes: 60,
        activityCheckIn: true,
        activityIntervalMinutes: 120,
        use24HourClock: false,
        timezone: 'Asia/Kolkata',
        emailNotifications: true
      };
    }
  });

  // Modals state
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isStartBreakModalOpen, setIsStartBreakModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  // Sync clock state when active user changes
  useEffect(() => {
    if (user?.id) {
      setClockState(storage.getActiveClockState(user.id));
      setTimelineEvents(storage.getTimelineEvents(user.id));
    }
  }, [user?.id]);

  // Master 1-second interval timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current live time (Exact seconds)
  const currentTimeFormatted = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !settings.use24HourClock
  });

  // Format current date
  const currentDateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate live work duration
  const calculateWorkSeconds = (): number => {
    if (clockState.status === 'NOT_CLOCKED_IN' || !clockState.clockInTimestamp) {
      return 0;
    }

    const currentMs = clockState.clockOutTimestamp || now.getTime();
    const clockInMs = clockState.clockInTimestamp;
    const totalElapsedSec = Math.floor((currentMs - clockInMs) / 1000);

    let activeBreakSec = 0;
    if (clockState.status === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
      activeBreakSec = Math.floor((now.getTime() - clockState.currentBreakStartTimestamp) / 1000);
    }

    const totalBreakSec = clockState.accumulatedBreakSeconds + activeBreakSec;
    return Math.max(0, totalElapsedSec - totalBreakSec);
  };

  // Calculate live break duration
  const calculateBreakSeconds = (): number => {
    if (clockState.status === 'ON_BREAK' && clockState.currentBreakStartTimestamp) {
      return Math.floor((now.getTime() - clockState.currentBreakStartTimestamp) / 1000);
    }
    return 0;
  };

  const workSeconds = calculateWorkSeconds();
  const breakSeconds = calculateBreakSeconds();

  const breakUsedSeconds = clockState.accumulatedBreakSeconds + breakSeconds;
  const breakRemainingSeconds = Math.max(0, MAX_DAILY_BREAK_SECONDS - breakUsedSeconds);

  // Toast System
  const addToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random()}`,
      title,
      message,
      type,
      timestamp: Date.now()
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clock Actions
  const clockIn = async (initialTask: string) => {
    try {
      const res = await api.clockIn(userId, initialTask);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Clocked In', res.message, 'success');
      setIsClockInModalOpen(false);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      addToast('Clock In Failed', err.message || 'Unable to clock in.', 'error');
    }
  };

  const startBreak = async (breakType: BreakType, notes?: string) => {
    try {
      const res = await api.startBreak(userId, breakType, notes);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Break Started', res.message, 'info');
      setIsStartBreakModalOpen(false);
    } catch (err: any) {
      addToast('Break Limit Reached', err.message || 'Unable to start break.', 'error');
    }
  };

  const endBreak = async () => {
    try {
      const res = await api.endBreak(userId);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Welcome Back', res.message, 'success');
    } catch (err: any) {
      addToast('Break Error', err.message || 'Unable to end break.', 'error');
    }
  };

  const clockOut = async (endNotes?: string) => {
    try {
      const res = await api.clockOut(userId, endNotes);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Workday Ended', res.message, 'success');
      setIsClockOutModalOpen(false);
    } catch (err: any) {
      addToast('Clock Out Failed', err.message || 'Unable to clock out.', 'error');
    }
  };

  const updateTask = async (taskName: string, status: 'Working' | 'Completed' | 'Paused' = 'Working') => {
    try {
      const res = await api.updateActivity(userId, taskName, status);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Activity Updated', `Current activity: "${taskName}"`, 'success');
      setIsEditTaskModalOpen(false);
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Unable to update activity.', 'error');
    }
  };

  const updateSettings = (newSettings: ReminderSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    addToast('Settings Saved', 'Your workclock preferences have been updated.', 'success');
  };

  return (
    <WorkClockContext.Provider
      value={{
        currentTimeFormatted,
        currentDateFormatted,
        clockState,
        workSeconds,
        breakSeconds,
        breakUsedSeconds,
        breakRemainingSeconds,
        timelineEvents,
        toasts,
        clockIn,
        startBreak,
        endBreak,
        clockOut,
        updateTask,
        dismissToast,
        addToast,
        isClockInModalOpen,
        setIsClockInModalOpen,
        isStartBreakModalOpen,
        setIsStartBreakModalOpen,
        isClockOutModalOpen,
        setIsClockOutModalOpen,
        isEditTaskModalOpen,
        setIsEditTaskModalOpen,
        isAddEmployeeModalOpen,
        setIsAddEmployeeModalOpen,
        settings,
        updateSettings
      }}
    >
      {children}
    </WorkClockContext.Provider>
  );
};

export const useWorkClock = () => {
  const context = useContext(WorkClockContext);
  if (!context) {
    throw new Error('useWorkClock must be used within a WorkClockProvider');
  }
  return context;
};
