'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

export default function NotFound() {
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

        {/* Icon & 404 text */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-base font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            The page or work deliverable you are looking for does not exist or has been relocated.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Login Screen</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
