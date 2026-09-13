'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, isTaskOverdue } from '@/lib/firebase/db';
import { sendSubmissionNotification } from '@/lib/email/service';
import { Task, TaskActivity } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { TaskTimeline } from '@/components/TaskTimeline';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  ArrowLeft, 
  PlayCircle, 
  Send, 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink, 
  FolderOpen
} from 'lucide-react';

export default function FacultyTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    if (!taskId) return;
    const foundTask = memoryStore.getTask(taskId);
    if (foundTask) {
      setTask(foundTask);
      setActivities(memoryStore.getActivities(taskId));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [taskId]);

  if (!task) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Task Not Found</h2>
        <Link
          href="/faculty/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Tasks
        </Link>
      </div>
    );
  }

  const overdue = isTaskOverdue(task);

  const handleStartWork = () => {
    if (!user) return;
    memoryStore.updateTaskStatus(task.id, 'IN_PROGRESS', user);
    setStatusMessage('Task status updated to IN PROGRESS.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleSubmitWork = async (customDriveUrl?: string) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // If a custom Drive URL is provided, update task with it
      if (customDriveUrl && customDriveUrl !== task.driveUrl) {
        memoryStore.updateTask(task.id, { driveUrl: customDriveUrl }, user);
      }

      // Mark as SUBMITTED once drive link is uploaded
      const updated = memoryStore.updateTaskStatus(task.id, 'SUBMITTED', user);
      setConfirmModalOpen(false);
      setIsSubmitting(false);

      if (updated) {
        const hod = memoryStore.getUsers().find((u) => u.role === 'ADMIN');
        if (hod) {
          sendSubmissionNotification({
            task: updated,
            faculty: user,
            hodEmail: hod.email,
          }).catch((e) => console.warn('Email notice error:', e));
        }

        setStatusMessage('Deliverable uploaded! Work submitted to HOD for review.');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/faculty/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Tasks</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {task.title}
            </h1>
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Assigned by Dr. K. Vijayakumar (HOD) &bull; Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div>
          <StatusBadge status={task.status} isOverdue={overdue} className="text-sm px-3 py-1" />
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Task Overview & Submission Controls */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Action Banner */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Action & Deliverable Submission
              </h2>
              {task.completedAt && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Completed on {new Date(task.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Status-specific instruction banners */}
            {task.status === 'PENDING' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Ready to start working on this task?
                </div>
                <p className="text-xs text-slate-500">
                  Click &ldquo;Start Work&rdquo; to notify the department that you have begun preparation.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleStartWork}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start Work</span>
                  </button>
                </div>
              </div>
            )}

            {task.status === 'REVISION_REQUIRED' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Revision Feedback from HOD:</span>
                </div>
                <p className="text-xs text-amber-800 italic bg-white p-3 rounded-xl border border-amber-200/80">
                  &ldquo;{task.revisionComment}&rdquo;
                </p>
                <p className="text-[11px] text-amber-700">
                  Please update the files in the Google Drive folder and click &ldquo;Upload & Complete Work&rdquo; again.
                </p>
              </div>
            )}

            {task.status === 'COMPLETED' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  ✓ Deliverable Uploaded & Work Completed.
                </span>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {task.driveUrl && (
                <a
                  href={task.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Open Google Drive Submission Link</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </a>
              )}

              {task.status !== 'COMPLETED' && (
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{task.driveUrl ? 'Submit Drive Link & Complete' : 'Attach Drive Link & Complete Work'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Description & Instructions Card */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Work Assignment Description
              </h2>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {task.instructions && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-900">
                  Step-by-Step Instructions:
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {task.instructions}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Meta & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Details
            </h3>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500">Deadline</span>
                <span className={`font-bold ${overdue ? 'text-rose-600' : 'text-slate-900'}`}>
                  {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-slate-500">Assigned By</span>
                <span className="font-semibold text-slate-900">Dr. K. Vijayakumar (HOD)</span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-900">EEE Dept</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Activity History
            </h3>
            <TaskTimeline activities={activities} />
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSubmitWork}
        isSubmitting={isSubmitting}
        title="Submit Deliverable & Mark Completed"
        message="Enter or confirm your Google Drive submission link to mark this task as completed for department records."
        driveUrl={task.driveUrl}
        confirmLabel="Upload Link & Complete Work"
      />
    </div>
  );
}

