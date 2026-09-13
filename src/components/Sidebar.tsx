'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  PlusCircle, 
  Users, 
  BarChart3, 
  Settings, 
  FolderKanban, 
  UserCircle, 
  ChevronDown,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [dashboardOpen, setDashboardOpen] = useState(true);

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 select-none justify-between">
      {/* 1. Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link 
          href={isAdmin ? '/admin/dashboard' : '/faculty/dashboard'}
          className="flex items-center gap-3"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        >
          <div className="relative h-7 w-32 flex items-center">
            <Image
              src="/images/academiq-wordmark.png"
              alt="Academiq Logo"
              width={130}
              height={32}
              priority
              className="object-contain object-left"
            />
          </div>
        </Link>
      </div>

      {/* 2. Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* MENU Group */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            MENU
          </div>

          <div className="space-y-1">
            {/* Dashboard Accordion Item */}
            <div>
              <button
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname.includes('/dashboard')
                    ? 'bg-blue-50/80 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg ${pathname.includes('/dashboard') ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <span>Dashboard</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dashboardOpen ? 'rotate-180' : ''} ${pathname.includes('/dashboard') ? 'text-blue-600' : 'text-slate-400'}`} />
              </button>

              {dashboardOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-100 space-y-1">
                  <Link
                    href={isAdmin ? '/admin/dashboard' : '/faculty/dashboard'}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === '/admin/dashboard' || pathname === '/faculty/dashboard'
                        ? 'text-blue-600 font-semibold bg-blue-50/50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Overview
                  </Link>

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/tasks"
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          pathname === '/admin/tasks'
                            ? 'text-blue-600 font-semibold bg-blue-50/50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span>Tasks</span>
                      </Link>

                      <Link
                        href="/admin/tasks/new"
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          pathname === '/admin/tasks/new'
                            ? 'text-blue-600 font-semibold bg-blue-50/50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span>Assign Work</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Standard Nav Items */}
            {isAdmin ? (
              <>
                <Link
                  href="/admin/tasks"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/admin/tasks'
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-slate-400" />
                    <span>Task List</span>
                  </div>
                </Link>

                <Link
                  href="/admin/faculty"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname.startsWith('/admin/faculty')
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Faculty Profiles</span>
                  </div>
                </Link>

                <Link
                  href="/admin/reports"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/admin/reports'
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span>Analytics & Reports</span>
                  </div>
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/admin/settings'
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/faculty/tasks"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/faculty/tasks'
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 text-slate-400" />
                  <span>My Deliverables</span>
                </Link>

                <Link
                  href="/faculty/profile"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/faculty/profile'
                      ? 'bg-blue-50/80 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  <span>Faculty Profile</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* SUPPORT Group */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SUPPORT & INFO
          </div>
          <div className="space-y-1">
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
              <div className="font-semibold text-slate-800">EEE Department</div>
              <div className="text-slate-400 text-[10px]">Kalasalingam University</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom User Profile Card */}
      <div className="p-3 border-t border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">
                {isAdmin ? 'HOD • EEE' : user?.designation}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (256px width matching TailAdmin) */}
      <aside className="hidden lg:block w-64 h-screen fixed top-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="relative w-64 h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

