'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { memoryStore, getFacultyWorkload, isTaskOverdue, isTaskAssignedToUser } from '@/lib/firebase/db';
import { User, Task } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { 
  ArrowLeft, 
  Mail, 
  FolderOpen,
  ChevronRight
} from 'lucide-react';

export default function FacultyWorkloadDetailPage() {
  const params = useParams();
  const facultyId = params?.id as string;

  const [faculty, setFaculty] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadData = () => {
    if (!facultyId) return;
    const foundUser = memoryStore.getUser(facultyId);
    if (foundUser) {
      setFaculty(foundUser);
      setTasks(memoryStore.getTasks());
    }
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [facultyId]);

  if (!faculty) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold">Faculty Member Not Found</h2>
        <Link href="/admin/faculty" className="text-xs text-blue-600 hover:underline">
          &larr; Back to Faculty Roster
        </Link>
      </div>
    );
  }

  const stats = getFacultyWorkload(faculty, tasks);
  const assignedTasks = tasks.filter((t) => isTaskAssignedToUser(t, faculty));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button & Profile Header */}
      <div>
        <Link
          href="/admin/faculty"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Faculty Roster</span>
        </Link>

        <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
              {faculty.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{faculty.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                  {faculty.designation}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5" /> {faculty.email}
                </span>
                <span>&bull;</span>
                <span>KLU ID: <strong>{faculty.kluid}</strong></span>
                <span>&bull;</span>
                <span>EDU ID: <strong>{faculty.eduid}</strong></span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right self-start sm:self-auto">
            <div className="text-2xl font-bold text-slate-900">
              {stats.completionRate}%
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Completion Rate
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview (Unified 4-Column) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-100">
          <div className="lg:px-6 first:lg:pl-0 space-y-1">
            <div className="text-xs font-medium text-slate-500">Total Assigned</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalAssigned}</div>
          </div>

          <div className="lg:px-6 space-y-1">
            <div className="text-xs font-medium text-slate-500">Active In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>

          <div className="lg:px-6 space-y-1">
            <div className="text-xs font-medium text-slate-500">Submitted / In Review</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.submitted}</div>
          </div>

          <div className="lg:px-6 last:lg:pr-0 space-y-1">
            <div className="text-xs font-medium text-slate-500">Completed Work</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Assigned Tasks Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Assigned Work Deliverables ({assignedTasks.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical and active tasks allocated to {faculty.name}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Task Name</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Deadline</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedTasks.map((t) => {
                const overdue = isTaskOverdue(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 max-w-sm">
                      <Link href={`/admin/tasks/${t.id}`} className="hover:text-blue-600 transition-colors line-clamp-1">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-4 px-4">
                      <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={t.status} isOverdue={overdue} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/tasks/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors font-semibold text-[11px]"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      {t.driveUrl && (
                        <a
                          href={t.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                          title="Open Google Drive Folder"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

