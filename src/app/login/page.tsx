'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { memoryStore } from '@/lib/firebase/db';
import { 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [roleTab, setRoleTab] = useState<'ADMIN' | 'FACULTY'>('ADMIN');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const allUsers = memoryStore.getUsers();
  const hodUser = allUsers.find((u) => u.role === 'ADMIN');
  const facultyUsers = allUsers.filter((u) => u.role === 'FACULTY');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.success) {
      if (res.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'Google sign-in failed.');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsLoading(true);
    setErrorMsg('');

    const res = await loginWithEmail(emailInput, passwordInput);
    setIsLoading(false);

    if (res.success) {
      if (res.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'No user record found matching this institutional email or KLU ID.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-200/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-36">
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

        <div className="flex items-center gap-3">
          <div className="relative h-10 w-44 sm:w-60">
            <Image
              src="/images/klu-logo.png"
              alt="Kalasalingam Academy of Research and Education"
              width={240}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Center Container */}
      <div className="max-w-5xl w-full mx-auto my-auto grid lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left Column: Context & Overview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Kalasalingam Academy of Research and Education</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Faculty Work Assignment & Progress Management
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Empowering the EEE Department with streamlined task assignment, automated Google Drive submission tracking, and real-time completion telemetry.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>HOD Administration</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Direct work assignment, deadline tracking, and NAAC/NBA compliance exports.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Faculty Workspace</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                One-click Google Drive deliverable submission and instant progress confirmation.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pure White Login Card */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-5">
          {/* Role Tabs */}
          <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => {
                setRoleTab('ADMIN');
                setEmailInput('hodeee@klu.ac.in');
              }}
              className={`w-1/2 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>HOD / Admin Login</span>
            </button>
            <button
              onClick={() => {
                setRoleTab('FACULTY');
                setEmailInput('k.vijayakumar@klu.ac.in');
              }}
              className={`w-1/2 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'FACULTY'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Faculty Login</span>
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {roleTab === 'ADMIN' ? 'HOD Portal Access' : 'Faculty Portal Access'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with your official KLU institutional account
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-all shadow-2xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (@klu.ac.in)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-100 w-full" />
            <span className="bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Or Email / KLU ID
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email or KLU ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={
                    roleTab === 'ADMIN'
                      ? 'e.g. hodeee@klu.ac.in or hodee@klu.ac.in'
                      : 'e.g. k.vijayakumar@klu.ac.in or klu1043'
                  }
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[10px] text-blue-600 font-medium">Initial: EEE@Kare</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password (e.g. EEE@Kare)"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Sign In as {roleTab === 'ADMIN' ? 'HOD' : 'Faculty'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400 py-2">
        Kalasalingam Academy of Research and Education &bull; Department of Electrical & Electronics Engineering
      </div>
    </div>
  );
}

