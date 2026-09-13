'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { memoryStore, getFacultyWorkload } from '@/lib/firebase/db';
import { 
  User, 
  Mail, 
  Building, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Award,
  ShieldCheck,
  LogOut,
  Lock,
  AlertCircle
} from 'lucide-react';

export default function FacultyProfilePage() {
  const { user, logout, changePassword } = useAuth();
  const [tasks, setTasks] = useState(memoryStore.getTasks());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = memoryStore.subscribe(() => {
      setTasks(memoryStore.getTasks());
    });
    return () => unsub();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    const success = await changePassword(newPassword);
    if (success) {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully! Use your new password on next login.' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: 'Failed to update password. Please try again.' });
    }
  };

  if (!user) return null;

  const stats = getFacultyWorkload(user, tasks);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Faculty Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your official institutional profile in the Department of Electrical & Electronics Engineering.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">
                {user.designation}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Department of Electrical & Electronics Engineering
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center sm:text-right self-start sm:self-auto min-w-[140px]">
            <div className="text-2xl font-black text-emerald-600">
              {stats.completionRate}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Completion Rate
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Email</div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KLU ID & EDU ID</div>
            <div className="font-semibold text-slate-900 font-mono">
              {user.kluid} &bull; {user.eduid}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">University Affiliation</div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <span>Kalasalingam Academy of Research and Education</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Role</div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{user.role} (Verified Faculty)</span>
            </div>
          </div>
        </div>

        {/* Work Metrics Summary */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Work Performance Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[11px]">Total Assigned</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{stats.totalAssigned}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[11px]">Active In Progress</div>
              <div className="text-lg font-bold text-blue-600 mt-1">{stats.inProgress}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[11px]">Submitted for Review</div>
              <div className="text-lg font-bold text-purple-600 mt-1">{stats.submitted}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[11px]">Completed & Approved</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">{stats.completed}</div>
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out from Academiq</span>
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Security & Password Management</span>
        </div>

        <p className="text-xs text-slate-500">
          Update your institutional account password for email logins. Your initial password was set to <strong className="font-mono text-slate-800">EEE@Kare</strong>.
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
