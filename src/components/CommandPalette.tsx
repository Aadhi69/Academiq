'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { memoryStore } from '@/lib/firebase/db';
import { useAuth } from '@/context/AuthContext';
import { Search, CheckSquare, Users, BarChart3, Settings, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');

  const tasks = memoryStore.getTasks();
  const faculty = memoryStore.getUsers();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFaculty = faculty.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.designation.toLowerCase().includes(query.toLowerCase()) ||
    f.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Search Bar Input */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks, faculty, reports..."
            className="w-full text-xs bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Pages */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Quick Navigation
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNavigate(isAdmin ? '/admin/dashboard' : '/faculty/dashboard')}
                className="w-full p-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Dashboard Overview</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => handleNavigate(isAdmin ? '/admin/tasks' : '/faculty/tasks')}
                className="w-full p-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>All Tasks & Deliverables</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin/faculty')}
                  className="w-full p-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Faculty Roster & Workload</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tasks Results */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Tasks & Deliverables ({filteredTasks.length})
              </div>
              <div className="space-y-0.5">
                {filteredTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate(isAdmin ? `/admin/tasks/${t.id}` : `/faculty/tasks/${t.id}`)}
                    className="w-full p-2 rounded-xl text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">Priority: {t.priority} &bull; Status: {t.status}</div>
                    </div>
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Faculty Results */}
          {filteredFaculty.length > 0 && isAdmin && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Faculty Members ({filteredFaculty.length})
              </div>
              <div className="space-y-0.5">
                {filteredFaculty.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleNavigate(`/admin/faculty/${f.id}`)}
                    className="w-full p-2 rounded-xl text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.designation} &bull; {f.email}</div>
                    </div>
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-3">
          <span>Search navigation</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
