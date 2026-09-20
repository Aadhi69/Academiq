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
  Lock,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Mail,
  UserCheck,
  X
} from 'lucide-react';

interface OnboardingModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingModal({ forceOpen, onClose }: OnboardingModalProps = {}) {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'updates' | 'guide'>('updates');

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
      return;
    }

    if (user) {
      const key = `academiq_v2_1_updates_seen_${user.id}`;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setIsOpen(true);
      }
    }
  }, [user, forceOpen]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`academiq_v2_1_updates_seen_${user.id}`, 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Academiq System Updates
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                v2.1 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Department of Electrical &amp; Electronics Engineering &bull; Kalasalingam University
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'updates' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Latest Updates &amp; Bug Fixes</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Workflow Guide</span>
          </button>
        </div>

        {/* Content: Updates Tab */}
        {activeTab === 'updates' && (
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Official HOD Admin Account</div>
                <div className="text-slate-500 leading-relaxed text-[11px]">
                  <strong>hodeee@klu.ac.in</strong> is now designated as Department Head / Admin for task assignments and approval telemetry.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Faculty Roster Update</div>
                <div className="text-slate-500 leading-relaxed text-[11px]">
                  <strong>k.vijayakumar@klu.ac.in</strong> is now active in the official faculty roster for work deliverable assignments.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Real-Time Mobile &amp; Desktop Sync</div>
                <div className="text-slate-500 leading-relaxed text-[11px]">
                  Cloud Firestore bidirectional live sync is fully active. Tasks and progress update instantly across all mobile phones and desktop computers.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Password Update &amp; Authentication Fix</div>
                <div className="text-slate-500 leading-relaxed text-[11px]">
                  Password changes now sync directly to the cloud. You can log in using your updated custom password or default <strong>EEE@Kare</strong>.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Automated Gmail API Notifications</div>
                <div className="text-slate-500 leading-relaxed text-[11px]">
                  Direct email notifications for new work assignments, submission reviews, revision requests, and task completion notices.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content: Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-3 pt-1 text-xs">
            {isAdmin ? (
              <>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Assign Tasks &amp; Deadlines</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Assign deliverables to individual or multiple faculty members with priority and instructions.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Google Drive Verification</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      View faculty Drive submission links, verify documents, request revisions, or mark work completed.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Department Analytics &amp; Compliance</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Track completion scores, workload distribution, and generate NAAC/NBA audit reports.
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">View Assigned Deliverables</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      See your tasks, priorities, detailed instructions, and deadlines set by the HOD.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Google Drive Submissions</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Upload your deliverable to Google Drive, attach your link, and submit for HOD review.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Track Work Progress</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Receive instant feedback from the HOD and monitor your completion track record.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Default Password Notice */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Initial Password:</span>
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-[11px] font-bold">EEE@Kare</code>
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  You can change your password anytime in Profile &amp; Settings.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 pt-2"
        >
          <span>Explore Academiq Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
