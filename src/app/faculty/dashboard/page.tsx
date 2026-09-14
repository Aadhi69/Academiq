'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, getFacultyWorkload, isTaskOverdue, formatDueDateRelative, isTaskAssignedToUser } from '@/lib/firebase/db';
import { Task } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { EmptyState } from '@/components/EmptyState';
import { 
  SlidersHorizontal, 
  ArrowUpRight, 
  MoreVertical, 
  FolderOpen, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

  const loadData = () => {
    if (!user) return;
    const all = memoryStore.getTasks();
    const myTasks = all.filter((t) => isTaskAssignedToUser(t, user));
    setTasks(myTasks);
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });

    const handleFocus = () => loadData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsub();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  if (!user) return null;

  const stats = getFacultyWorkload(user, memoryStore.getTasks());
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const activeTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'REVISION_REQUIRED');

  // Dynamic category distribution
  const categoryCounts = tasks.reduce((acc, t) => {
    const catName = t.category || 'General Deliverables';
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    count,
    percentage: Math.round((count / (tasks.length || 1)) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* 1. TailAdmin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Overview
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            {(['Weekly', 'Monthly', 'Yearly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 2. Unified 4-Column KPI Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-100">
          <div className="lg:px-6 first:lg:pl-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              My Assigned Tasks
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {stats.totalAssigned}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>

          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              In Progress
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {stats.inProgress}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                Ongoing
              </span>
            </div>
          </div>

          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Completed Tasks
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {stats.completed}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                {stats.completionRate}%
              </span>
            </div>
          </div>

          <div className="lg:px-6 last:lg:pr-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Overdue Deliverables
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {stats.overdue}
              </span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                stats.overdue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {stats.overdue > 0 ? `${stats.overdue} Urgent` : 'On Track'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personal Completion</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assigned work delivery</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.completionRate}%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {stats.completed} of {stats.totalAssigned} deliverables completed
              </div>
            </div>

            <div className="w-24 h-10 flex items-end justify-end">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.completionRate}%` }} 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Submitted for Review</h3>
              <p className="text-xs text-slate-400 mt-0.5">Awaiting HOD sign-off</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.submitted} Tasks</div>
              <div className="text-xs text-blue-600 font-medium mt-1">
                {stats.submitted > 0 ? 'Google Drive links attached' : 'No deliverables pending review'}
              </div>
            </div>

            <div className="w-24 h-10 flex items-end justify-end">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.totalAssigned > 0 ? Math.round((stats.submitted / stats.totalAssigned) * 100) : 0}%` }} 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-slate-900">Deliverable Types</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {categoryBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center">
                No deliverables assigned yet
              </div>
            ) : (
              categoryBreakdown.slice(0, 3).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 truncate max-w-[170px]">{item.category}</span>
                    <span className="text-slate-900">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${item.percentage}%` }} 
                      className={`h-full rounded-full ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-emerald-500' : 'bg-purple-500'}`} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Active Deliverables Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Deliverables</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tasks requiring progress update or submission</p>
          </div>
          <Link
            href="/faculty/tasks"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all ({tasks.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeTasks.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            description="You have no pending deliverables awaiting action."
            actionLabel="View Work History"
            actionHref="/faculty/tasks"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeTasks.map((t) => {
              const isCompleted = t.status === 'COMPLETED';
              const dueInfo = formatDueDateRelative(t.dueDate, isCompleted);

              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4 hover:border-slate-200 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} isOverdue={dueInfo.isOverdue} />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                      <Link href={`/faculty/tasks/${t.id}`} className="hover:text-blue-600">
                        {t.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    {t.status === 'REVISION_REQUIRED' && t.revisionComment && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800">
                        <strong>HOD Feedback:</strong> {t.revisionComment}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px]">
                      <span className="text-slate-400 block text-[10px]">Deadline</span>
                      <span className={`font-semibold ${dueInfo.isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        {dueInfo.text}
                      </span>
                    </div>

                    <Link
                      href={`/faculty/tasks/${t.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                    >
                      Open Task
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

