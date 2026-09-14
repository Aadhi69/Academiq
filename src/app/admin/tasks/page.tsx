'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, isTaskOverdue } from '@/lib/firebase/db';
import { Task, User } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { EmptyState } from '@/components/EmptyState';
import { 
  PlusCircle, 
  Search, 
  FolderOpen, 
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function AdminTasksPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter === 'overdue' ? 'OVERDUE' : 'ALL');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'created_desc'>('created_desc');

  const loadData = () => {
    setTasks(memoryStore.getTasks());
    setFacultyList(memoryStore.getUsers().filter((u) => u.role === 'FACULTY'));
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    if (!user) return;
    if (window.confirm(`Are you sure you want to permanently delete task "${title}"?`)) {
      memoryStore.deleteTask(taskId, user);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesFaculty = t.assignees?.some((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesFaculty) return false;
      }

      if (selectedFaculty !== 'ALL') {
        if (!t.assigneeIds?.includes(selectedFaculty)) return false;
      }

      if (selectedPriority !== 'ALL') {
        if (t.priority !== selectedPriority) return false;
      }

      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OVERDUE') {
          if (!isTaskOverdue(t)) return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'due_asc') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'due_desc') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, searchQuery, selectedFaculty, selectedPriority, selectedStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Task Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor, filter, and review faculty deliverables across the department
          </p>
        </div>

        <Link
          href="/admin/tasks/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Assign New Work</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, faculty, or keywords..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Faculty Filter */}
          <div>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Faculty Members</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVISION_REQUIRED">Revision Required</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset Filter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> department tasks</span>
          {(searchQuery || selectedFaculty !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFaculty('ALL');
                setSelectedPriority('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Task Table & Mobile Cards */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No work assignments found"
          description="Try adjusting your search criteria or assign a new work item to a faculty member."
          actionLabel="+ Assign New Work"
          actionHref="/admin/tasks/new"
        />
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Mobile Card View (Screens < sm) */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filteredTasks.map((t) => {
              const overdue = isTaskOverdue(t);
              return (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} isOverdue={overdue} />
                  </div>

                  <div>
                    <Link href={`/admin/tasks/${t.id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 block">
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400">Assigned:</span>
                      <span className="text-slate-800 font-semibold truncate">
                        {t.assignees?.map((a) => a.name).join(', ') || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Deadline</span>
                      <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}>
                        {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/tasks/${t.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                      >
                        Manage
                      </Link>
                      {t.driveUrl && (
                        <a
                          href={t.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                          title="Open Google Drive Folder"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                  <th className="py-3.5 px-6">Task</th>
                  <th className="py-3.5 px-4">Faculty</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const overdue = isTaskOverdue(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 max-w-xs">
                        <Link href={`/admin/tasks/${t.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1">
                          {t.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {t.assignees && t.assignees.length > 0 ? (
                          <div className="space-y-0.5">
                            {t.assignees.map((a) => (
                              <div key={a.id} className="font-medium text-slate-800 truncate">
                                {a.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-4 px-4">
                        <div className={overdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                          {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {overdue && <div className="text-[10px] text-rose-500 font-semibold">Overdue</div>}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={t.status} isOverdue={overdue} />
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 shrink-0">
                        <Link
                          href={`/admin/tasks/${t.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                        >
                          Manage
                        </Link>
                        {t.driveUrl && (
                          <a
                            href={t.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                            title="Open Google Drive Folder"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteTask(t.id, t.title)}
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

