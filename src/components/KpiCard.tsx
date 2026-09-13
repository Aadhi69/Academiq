import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  isOverdue?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isOverdue = false,
}: KpiCardProps) {
  return (
    <div className={`p-5 sm:p-6 rounded-2xl border bg-white shadow-xs transition-all hover:shadow-sm ${
      isOverdue 
        ? 'border-red-200' 
        : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${
          isOverdue 
            ? 'bg-red-50 text-red-600' 
            : 'bg-slate-50 text-slate-700'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${
          isOverdue ? 'text-red-600' : 'text-slate-900'
        }`}>
          {value}
        </div>
      </div>

      {trend ? (
        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1">
          <span>{trend}</span>
        </div>
      ) : subtitle ? (
        <div className="mt-2 text-xs font-medium text-slate-500">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
