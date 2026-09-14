'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { memoryStore, getFacultyWorkload } from '@/lib/firebase/db';
import { User, Task } from '@/types';
import { 
  Users, 
  Search, 
  ChevronRight
} from 'lucide-react';

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setFacultyList(memoryStore.getUsers().filter((u) => u.role === 'FACULTY'));
    setTasks(memoryStore.getTasks());
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.designation.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.kluid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Faculty Profiles & Workload
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Department of Electrical and Electronics Engineering &bull; Official Faculty Roster
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, designation, KLU ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Faculty Table & Mobile Cards */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Mobile Card View (Screens < sm) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredFaculty.map((f) => {
            const stats = getFacultyWorkload(f, tasks);
            return (
              <div key={f.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                      {f.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/faculty/${f.id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 truncate block">
                        {f.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 truncate">{f.designation}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">{stats.completionRate}%</div>
                    <div className="text-[10px] text-slate-400 font-medium">Completed</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span className="font-bold text-slate-900">{stats.totalAssigned}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Active</span>
                    <span className="font-bold text-blue-600">{stats.pending + stats.inProgress}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Done</span>
                    <span className="font-bold text-emerald-600">{stats.completed}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {f.kluid} &bull; {f.eduid}
                  </span>

                  <Link
                    href={`/admin/faculty/${f.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (Screens >= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Faculty Member</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">KLU ID / EDU ID</th>
                <th className="py-3.5 px-4">Assigned Tasks</th>
                <th className="py-3.5 px-4">Active</th>
                <th className="py-3.5 px-4">Completed</th>
                <th className="py-3.5 px-4">Completion Rate</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.map((f) => {
                const stats = getFacultyWorkload(f, tasks);
                return (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <Link href={`/admin/faculty/${f.id}`} className="hover:text-blue-600 transition-colors flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{f.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {f.designation}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                      {f.kluid} &bull; {f.eduid}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {stats.totalAssigned}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                        {stats.pending + stats.inProgress}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
                        {stats.completed}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${stats.completionRate}%` }}
                            className="h-full bg-blue-600 rounded-full"
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-700">
                          {stats.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/faculty/${f.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors font-semibold text-[11px]"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
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

