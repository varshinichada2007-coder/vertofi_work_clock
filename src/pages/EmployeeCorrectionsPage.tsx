import React, { useState, useEffect } from 'react';
import {
  ClipboardList, PlusCircle, Calendar, CheckCircle2, XCircle, Clock,
  Send, AlertCircle, History, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { AttendanceCorrectionRequest } from '../types';

export const EmployeeCorrectionsPage: React.FC = () => {
  const { user, organization } = useAuth();
  const { addToast } = useWorkClock();
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [requestedClockIn, setRequestedClockIn] = useState('09:00:00 AM');
  const [requestedClockOut, setRequestedClockOut] = useState('05:30:00 PM');
  const [reason, setReason] = useState('');

  const fetchMyCorrections = async () => {
    if (!user) return;
    try {
      const data = await api.getCorrectionRequests(organization?.id, user.id);
      setRequests(data);
    } catch (e) {
      console.error('Error fetching employee corrections:', e);
    }
  };

  useEffect(() => {
    fetchMyCorrections();
  }, [user?.id, organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!date || !requestedClockIn || !requestedClockOut || !reason.trim()) {
      addToast('Incomplete Form', 'Please provide date, times, and reason.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitCorrectionRequest({
        userId: user.id,
        date,
        requestedClockIn,
        requestedClockOut,
        reason: reason.trim()
      });
      addToast('Correction Request Submitted', 'Sent to Admin for verification & audit.', 'success');
      setDate('');
      setReason('');
      await fetchMyCorrections();
    } catch (err: any) {
      addToast('Submission Failed', err.message || 'Unable to submit correction request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <ClipboardList className="w-4 h-4" />
          <span>Attendance Regularization</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Attendance Correction Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Forgot to clock in or out? Submit a correction request with the exact timestamps and reason. Upon approval, your attendance record will be regularized.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Request Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Submit Correction</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attendance Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Actual Clock In *
                </label>
                <input
                  type="text"
                  required
                  value={requestedClockIn}
                  onChange={(e) => setRequestedClockIn(e.target.value)}
                  placeholder="09:00:00 AM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Actual Clock Out *
                </label>
                <input
                  type="text"
                  required
                  value={requestedClockOut}
                  onChange={(e) => setRequestedClockOut(e.target.value)}
                  placeholder="05:30:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Reason / Explanation *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Network outage during morning login, client offsite meeting..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Verification</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: My Requests History */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-brand-600" />
            <span>My Regularization Requests</span>
          </h2>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                You have not submitted any attendance correction requests.
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-mono">{req.date}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-mono font-medium">
                      Requested: <span className="text-emerald-700">{req.requestedClockIn}</span> to <span className="text-emerald-700">{req.requestedClockOut}</span>
                    </div>

                    <p className="text-xs text-slate-500 italic">&ldquo;{req.reason}&rdquo;</p>

                    {req.adminRemarks && (
                      <div className="text-[11px] text-brand-700 font-medium mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Admin Note: {req.adminRemarks} (by {req.reviewedBy})</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 self-end sm:self-center">
                    Submitted: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
