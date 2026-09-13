'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    }
  }, [user, loading, isAdmin, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading Academiq...</span>
      </div>
    </div>
  );
}
