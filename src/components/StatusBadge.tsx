import React from 'react';
import { TaskStatus } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
  isOverdue?: boolean;
  className?: string;
}

export function StatusBadge({ status, isOverdue, className = '' }: StatusBadgeProps) {
  if (isOverdue && status !== 'COMPLETED' && status !== 'SUBMITTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span>Overdue</span>
      </span>
    );
  }

  switch (status) {
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Pending</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>In Progress</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span>Submitted</span>
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Under Review</span>
        </span>
      );
    case 'REVISION_REQUIRED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Revision Required</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </span>
      );
    default:
      return null;
  }
}
