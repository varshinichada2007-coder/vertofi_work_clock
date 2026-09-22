import React, { useState, useEffect } from 'react';
import {
  FileCheck, CheckCircle2, XCircle, Clock, Search, Filter,
  Calendar, User, AlertCircle, Building2, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { LeaveRequest } from '../types';

export const AdminLeavePage: React.FC = () => {
  const { organization } = useAuth();
  const { addToast } = useWorkClock();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLeaves = async () => {
    try {
      const data = await api.getLeaveRequests(organization?.id);
      setRequests(data);
    } catch (e) {
      console.error('Error fetching leave requests:', e);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [organization?.id]);

  const handleReviewClick = (req: LeaveRequest, type: 'Approved' | 'Rejected') => {
    setActiveRequest(req);
    setActionType(type);
    setRemarks(type === 'Approved' ? 'Approved by People Ops & Workday Manager.' : 'Rejected due to project deadlines.');
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    try {
      await api.reviewLeaveRequest(activeRequest.id, actionType, remarks);
      addToast(
        `Leave Request ${actionType}`,
        `Successfully ${actionType.toLowerCase()} ${activeRequest.userName}'s leave request.`,
        actionType === 'Approved' ? 'success' : 'info'
      );
      setReviewModalOpen(false);
      await fetchLeaves();
    } catch (err: any) {
      addToast('Review Failed', err.message || 'Unable to update request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchSearch = r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leaveType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>{organization?.name} • Time Off Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Employee Leave Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject employee leave applications. Approved leaves automatically propagate to attendance logs as LEAVE.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name, ID or leave type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
            No leave requests found in this category.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{req.userName}</h3>
                    <span className="text-[10px] font-mono text-slate-500">({req.employeeId})</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                      {req.leaveType}
                    </span>
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

                  <div className="text-xs text-slate-600 mt-1">
                    <strong className="text-slate-900">{req.startDate}</strong> to <strong className="text-slate-900">{req.endDate}</strong> ({req.daysCount} day{req.daysCount > 1 ? 's' : ''})
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    &ldquo;{req.reason}&rdquo;
                  </p>

                  {req.adminRemarks && (
                    <div className="text-[11px] text-brand-700 mt-2 flex items-center gap-1.5 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                      <span>Admin note: {req.adminRemarks} (by {req.reviewedBy})</span>
                    </div>
                  )}
                </div>
              </div>

              {req.status === 'Pending' && (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleReviewClick(req, 'Approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleReviewClick(req, 'Rejected')}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation & Remarks Modal */}
      {reviewModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {actionType === 'Approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              <span>{actionType} Leave Request</span>
            </h3>

            <p className="text-xs text-slate-600">
              {actionType === 'Approved'
                ? `Approving ${activeRequest.userName}'s leave from ${activeRequest.startDate} to ${activeRequest.endDate}. This will automatically record ${activeRequest.daysCount} day(s) as LEAVE in their attendance.`
                : `Rejecting ${activeRequest.userName}'s leave request.`}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Remarks / Note
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or instructions..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                  actionType === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

