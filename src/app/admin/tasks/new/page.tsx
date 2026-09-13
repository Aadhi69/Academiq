'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { memoryStore } from '@/lib/firebase/db';
import { sendTaskAssignmentEmail } from '@/lib/email/service';
import { TaskPriority } from '@/types';
import { FacultySelector } from '@/components/FacultySelector';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  FolderGit2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function AssignNewWorkPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const facultyList = memoryStore.getUsers().filter((u) => u.role === 'FACULTY');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedFacultyIds.length === 0 || !dueDate) {
      setErrorBanner('Please fill in all required fields and select at least one faculty assignee.');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    setErrorBanner('');

    try {
      const createdTask = memoryStore.createTask(
        {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim() || undefined,
          priority,
          status: 'PENDING',
          dueDate: new Date(dueDate).toISOString(),
          driveUrl: driveUrl.trim() || 'https://drive.google.com/',
          createdById: user.id,
        },
        selectedFacultyIds,
        user
      );

      // Trigger asynchronous email dispatch to each assigned faculty
      const assignedFacultyMembers = memoryStore.getUsers().filter((u) => selectedFacultyIds.includes(u.id));
      for (const faculty of assignedFacultyMembers) {
        sendTaskAssignmentEmail({
          task: createdTask,
          recipient: faculty,
          assignedBy: user,
        }).catch((err) => console.warn('Email notice error:', err));
      }

      setSuccessBanner(true);
      setTimeout(() => {
        router.push(`/admin/tasks/${createdTask.id}`);
      }, 1200);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to assign work item.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assign New Work
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Delegate departmental academic, NBA/NAAC accreditation, or laboratory responsibilities to EEE faculty.
        </p>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <div className="font-bold">Work assigned successfully!</div>
            <div className="text-[11px] text-emerald-700">
              Email notifications have been dispatched to assigned faculty members. Redirecting...
            </div>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. NBA Tier-1 Documentation — Criterion 5 (Faculty Contributions)"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Description & Scope
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context regarding expectations, scope, and objectives of this task..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Assign To (Faculty Selector) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900">
              Assign To Faculty Member(s) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {selectedFacultyIds.length} selected
            </span>
          </div>
          <FacultySelector
            facultyList={facultyList}
            selectedIds={selectedFacultyIds}
            onChange={setSelectedFacultyIds}
            required
          />
        </div>

        {/* Priority & Due Date Row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('LOW')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'LOW'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                LOW
              </button>

              <button
                type="button"
                onClick={() => setPriority('MEDIUM')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-800 border-amber-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                MEDIUM
              </button>

              <button
                type="button"
                onClick={() => setPriority('HIGH')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-800 border-rose-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                HIGH
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Submission Deadline <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Google Drive Folder URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 flex items-center justify-between">
            <span>Google Drive Submission Folder URL</span>
            <span className="text-[11px] font-normal text-slate-400">Faculty will upload here</span>
          </label>
          <div className="relative">
            <FolderGit2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Paste the shared Google Drive folder link. Assigned faculty will use this link to directly upload spreadsheets, proofs, and documents.
          </p>
        </div>

        {/* Additional Instructions */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Detailed Step-by-Step Instructions (Optional)
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="1. Tabulate SCI/Scopus journal papers with DOIs.&#10;2. Include sanction letters for ongoing funded projects."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/admin/tasks"
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs hover:shadow"
          >
            {isSubmitting ? (
              <span>Assigning & Notifying...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Create & Assign Work</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
