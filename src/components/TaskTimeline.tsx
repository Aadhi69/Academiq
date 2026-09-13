import React from 'react';
import { TaskActivity } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Send, 
  RotateCcw, 
  FileEdit, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

interface TaskTimelineProps {
  activities: TaskActivity[];
}

export function TaskTimeline({ activities }: TaskTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No recorded activity yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'TASK_CREATED':
      case 'TASK_ASSIGNED':
        return <FileEdit className="w-3.5 h-3.5 text-blue-500" />;
      case 'TASK_STARTED':
        return <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />;
      case 'TASK_SUBMITTED':
        return <Send className="w-3.5 h-3.5 text-purple-500" />;
      case 'REVISION_REQUESTED':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => (
        <div key={act.id} className="relative group">
          {/* Dot icon */}
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
            {getActionIcon(act.action)}
          </div>

          <div className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-slate-900">
                {act.userName || 'User'}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(act.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              {act.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
