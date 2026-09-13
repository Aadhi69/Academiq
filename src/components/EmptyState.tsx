import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center p-8 sm:p-12 rounded-2xl border border-dashed border-slate-200 bg-white">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
