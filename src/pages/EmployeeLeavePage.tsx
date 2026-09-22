import React, { useState, useEffect } from 'react';
import {
  FileCheck, PlusCircle, Calendar, CheckCircle2, XCircle, Clock,
  Send, AlertCircle, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { LeaveRequest, LeaveType } from '../types';

export const EmployeeLeavePage: React.FC = () => {
  const { user, organization } = useAuth();
  const { addToast } = useWorkClock();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchMyLeaves = async () => {
    if (!user) return;
    try {
      const data = await api.getLeaveRequests(organization?.id, user.id);
      setRequests(data);
    } catch (e) {
      console.error('Error fetching employee leaves:', e);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, [user?.id, organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!startDate || !endDate || !reason.trim()) {
      addToast('Incomplete Form', 'Please fill in all dates and the reason.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitLeaveRequest({
        userId: user.id,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      });
      addToast('Leave Request Submitted', 'Your manager has been notified.', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
      await fetchMyLeaves();
    } catch (err: any) {
      addToast('Submission Failed', err.message || 'Unable to submit request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <FileCheck className="w-4 h-4" />
          <span>My Time Off &amp; Leave Portal</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Request Leave of Absence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Apply for casual, sick, or annual leave. Approved leaves automatically reflect as LEAVE in your timesheet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Application Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>New Leave Application</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Annual Vacation">Annual Vacation</option>
                <option value="Maternity/Paternity">Maternity/Paternity</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason &amp; Handover Notes *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief justification for leave..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit Leave Request</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: My Leave Requests History */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>My Application History</span>
          </h2>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                You have not submitted any leave requests yet.
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.leaveType}</span>
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

                    <div className="text-xs text-slate-700 font-medium mt-1">
                      {req.startDate} to {req.endDate} ({req.daysCount} day{req.daysCount > 1 ? 's' : ''})
                    </div>

                    <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{req.reason}&rdquo;</p>

                    {req.adminRemarks && (
                      <div className="text-[11px] text-brand-700 font-medium mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Remarks: {req.adminRemarks} (by {req.reviewedBy})</span>
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
