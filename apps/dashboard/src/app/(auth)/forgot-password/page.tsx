'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  function validate(): boolean {
    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const success = await forgotPassword(email);
    if (success) {
      setSubmitted(true);
    }
  }

  // ─── Success State ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        {/* Animated icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-50 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-250">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            If an account exists for{' '}
            <span className="font-extrabold text-slate-800">{email}</span>,
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left">
          <p className="text-[11px] font-bold text-slate-700 mb-2">Didn&apos;t receive the email?</p>
          <ul className="space-y-1 text-[10px] text-slate-450">
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-slate-400" />
              Check your spam or junk folder
            </li>
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-slate-400" />
              Make sure you entered the correct email
            </li>
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-slate-400" />
              Wait a few minutes and try again
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5',
              'text-xs font-bold text-slate-700',
              'hover:bg-slate-100 hover:border-slate-300',
              'transition-all duration-200',
            )}
          >
            Try a different email
          </button>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0066ff] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ─── Forgot Password Form ──────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-200">
          <Mail className="h-8 w-8 text-[#0066ff]" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          No worries. Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-655">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-xs font-bold text-slate-700">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="you@example.com"
            className={cn(
              'w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationError
                ? 'border-red-300'
                : 'border-slate-200 hover:border-slate-300',
            )}
          />
        </div>
        {validationError && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationError}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full py-3.5"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </span>
        ) : (
          'Send Reset Link'
        )}
      </button>

      {/* Back to sign in */}
      <Link
        href="/login"
        className="flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0066ff] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </form>
  );
}
