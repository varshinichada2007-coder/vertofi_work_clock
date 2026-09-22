import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Search,
  Calendar, User, AlertCircle, Building2, History, MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkClock } from '../context/WorkClockContext';
import { api } from '../services/api';
import { AttendanceCorrectionRequest } from '../types';

export const AdminCorrectionsPage: React.FC = () => {
  const { organization } = useAuth();
  const { addToast } = useWorkClock();
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<AttendanceCorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCorrections = async () => {
    try {
      const data = await api.getCorrectionRequests(organization?.id);
      setRequests(data);
    } catch (e) {
      console.error('Error fetching correction requests:', e);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [organization?.id]);

  const handleReviewClick = (req: AttendanceCorrectionRequest, type: 'Approved' | 'Rejected') => {
    setActiveRequest(req);
    setActionType(type);
    setRemarks(type === 'Approved' ? 'Verified with team calendar and approved.' : 'Rejected due to missing verification.');
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    try {
      await api.reviewCorrectionRequest(activeRequest.id, actionType, remarks);
      addToast(
        `Correction ${actionType}`,
        `Attendance correction for ${activeRequest.userName} (${activeRequest.date}) has been ${actionType.toLowerCase()}.`,
        actionType === 'Approved' ? 'success' : 'info'
      );
      setReviewModalOpen(false);
      await fetchCorrections();
    } catch (err: any) {
      addToast('Review Failed', err.message || 'Unable to update correction.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchSearch = r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.date.includes(searchQuery);

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>{organization?.name} • Regularization &amp; Auditing</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Attendance Correction Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review punch corrections. Approving a request updates the attendance record and logs both original and new timestamps to the Audit Log.
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
            placeholder="Search by employee name, ID or date..."
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
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
            No attendance correction requests found in this category.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{req.userName}</span>
                  <span className="text-[11px] font-mono text-slate-500">({req.employeeId})</span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-brand-700 border border-slate-200">
                    Date: {req.date}
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

                {/* Compare Original vs Requested */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Original Recorded Times:</span>
                    <div className="text-slate-700 font-mono mt-1">
                      In: <span className="text-rose-600">{req.originalClockIn || 'Not recorded'}</span> • Out: <span className="text-rose-600">{req.originalClockOut || 'Not recorded'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-brand-50/50 border border-brand-200">
                    <span className="text-[10px] uppercase font-bold text-brand-700">Requested Correction:</span>
                    <div className="text-slate-900 font-mono mt-1">
                      In: <span className="text-emerald-700">{req.requestedClockIn}</span> • Out: <span className="text-emerald-700">{req.requestedClockOut}</span>
                    </div>
                  </div>
                </div>

                {/* Reason and Admin Remarks */}
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  &ldquo;{req.reason}&rdquo;
                </p>

                {req.adminRemarks && (
                  <div className="text-[11px] text-brand-700 flex items-center gap-1.5 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                    <span>Admin Remarks: {req.adminRemarks} (by {req.reviewedBy})</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'Pending' && (
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => handleReviewClick(req, 'Approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Audit</span>
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

      {/* Review Modal */}
      {reviewModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600" />
              <span>{actionType} Attendance Correction</span>
            </h3>

            <p className="text-xs text-slate-600">
              {actionType === 'Approved'
                ? `You are approving ${activeRequest.userName}'s requested shift of ${activeRequest.requestedClockIn} to ${activeRequest.requestedClockOut} for ${activeRequest.date}. This change will be permanently recorded in the Audit Log.`
                : `Rejecting ${activeRequest.userName}'s correction request.`}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Note / Audit Justification
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for decision..."
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

