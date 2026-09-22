import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, Info, XCircle, Check,
  Sparkles, Trash2, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const { user, role, organization } = useAuth();
  const { addToast } = useWorkClock();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(organization?.id, role, user?.id);
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id, role, organization?.id]);

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await api.markAllNotificationsRead(organization?.id);
    addToast('All Read', 'All notifications marked as read.', 'success');
    await fetchNotifications();
  };

  const filtered = notifications.filter(n => filter === 'ALL' || !n.isRead);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Alerts &amp; Activity Notifications</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time alerts for shift transactions, break warnings, leave approvals, and missing punches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAllAsRead()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'UNREAD'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Notification Items */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
            No notifications in this folder.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                n.isRead
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : 'bg-white border-brand-200 shadow-md shadow-brand-500/5'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                {n.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : n.type === 'error' ? (
                  <XCircle className="w-5 h-5 text-rose-600" />
                ) : (
                  <Info className="w-5 h-5 text-brand-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 mt-2 shrink-0 animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
