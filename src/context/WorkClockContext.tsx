import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  EmployeeStatus, BreakType, TimelineEvent, ToastMessage, ReminderSettings
} from '../types';
import { storage, ActiveClockState } from '../services/storage';
import { api, MAX_DAILY_BREAK_SECONDS } from '../services/api';
import { supabaseDb } from '../services/supabaseDb';
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

  // Inactivity & Screen-Off Monitor State
  isInactivityModalOpen: boolean;
  inactivitySecondsLeft: number;
  maxWarningSeconds: number;
  resetInactivityTimer: () => void;
  isMonitoringActive: boolean;

  // Actions
  clockIn: (initialTask: string) => Promise<void>;
  resumeClockIn: () => Promise<void>;
  startBreak: (breakType: BreakType, notes?: string) => Promise<void>;
  endBreak: () => Promise<void>;
  clockOut: (notes?: string) => Promise<void>;
  updateTask: (taskName: string, status?: 'Working' | 'Completed' | 'Paused') => Promise<void>;
  syncNow: () => Promise<void>;
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
  const userId = user?.id || 'f45bd396-988c-4f4a-8c85-f203722a1d41';

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
      const stored = storage.getSettings();
      return {
        ...stored,
        autoClockOutOnIdle: false,
        autoClockOutOnScreenOff: false
      };
    } catch {
      return {
        clockInReminder: true,
        clockInTime: '18:00',
        clockOutReminder: true,
        clockOutTime: '01:00',
        breakDurationWarning: true,
        maxBreakMinutes: 60,
        activityCheckIn: false,
        activityIntervalMinutes: 120,
        use24HourClock: false,
        timezone: 'Asia/Kolkata',
        emailNotifications: true,
        autoClockOutOnIdle: false,
        idleTimeoutMinutes: 60,
        autoClockOutOnScreenOff: false,
        screenOffGraceSeconds: 300,
        idleWarningSeconds: 60
      };
    }
  });

  // Modals state
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isStartBreakModalOpen, setIsStartBreakModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  // Inactivity & Screen-Off Live Monitoring
  const [isInactivityModalOpen, setIsInactivityModalOpen] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number>(settings.idleWarningSeconds || 60);
  const lastActivityRef = React.useRef<number>(Date.now());
  const autoClockOutTriggeredRef = React.useRef<boolean>(false);

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    autoClockOutTriggeredRef.current = false;
    setIsInactivityModalOpen(false);
  }, []);

  // Sync clock state from cloud database when active user changes, periodically, or on live Realtime push
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const syncUserClockState = async () => {
      try {
        const { activeClockState } = await api.getTodayAttendance(user.id);
        if (isMounted && activeClockState) {
          setClockState(activeClockState);
          setTimelineEvents(storage.getTimelineEvents(user.id));
        }
      } catch (e) {
        if (isMounted) {
          setClockState(storage.getActiveClockState(user.id));
          setTimelineEvents(storage.getTimelineEvents(user.id));
        }
      }
    };

    syncUserClockState();
    const interval = setInterval(syncUserClockState, 3000);

    // Supabase Realtime subscriptions: cross-laptop changes sync instantly
    const subAttendance = supabaseDb.subscribeToTableChanges('attendance_records', () => {
      syncUserClockState();
    });
    const subBreaks = supabaseDb.subscribeToTableChanges('break_records', () => {
      syncUserClockState();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      subAttendance?.unsubscribe?.();
      subBreaks?.unsubscribe?.();
    };
  }, [user?.id]);

  // Master Activity Tracker: Keeps session alive on user interaction
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      autoClockOutTriggeredRef.current = false;
    };

    const events = ['mousemove', 'mousedown', 'click', 'keydown', 'touchstart', 'touchmove', 'scroll', 'wheel', 'pointermove', 'focus'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Screen lock / wake-up listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const idleMs = Date.now() - lastActivityRef.current;
        const idleSec = Math.floor(idleMs / 1000);
        const timeoutSec = Math.max(300, (settings.idleTimeoutMinutes || 10) * 60);

        if (clockState.status === 'WORKING' && settings.autoClockOutOnIdle !== false && idleSec >= timeoutSec && !autoClockOutTriggeredRef.current) {
          autoClockOutTriggeredRef.current = true;
          api.clockOut(userId, `Auto Clocked Out: Extended inactivity / screen locked (${settings.idleTimeoutMinutes || 10} mins)`)
            .then(res => {
              setClockState(res.state);
              setTimelineEvents(storage.getTimelineEvents(userId));
              addToast(
                'Auto Clocked Out (Inactivity / Screen Lock)',
                `You were automatically clocked out due to inactivity for ${settings.idleTimeoutMinutes || 10} minutes.`,
                'warning'
              );
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clockState.status, settings.autoClockOutOnIdle, settings.idleTimeoutMinutes, userId]);

  // Master 1-second interval timer
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);

      // Inactivity & Screen Lock Detection (Configured for 10 minutes)
      if (clockState.status === 'WORKING' && settings.autoClockOutOnIdle !== false) {
        const idleMs = Date.now() - lastActivityRef.current;
        const idleSec = Math.floor(idleMs / 1000);
        const timeoutSec = Math.max(300, (settings.idleTimeoutMinutes || 10) * 60); // 10 mins = 600s
        const warningSec = settings.idleWarningSeconds || 60; // 60s warning countdown
        const warningStartSec = Math.max(10, timeoutSec - warningSec);

        if (idleSec >= warningStartSec && idleSec < timeoutSec) {
          setIsInactivityModalOpen(true);
          setInactivitySecondsLeft(timeoutSec - idleSec);
        } else if (idleSec >= timeoutSec && !autoClockOutTriggeredRef.current) {
          autoClockOutTriggeredRef.current = true;
          setIsInactivityModalOpen(false);

          api.clockOut(userId, `Auto Clocked Out: Extended inactivity / screen locked (${settings.idleTimeoutMinutes || 10} mins)`)
            .then(res => {
              setClockState(res.state);
              setTimelineEvents(storage.getTimelineEvents(userId));
              addToast(
                'Auto Clocked Out (Inactivity / Screen Lock)',
                `You were automatically clocked out due to inactivity for ${settings.idleTimeoutMinutes || 10} minutes.`,
                'warning'
              );
            })
            .catch(err => {
              console.warn('Inactivity auto clock out error:', err);
            });
        }
      } else {
        if (isInactivityModalOpen) {
          setIsInactivityModalOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [clockState.status, settings.autoClockOutOnIdle, settings.idleTimeoutMinutes, settings.idleWarningSeconds, userId, isInactivityModalOpen]);

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

  // Calculate live work duration (capped at 10 hours)
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
    const netSec = Math.max(0, totalElapsedSec - totalBreakSec);
    return Math.min(10 * 3600, netSec);
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
      lastActivityRef.current = Date.now();
      autoClockOutTriggeredRef.current = false;
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

  const resumeClockIn = async () => {
    try {
      lastActivityRef.current = Date.now();
      autoClockOutTriggeredRef.current = false;
      const res = await api.resumeClockIn(userId);
      setClockState(res.state);
      setTimelineEvents(storage.getTimelineEvents(userId));
      addToast('Shift Resumed', res.message, 'success');
    } catch (err: any) {
      addToast('Resume Failed', err.message || 'Unable to resume shift.', 'error');
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

  const syncNow = async () => {
    if (!user?.id) return;
    try {
      const [remoteAttendance, remoteBreaks] = await Promise.all([
        supabaseDb.getAttendanceRecords(),
        supabaseDb.getBreakRecords()
      ]);
      if (remoteAttendance) storage.setAttendanceRecords(remoteAttendance);
      if (remoteBreaks) storage.setBreakRecords(remoteBreaks);

      const { activeClockState } = await api.getTodayAttendance(user.id);
      if (activeClockState) {
        setClockState(activeClockState);
        setTimelineEvents(storage.getTimelineEvents(user.id));
      }
      addToast('Data Synchronized', 'Latest cloud attendance and shift status updated.', 'success');
    } catch (e) {
      const state = storage.getActiveClockState(user.id);
      setClockState(state);
      addToast('Sync Refreshed', 'Shift state updated.', 'info');
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
        resumeClockIn,
        startBreak,
        endBreak,
        clockOut,
        updateTask,
        syncNow,
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
        isInactivityModalOpen,
        inactivitySecondsLeft,
        maxWarningSeconds: settings.idleWarningSeconds || 30,
        resetInactivityTimer,
        isMonitoringActive: clockState.status === 'WORKING' && settings.autoClockOutOnIdle !== false,
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
