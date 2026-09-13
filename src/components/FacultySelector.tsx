'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { Check, Search, UserCheck, X } from 'lucide-react';

interface FacultySelectorProps {
  facultyList: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
}

export function FacultySelector({
  facultyList,
  selectedIds,
  onChange,
  required = false,
}: FacultySelectorProps) {
  const [search, setSearch] = useState('');

  // Filter out admin (HOD) from standard faculty assignees list if desired or include all
  const filtered = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.designation.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((i) => i !== id));
  };

  const selectedUsers = facultyList.filter((f) => selectedIds.includes(f.id));

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
            >
              <span>{u.name}</span>
              <button
                type="button"
                onClick={(e) => removeUser(u.id, e)}
                className="hover:text-rose-500 rounded p-0.5 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculty by name, designation, or email..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Faculty list items */}
      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {filtered.map((faculty) => {
          const isSelected = selectedIds.includes(faculty.id);
          return (
            <div
              key={faculty.id}
              onClick={() => toggleUser(faculty.id)}
              className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50/70'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span>{faculty.name}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({faculty.eduid})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{faculty.designation}</span>
                    <span>&bull;</span>
                    <span>{faculty.email}</span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-100">
                  Assigned
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
