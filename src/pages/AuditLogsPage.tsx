import React, { useState, useEffect } from 'react';
import {
  History, Search, Shield, Filter, Calendar, User, ArrowRight,
  FileSpreadsheet, Sparkles, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const { organization } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs(organization?.id);
      setLogs(data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [organization?.id]);

  const filteredLogs = logs.filter(l => {
    const matchSearch = (l.targetUserName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.changedByUserName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.fieldName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>{organization?.name} • Security &amp; Compliance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record of all attendance corrections, profile modifications, leave authorizations, and schedule changes.
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
            placeholder="Search by employee, admin, field, or reason..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-all"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
        >
          <option value="ALL">All Event Actions</option>
          <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
          <option value="LEAVE_APPROVAL">Leave Approval</option>
          <option value="EMPLOYEE_STATUS_CHANGE">Employee Status Change</option>
          <option value="SCHEDULE_UPDATE">Schedule Update</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-4 py-4">Action Type</th>
                <th className="px-4 py-4">Target Employee</th>
                <th className="px-4 py-4">Original Value</th>
                <th className="px-4 py-4">New Value</th>
                <th className="px-4 py-4">Authorized By</th>
                <th className="px-4 py-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200 uppercase whitespace-nowrap">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {log.targetUserName || 'System / Organization'}
                      {log.targetEmployeeId && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {log.targetEmployeeId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono text-rose-600 max-w-[180px] truncate" title={log.originalValue}>
                      {log.originalValue}
                    </td>

                    <td className="px-4 py-4 font-mono text-emerald-600 max-w-[180px] truncate" title={log.newValue}>
                      {log.newValue}
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-brand-600" />
                        <span>{log.changedByUserName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-500 max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

