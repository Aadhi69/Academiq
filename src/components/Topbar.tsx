'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { RoleDemoSwitcher } from './RoleDemoSwitcher';
import { CommandPalette } from './CommandPalette';
import { Search, Menu, SlidersHorizontal } from 'lucide-react';

interface TopbarProps {
  onMobileMenuClick?: () => void;
}

export function Topbar({ onMobileMenuClick }: TopbarProps) {
  const { user, isAdmin } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 select-none">
        {/* Left: Sidebar Toggle & Modern TailAdmin Search Bar */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
          <button
            onClick={onMobileMenuClick}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Search bar matching TailAdmin */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full max-w-md flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-400 text-xs transition-colors group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              <span className="truncate">Search or type command...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded-md shrink-0 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls Group */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile & 1-Click Roster Switcher */}
          <RoleDemoSwitcher />
        </div>
      </header>

      {/* Global Search Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
