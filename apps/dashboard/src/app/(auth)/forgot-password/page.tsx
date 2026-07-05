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
          <div className="absolute inset-0 rounded-full bg-success-500/20 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 ring-1 ring-success-500/30">
            <CheckCircle2 className="h-8 w-8 text-success-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            If an account exists for{' '}
            <span className="font-medium text-white">{email}</span>,
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-left">
          <p className="text-xs font-medium text-gray-400 mb-2">Didn&apos;t receive the email?</p>
          <ul className="space-y-1 text-xs text-gray-500">
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-gray-600" />
              Check your spam or junk folder
            </li>
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-gray-600" />
              Make sure you entered the correct email
            </li>
            <li className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-gray-600" />
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
              'flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5',
              'text-sm font-medium text-gray-300',
              'hover:bg-white/10 hover:border-white/20',
              'transition-all duration-200',
            )}
          >
            Try a different email
          </button>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20">
          <Mail className="h-8 w-8 text-primary-400" />
        </div>

        <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          No worries. Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationError
                ? 'border-danger-500/50'
                : 'border-white/10 hover:border-white/20',
            )}
          />
        </div>
        {validationError && (
          <p className="animate-fade-in text-xs text-danger-400">{validationError}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'group relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
          'bg-gradient-to-r from-primary-600 to-primary-500',
          'hover:from-primary-500 hover:to-primary-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </span>
        ) : (
          'Send reset link'
        )}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Back to sign in */}
      <Link
        href="/login"
        className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </form>
  );
}
