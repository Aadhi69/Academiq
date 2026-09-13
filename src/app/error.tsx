'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative h-8 w-36">
            <Image
              src="/images/academiq-wordmark.png"
              alt="Academiq Logo"
              width={144}
              height={36}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Icon & Error text */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Something went wrong while loading this page. You can try refreshing or returning to the dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
