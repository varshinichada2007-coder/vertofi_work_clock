import React, { useState, useEffect } from 'react';
import {
  X, Briefcase, Calendar, Clock, AlertCircle, CheckCircle2,
  User, Send, Flag, Sparkles, FileText, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkClock } from '../../context/WorkClockContext';
import { api } from '../../services/api';
import { User as UserType, TaskPriority } from '../../types';

interface AssignWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUserId?: string;
}

export const AssignWorkModal: React.FC<AssignWorkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedUserId
}) => {
  const { organization, users, refreshData } = useAuth();
  const { addToast } = useWorkClock();

  const [availableEmployees, setAvailableEmployees] = useState<UserType[]>([]);
  const [assignedToUserId, setAssignedToUserId] = useState<string>(preselectedUserId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const emps = users.filter((e: UserType) => e.role !== 'ADMIN' && e.status === 'ACTIVE');
      setAvailableEmployees(emps);
      if (preselectedUserId) {
        setAssignedToUserId(preselectedUserId);
      } else if (emps.length > 0 && !assignedToUserId) {
        setAssignedToUserId(emps[0].id);
      }
    }
  }, [isOpen, users, preselectedUserId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!assignedToUserId) {
      setErrorMsg('Please select an employee to assign work to.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please specify a task title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const task = await api.assignTask({
        organizationId: organization?.id,
        assignedToUserId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        estimatedHours: Number(estimatedHours) || undefined
      });

      addToast(
        'Work Assigned Successfully 🚀',
        `Task assigned to ${task.assignedToUserName}. An instant notification has been dispatched.`,
        'success'
      );

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('HIGH');

      if (refreshData) {
        await refreshData();
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = availableEmployees.find(e => e.id === assignedToUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign Work to Team</h3>
              <p className="text-xs text-slate-500">
                Directly allocate deliverables to employees or interns with immediate alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Assignee Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" /> Assign To Employee / Intern
            </label>
            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="" disabled>Select team member...</option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation} • {emp.department} • {emp.employeeType || 'Employee'})
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-600" /> Task Title / Deliverable
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Payment Reconciliation Engine or Design Wireframes"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Description &amp; Detailed Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, constraints, acceptance criteria, or links..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 resize-none"
            />
          </div>

          {/* Row: Priority & Due Date & Estimated Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-brand-600" /> Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-brand-600"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">🚨 Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" /> Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" /> Est. Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                max="80"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          {/* Instant notification alert badge */}
          <div className="p-3 bg-brand-50/60 border border-brand-100 rounded-xl flex items-center gap-2.5 text-xs text-brand-900">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong>Real-Time Delivery:</strong> An immediate popup &amp; notification banner will be delivered directly to <strong>{selectedEmployee?.name || 'the employee'}</strong>.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Assign &amp; Notify Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
