'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { memoryStore } from '@/lib/firebase/db';
import { AuditLog, EmailLog } from '@/types';
import { Building, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const { changePassword } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setAuditLogs(memoryStore.getAuditLogs());
    setEmailLogs(memoryStore.getEmailLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = memoryStore.subscribe(() => {
      loadData();
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
      setPasswordMsg({ type: 'success', text: 'Admin password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: 'Failed to update password. Please try again.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Department Settings & System Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Departmental profile, institutional defaults, and tamper-evident audit logs.
        </p>
      </div>

      {/* Institutional Profile */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-4">
          <Building className="w-4 h-4 text-blue-600" />
          <span>Institutional Profile & Department Defaults</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">University</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Kalasalingam Academy of Research and Education</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Department</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Department of Electrical & Electronics Engineering</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Head of Department (HOD)</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Dr. K. Vijayakumar (HOD / EEE)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Official Faculty Roster</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">8 Appointed Faculty Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Admin Security & Password Management</span>
        </div>

        <p className="text-xs text-slate-500">
          Change your HOD administrator password. Your default password was set to <strong className="font-mono text-slate-800">EEE@Kare</strong>.
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Admin Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new admin password (min. 6 characters)"
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
              placeholder="Confirm new admin password"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Update Admin Password
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable log of task creations, status updates, revisions, and completions
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-blue-600">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-sans">
                    {log.userName || 'System'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans truncate max-w-xs">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Dispatches Log */}
      {emailLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Notification Logs</h2>
              <p className="text-xs text-slate-500">Automated notification dispatch records</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
              {emailLogs.length} logged
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {emailLogs.map((em) => (
                  <tr key={em.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 text-slate-500">{new Date(em.sentAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-sans">{em.recipient}</td>
                    <td className="py-2.5 px-4 text-blue-600">{em.type}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {em.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
