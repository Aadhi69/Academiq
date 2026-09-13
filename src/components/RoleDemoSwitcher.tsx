'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronDown, Shield, User as UserIcon, LogOut, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function RoleDemoSwitcher() {
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
          {user.name.charAt(0)}
        </div>
        <span className="max-w-[130px] sm:max-w-[160px] truncate font-semibold">{user.name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          user.role === 'ADMIN' 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {user.role === 'ADMIN' ? 'HOD' : 'FACULTY'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user.designation}</div>
                <div className="text-[10px] text-blue-600 font-mono mt-0.5 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <Link
              href={isAdmin ? '/admin/settings' : '/faculty/profile'}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              {isAdmin ? (
                <>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Department Settings</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Faculty Profile</span>
                </>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
