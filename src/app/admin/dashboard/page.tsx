'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, getDepartmentKpis, isTaskOverdue, formatDueDateRelative } from '@/lib/firebase/db';
import { Task, User } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { 
  PlusCircle, 
  MoreVertical, 
  SlidersHorizontal, 
  ArrowUpRight, 
  FolderOpen, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [kpis, setKpis] = useState(getDepartmentKpis([]));
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [perfTab, setPerfTab] = useState<'Daily' | 'Submissions' | 'Faculty'>('Daily');

  const loadData = () => {
    const allTasks = memoryStore.getTasks();
    const allFaculty = memoryStore.getUsers().filter((u) => u.role === 'FACULTY');
    setTasks(allTasks);
    setFacultyList(allFaculty);
    setKpis(getDepartmentKpis(allTasks));
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, []);

  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const recentTasks = tasks.slice(0, 6);

  // Dynamic engagement calculation
  const assignedFacultyIds = new Set<string>();
  tasks.forEach((t) => t.assigneeIds?.forEach((id) => assignedFacultyIds.add(id)));
  const assignedFacultyCount = facultyList.filter((f) => assignedFacultyIds.has(f.id)).length;
  const facultyEngagementPercent = facultyList.length > 0 ? Math.round((assignedFacultyCount / facultyList.length) * 100) : 0;

  // On-time rate
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const onTimeCompleted = completedTasks.filter((t) => {
    if (!t.completedAt || !t.dueDate) return true;
    return new Date(t.completedAt) <= new Date(t.dueDate);
  }).length;
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCompleted / completedTasks.length) * 100) : 0;

  // Category breakdowns for the bottom stacked bar chart
  const categoriesList = ['NAAC SSR', 'NBA Tier-1', 'AICTE EoA', 'Curriculum', 'Lab Exams', 'Research', 'Dept Ops'];
  const categoryStats = categoriesList.map((cat) => {
    const searchKey = cat.toLowerCase().split(' ')[0];
    const catTasks = tasks.filter((t) => (t.category || t.title).toLowerCase().includes(searchKey));
    const total = catTasks.length;
    const completed = catTasks.filter((t) => t.status === 'COMPLETED').length;
    const submitted = catTasks.filter((t) => t.status === 'SUBMITTED').length;
    const inProgress = catTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVISION_REQUIRED').length;
    const pending = catTasks.filter((t) => t.status === 'PENDING').length;
    return {
      label: cat,
      total,
      completed,
      submitted,
      inProgress,
      pending,
      heights: total > 0 ? [
        Math.round((completed / total) * 60),
        Math.round((submitted / total) * 60),
        Math.round((inProgress / total) * 60),
        Math.round((pending / total) * 60),
      ] : [0, 0, 0, 0]
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Department of Electrical and Electronics Engineering &bull; Work Management Center
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Segmented Time Capsule */}
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

          {/* Filter Button */}
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          {/* Quick Assign Work Button */}
          <Link
            href="/admin/tasks/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Assign Work</span>
          </Link>
        </div>
      </div>

      {/* 2. Unified 4-Column KPI Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-100">
          {/* Column 1: Total Tasks */}
          <div className="lg:px-6 first:lg:pl-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Total Department Tasks
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {kpis.totalTasks}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>

          {/* Column 2: Active / In Progress */}
          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Active In Progress
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {kpis.inProgress}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                Ongoing
              </span>
            </div>
          </div>

          {/* Column 3: Completed Work */}
          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Completed Deliverables
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {kpis.completed}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                {kpis.completionRate}%
              </span>
            </div>
          </div>

          {/* Column 4: Overdue Tasks */}
          <div className="lg:px-6 last:lg:pr-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Overdue Deliverables
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {kpis.overdue}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  kpis.overdue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {kpis.overdue > 0 ? `${kpis.overdue} Urgent` : 'On Track'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: On-Time Delivery Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">On-Time Delivery Rate</h3>
              <p className="text-xs text-slate-400 mt-0.5">Departmental SLA compliance</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {completedTasks.length > 0 ? `${onTimeRate}%` : '0%'}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {completedTasks.length > 0
                  ? `${onTimeCompleted} of ${completedTasks.length} on-time`
                  : 'No completed tasks yet'}
              </div>
            </div>

            <div className="w-24 h-10 flex items-end justify-end">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${onTimeRate}%` }} 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Faculty Workload Allocation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Engagement</h3>
              <p className="text-xs text-slate-400 mt-0.5">{facultyList.length} EEE faculty members</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">{facultyEngagementPercent}% Active</div>
              <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-0.5">
                {assignedFacultyCount} of {facultyList.length} Faculty Assigned
              </div>
            </div>

            <div className="w-24 h-10 flex items-end justify-end">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${facultyEngagementPercent}%` }} 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Department Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-slate-900">Department Performance</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <button
              onClick={() => setPerfTab('Daily')}
              className={`px-3 py-1 rounded-lg transition-all ${perfTab === 'Daily' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setPerfTab('Submissions')}
              className={`px-3 py-1 rounded-lg transition-all ${perfTab === 'Submissions' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
            >
              Drive Submissions
            </button>
            <button
              onClick={() => setPerfTab('Faculty')}
              className={`px-3 py-1 rounded-lg transition-all ${perfTab === 'Faculty' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
            >
              By Faculty
            </button>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Drive Files Uploaded</div>
              <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <span className="text-emerald-500">↑</span> {kpis.completed + kpis.submitted}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Pending Reviews</div>
              <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <span className="text-blue-500">&bull;</span> {kpis.submitted}
              </div>
            </div>
          </div>

          {/* Deliverable Rate & Progress Bar */}
          <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Deliverable Completion Rate</div>
              <div className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                {kpis.completionRate}%
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  kpis.completionRate >= 80 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : kpis.completionRate >= 50 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {kpis.completionRate >= 80 ? 'Optimal' : kpis.completionRate > 0 ? 'Active' : 'No Tasks'}
                </span>
              </div>
            </div>

            <div className="w-24 h-10 flex items-end justify-end">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${kpis.completionRate}%` }} 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Task Lifecycle Distribution Stacked Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Work Breakdown by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">NAAC, NBA, Curriculum, and Departmental Administration</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Legend dots */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD]" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
            <span>Completed</span>
          </div>
        </div>

        {/* Stacked Bars Visual Chart */}
        {tasks.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            <span>No department tasks assigned yet.</span>
            <Link href="/admin/tasks/new" className="mt-1 text-blue-600 font-semibold hover:underline">
              Create and assign the first task &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end justify-between h-44 pt-4 px-2 border-b border-slate-100">
              {categoryStats.map((col, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-7 sm:w-10 rounded-xl overflow-hidden flex flex-col-reverse shadow-2xs bg-slate-50 min-h-[6px]">
                    <div style={{ height: `${col.heights[0]}px` }} className="bg-[#1D4ED8]" title={`Completed: ${col.completed}`} />
                    <div style={{ height: `${col.heights[1]}px` }} className="bg-[#2563EB]" title={`Submitted: ${col.submitted}`} />
                    <div style={{ height: `${col.heights[2]}px` }} className="bg-[#3B82F6]" title={`In Progress: ${col.inProgress}`} />
                    <div style={{ height: `${col.heights[3]}px` }} className="bg-[#93C5FD]" title={`Pending: ${col.pending}`} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-800 transition-colors">
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-2">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Recent Work Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Task Assignments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status of faculty work</p>
          </div>
          <Link
            href="/admin/tasks"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Task</th>
                <th className="py-3.5 px-4">Faculty</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-semibold text-slate-700">No departmental tasks created yet</p>
                      <p className="text-[11px] text-slate-400">Click &ldquo;Assign Work&rdquo; above to delegate your first assignment to EEE faculty.</p>
                      <Link
                        href="/admin/tasks/new"
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Assign New Work</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recentTasks.map((t) => {
                  const isCompleted = t.status === 'COMPLETED';
                  const dueInfo = formatDueDateRelative(t.dueDate, isCompleted);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs">
                        <Link href={`/admin/tasks/${t.id}`} className="hover:text-blue-600 line-clamp-1">
                          {t.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {t.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}
                      </td>
                      <td className="py-4 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-4 px-4">
                        <span className={dueInfo.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                          {dueInfo.text}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={t.status} isOverdue={dueInfo.isOverdue} />
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/admin/tasks/${t.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                        >
                          View
                        </Link>
                        {t.driveUrl && (
                          <a
                            href={t.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                            title="Open Google Drive"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


