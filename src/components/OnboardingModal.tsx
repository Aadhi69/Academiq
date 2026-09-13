'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle2, 
  FolderOpen, 
  CheckSquare, 
  BarChart3, 
  ArrowRight,
  Zap,
  Lock
} from 'lucide-react';

export function OnboardingModal() {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const key = `academiq_onboarding_seen_${user.id}`;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setIsOpen(true);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`academiq_onboarding_seen_${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Welcome to Academiq
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin ? 'HOD Work Assignment & Department Command Center' : 'Faculty Work Assignment & Submission Portal'}
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-3 pt-1">
          {isAdmin ? (
            <>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100/70 text-blue-700 shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Assign Tasks & Deadlines</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Assign deliverables to individual or multiple faculty members with priority and instructions.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-100/70 text-purple-700 shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Google Drive Verification</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    View faculty Drive submission links, verify documents, request revisions, or mark work completed.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Department Analytics & CSV Export</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Track faculty completion scores, workload distribution, and generate NAAC/NBA audit reports.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100/70 text-blue-700 shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">View Assigned Deliverables</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    See your tasks, priorities, detailed instructions, and deadlines set by the HOD.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700 shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">One-Click Google Drive Submissions</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Upload your deliverable to Google Drive, attach your link, and mark work as completed.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100/70 text-indigo-700 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Track Work Progress</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Receive instant feedback from the HOD and monitor your completion track record.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Default Password & Security Notice */}
        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Default Initial Password:</span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-[11px] font-bold">EEE@Kare</code>
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              If signing in with email/password instead of Google, use <strong>EEE@Kare</strong>. You can change your password anytime in Profile & Settings.
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <span>Get Started with Academiq</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
