import React from 'react';
import { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  switch (priority) {
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
          <span>HIGH</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>MEDIUM</span>
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>LOW</span>
        </span>
      );
    default:
      return null;
  }
}
