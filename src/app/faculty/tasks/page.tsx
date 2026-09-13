'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, isTaskOverdue } from '@/lib/firebase/db';
import { Task } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { EmptyState } from '@/components/EmptyState';
import { 
  Search, 
  FolderOpen, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Send,
  PlayCircle
} from 'lucide-react';

export default function FacultyTasksPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState(filterParam === 'overdue' ? 'OVERDUE' : 'ALL');

  const loadData = () => {
    if (!user) return;
    const all = memoryStore.getTasks();
    setTasks(all.filter((t) => t.assigneeIds?.includes(user.id)));
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [user]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (selectedTab === 'PENDING') return t.status === 'PENDING';
      if (selectedTab === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'REVISION_REQUIRED';
      if (selectedTab === 'SUBMITTED') return t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW';
      if (selectedTab === 'COMPLETED') return t.status === 'COMPLETED';
      if (selectedTab === 'OVERDUE') return isTaskOverdue(t);

      return true;
    });
  }, [tasks, search, selectedTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Work Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deliverables, departmental tasks, and Google Drive upload links assigned to you.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'SUBMITTED', label: 'Submitted' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'OVERDUE', label: 'Overdue' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No work items found"
          description="You do not have any tasks matching the current filter."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Deliverable</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const overdue = isTaskOverdue(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                        <Link href={`/faculty/tasks/${t.id}`} className="hover:text-blue-600 transition-colors block">
                          {t.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                          {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {overdue && <div className="text-[10px] text-rose-500 font-bold">Overdue</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} isOverdue={overdue} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        <Link
                          href={`/faculty/tasks/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-semibold text-[11px] shadow-xs"
                        >
                          <span>Open Task</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        {t.driveUrl && (
                          <a
                            href={t.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                            title="Open Google Drive Submission Folder"
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
      )}
    </div>
  );
}
