'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { memoryStore } from '@/lib/firebase/db';
import { AuditLog, EmailLog } from '@/types';
import { 
  Building, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, changePassword } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gmail API status & testing states
  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRefreshToken: boolean;
    senderEmail: string;
    isProduction: boolean;
  } | null>(null);
  const [testEmailTo, setTestEmailTo] = useState('k.vijayakumar@klu.ac.in');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setAuditLogs(memoryStore.getAuditLogs());
    setEmailLogs(memoryStore.getEmailLogs());
  };

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch('/api/email/status');
      if (res.ok) {
        const data = await res.json();
        setGmailStatus(data);
      }
    } catch (e) {
      console.warn('Error fetching Gmail status:', e);
    }
  };

  useEffect(() => {
    loadData();
    fetchGmailStatus();
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

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo || !testEmailTo.includes('@')) {
      setTestEmailMsg({ type: 'error', text: 'Please provide a valid recipient email.' });
      return;
    }

    setIsSendingTest(true);
    setTestEmailMsg(null);

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'ADMIN',
          'x-user-email': user?.email || 'k.vijayakumar@klu.ac.in',
        },
        body: JSON.stringify({ to: testEmailTo.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestEmailMsg({
          type: 'success',
          text: data.simulated
            ? `(Dev Simulation) Test email recorded successfully for ${testEmailTo}.`
            : `Live email successfully dispatched to ${testEmailTo} via Gmail API!`,
        });
        loadData();
      } else {
        setTestEmailMsg({
          type: 'error',
          text: data.error || 'Failed to dispatch test email. Check server configuration.',
        });
        loadData();
      }
    } catch (err: any) {
      setTestEmailMsg({
        type: 'error',
        text: err?.message || 'Network error while attempting test email dispatch.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Department Settings &amp; System Integration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Departmental profile, HOD Gmail API notification engine, and system audit trail.
        </p>
      </div>

      {/* Gmail API Integration Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Mail className="w-4 h-4 text-rose-600" />
            <span>Official HOD Gmail API Integration</span>
          </div>
          
          <div className="flex items-center gap-2">
            {gmailStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live &amp; Connected</span>
              </span>
            ) : !gmailStatus?.isProduction ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Dev Simulation Mode</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Setup Required</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Authorized Sender Account</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                {gmailStatus?.senderEmail || 'k.vijayakumar@klu.ac.in'} (Dr. K. Vijayakumar)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Google Cloud OAuth Scope</span>
              <span className="font-mono text-slate-700 text-[11px] mt-0.5 block bg-slate-50 p-1.5 rounded border border-slate-200">
                https://www.googleapis.com/auth/gmail.send
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">OAuth Web Client</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                Web client 1_KVK (docentelearns@gmail.com)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">One-Time HOD Authorization</span>
              <div className="mt-1">
                <a
                  href="/api/auth/gmail"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorize / Reconnect Gmail</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Test Email Form */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Send Live Integration Test Email
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Verify the server-side Gmail dispatch pipeline without creating a live assignment.
          </p>

          <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
            <input
              type="email"
              required
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="Enter recipient email (e.g. faculty email)"
              className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={isSendingTest}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 shrink-0"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </form>

          {testEmailMsg && (
            <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              testEmailMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testEmailMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{testEmailMsg.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Institutional Profile */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-4">
          <Building className="w-4 h-4 text-blue-600" />
          <span>Institutional Profile &amp; Department Defaults</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">University</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Kalasalingam Academy of Research and Education</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Department</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Department of Electrical &amp; Electronics Engineering</span>
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
          <span>Admin Security &amp; Password Management</span>
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

      {/* Email Dispatches Log */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Firestore Email Notification Logs</h2>
            <p className="text-xs text-slate-500">Tamper-evident log of automated Gmail notification dispatches</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-mono text-slate-700 font-semibold">
            {emailLogs.length} Records
          </span>
        </div>

        {emailLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No email notifications dispatched yet. Send a test email above or assign a task to generate logs.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Sender</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {emailLogs.map((em) => (
                  <tr key={em.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(em.timestamp || em.sentAt || '').toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-semibold font-sans">
                      {em.eventType || em.type}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-sans">
                      {em.recipient}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      {em.sender || 'k.vijayakumar@klu.ac.in'}
                    </td>
                    <td className="py-2.5 px-4">
                      {em.status === 'SENT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          SENT
                        </span>
                      )}
                      {em.status === 'SIMULATED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          SIMULATED
                        </span>
                      )}
                      {em.status === 'FAILED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px] truncate max-w-xs">
                      {em.errorMessage || em.error || (em.messageId ? `ID: ${em.messageId}` : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}
