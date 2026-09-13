'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, isTaskOverdue } from '@/lib/firebase/db';
import { sendCompletionEmail, sendRevisionEmail } from '@/lib/email/service';
import { Task, TaskActivity } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { TaskTimeline } from '@/components/TaskTimeline';
import { RevisionModal } from '@/components/RevisionModal';
import { 
  ArrowLeft, 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink, 
  Calendar, 
  Clock, 
  FolderOpen, 
  User, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  Shield,
  Trash2
} from 'lucide-react';

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
        <p className="text-xs text-slate-500">The requested work assignment does not exist or has been removed.</p>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Tasks
        </Link>
      </div>
    );
  }

  const overdue = isTaskOverdue(task);

  const handleDelete = () => {
    if (!user) return;
    if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
      memoryStore.deleteTask(task.id, user);
      router.push('/admin/tasks');
    }
  };

  const handleComplete = () => {
    if (!user) return;
    const updated = memoryStore.updateTaskStatus(task.id, 'COMPLETED', user);
    if (updated) {
      // Send email to assignees
      updated.assignees?.forEach((assignee) => {
        sendCompletionEmail({
          task: updated,
          recipient: assignee,
          hodName: user.name,
        }).catch((e) => console.warn('Email notice error:', e));
      });
      setStatusMessage('Task marked as COMPLETED and approval notice sent.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleRevisionSubmit = (comment: string) => {
    if (!user) return;
    const updated = memoryStore.updateTaskStatus(task.id, 'REVISION_REQUIRED', user, comment);
    setRevisionModalOpen(false);
    if (updated) {
      updated.assignees?.forEach((assignee) => {
        sendRevisionEmail({
          task: updated,
          recipient: assignee,
          comment,
          hodName: user.name,
        }).catch((e) => console.warn('Email notice error:', e));
      });
      setStatusMessage('Revision request dispatched to faculty.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleReopen = () => {
    if (!user) return;
    memoryStore.updateTaskStatus(task.id, 'IN_PROGRESS', user, 'HOD reopened the task');
    setStatusMessage('Task reopened as IN PROGRESS.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tasks</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {task.title}
            </h1>
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Created on {new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} by Dr. K. Vijayakumar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <StatusBadge status={task.status} isOverdue={overdue} className="text-sm px-3 py-1" />
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            title="Delete this task"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Details + Activity Timeline */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Task Info & Action Controls */}
        <div className="lg:col-span-8 space-y-6">
          {/* Submission Review Banner if Submitted */}
          {task.status === 'SUBMITTED' && (
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Faculty Submission Pending Your Review</span>
                </div>
                {task.submittedAt && (
                  <span className="text-[11px] text-purple-700">
                    Submitted: {new Date(task.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                The assigned faculty member has verified file upload to the Google Drive folder. Please inspect the deliverables and approve or request revision.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {task.driveUrl && (
                  <a
                    href={task.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Open Submission Folder</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </button>
                <button
                  onClick={() => setRevisionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Revision</span>
                </button>
              </div>
            </div>
          )}

          {/* Revision Banner if Revision Required */}
          {task.status === 'REVISION_REQUIRED' && task.revisionComment && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Active Revision Request</span>
              </div>
              <p className="text-xs text-amber-800 italic">
                &ldquo;{task.revisionComment}&rdquo;
              </p>
            </div>
          )}

          {/* Completed State Banner */}
          {task.status === 'COMPLETED' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>This work assignment is officially completed and archived.</span>
              </div>
              <button
                onClick={handleReopen}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reopen Task
              </button>
            </div>
          )}

          {/* Description & Instructions Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Work Item Overview
              </h2>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {task.instructions && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-900">
                  Step-by-Step Instructions & Guidelines:
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {task.instructions}
                </div>
              </div>
            )}

            {/* Google Drive Link Box */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    Google Drive Submission Folder
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {task.driveUrl}
                  </div>
                </div>
              </div>
              <a
                href={task.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                <span>Open Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Meta Info & Activity Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assignment Meta
            </h3>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500">Deadline</span>
                <span className={`font-bold ${overdue ? 'text-rose-600' : 'text-slate-900'}`}>
                  {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="pt-3">
                <span className="text-slate-500 block mb-1">Assigned Faculty</span>
                <div className="space-y-1">
                  {task.assignees?.map((a) => (
                    <div key={a.id} className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{a.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({a.eduid})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-900">EEE Dept (KLU)</span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-slate-500">Assigned By</span>
                <span className="font-semibold text-slate-900">Dr. K. Vijayakumar (HOD)</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Activity History
            </h3>
            <TaskTimeline activities={activities} />
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      <RevisionModal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        onSubmit={handleRevisionSubmit}
        taskTitle={task.title}
      />
    </div>
  );
}
