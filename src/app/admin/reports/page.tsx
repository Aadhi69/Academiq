'use client';

import React, { useState, useEffect } from 'react';
import { memoryStore, getDepartmentKpis, getFacultyWorkload } from '@/lib/firebase/db';
import { Task, User } from '@/types';
import { 
  FileSpreadsheet
} from 'lucide-react';

export default function AdminReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [kpis, setKpis] = useState(getDepartmentKpis([]));

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
    return () => unsub();
  }, []);

  const facultyStats = facultyList.map((f) => getFacultyWorkload(f, tasks));

  const handleExportCSV = () => {
    const headers = ['Task ID', 'Title', 'Priority', 'Status', 'Due Date', 'Submitted Date', 'Completed Date', 'Assigned Faculty', 'Google Drive URL'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      new Date(t.dueDate).toLocaleDateString(),
      t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : 'N/A',
      t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'N/A',
      `"${t.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}"`,
      `"${t.driveUrl}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Academiq_EEE_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Performance Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Department of Electrical and Electronics Engineering &bull; Workload audit and compliance records
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export All Data (CSV)</span>
        </button>
      </div>

      {/* KPI Overview (Unified 4-column card) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-100">
          <div className="lg:px-6 first:lg:pl-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">Total Department Tasks</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{kpis.totalTasks}</div>
            <div className="text-[11px] text-slate-400">8 official EEE faculty members</div>
          </div>

          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">Department Completion Rate</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{kpis.completionRate}%</div>
            <div className="text-[11px] text-slate-400">{kpis.completed} completed deliverables</div>
          </div>

          <div className="lg:px-6 space-y-2">
            <div className="text-xs font-medium text-slate-500">Active In Progress</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{kpis.inProgress + kpis.submitted}</div>
            <div className="text-[11px] text-slate-400">{kpis.submitted} drive reviews pending</div>
          </div>

          <div className="lg:px-6 last:lg:pr-0 space-y-2">
            <div className="text-xs font-medium text-slate-500">Overdue Deliverables</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{kpis.overdue}</div>
            <div className={`text-[11px] font-semibold ${kpis.overdue > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {kpis.overdue > 0 ? 'Requires immediate action' : 'All milestones on schedule'}
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Workload Ranking Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Faculty Workload & Performance Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Individual assignment allocation and progress tracking</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Faculty</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Pending</th>
                <th className="py-3.5 px-4">In Progress</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4">Completed</th>
                <th className="py-3.5 px-4">Overdue</th>
                <th className="py-3.5 px-6">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facultyStats.map((st) => (
                <tr key={st.faculty.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {st.faculty.name}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {st.faculty.designation}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {st.totalAssigned}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {st.pending}
                  </td>
                  <td className="py-4 px-4 text-blue-600 font-medium">
                    {st.inProgress}
                  </td>
                  <td className="py-4 px-4 text-indigo-600 font-medium">
                    {st.submitted}
                  </td>
                  <td className="py-4 px-4 text-emerald-600 font-bold">
                    {st.completed}
                  </td>
                  <td className="py-4 px-4">
                    {st.overdue > 0 ? (
                      <span className="font-bold text-rose-600">{st.overdue}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${st.completionRate}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="font-bold text-slate-800">
                        {st.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

