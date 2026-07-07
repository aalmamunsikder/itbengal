'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, Check, X, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

/** Password strength requirements (same as register page) */
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
] as const;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  /** Compute password strength score (0–5) */
  const passwordStrength = useMemo(() => {
    return PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;
  }, [password]);

  /** Strength bar color */
  const strengthColor = useMemo(() => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-amber-500';
    if (passwordStrength <= 3) return 'bg-amber-400';
    if (passwordStrength <= 4) return 'bg-emerald-400';
    return 'bg-emerald-500';
  }, [passwordStrength]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very strong';
  }, [password, passwordStrength]);

  function clearFieldError(field: string) {
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (passwordStrength < 3) {
      errors.password = 'Password is too weak';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (!token) return;
    if (!validate()) return;

    const result = await resetPassword(token, password);
    if (result) {
      setSuccess(true);
    }
  }

  // ─── No Token Provided ─────────────────────────────────────────────
  if (!token) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invalid reset link</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            This password reset link is invalid or missing a token. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="btn btn-primary w-full py-3.5"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  // ─── Success State ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-50 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-250">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Password reset!</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/login?reset=true"
          className="btn btn-primary w-full py-3.5"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  // ─── Reset Password Form ───────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-200">
          <KeyRound className="h-8 w-8 text-[#0066ff]" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set new password</h1>
        <p className="mt-2 text-xs text-slate-500">
          Your new password must be different from your previous password.
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-655">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-bold text-slate-700">
          New password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="••••••••"
            className={cn(
              'w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-11 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationErrors.password
                ? 'border-red-300'
                : 'border-slate-200 hover:border-slate-300',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {validationErrors.password && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.password}</p>
        )}

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="animate-fade-in space-y-2 pt-1.5 select-none">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i < passwordStrength ? strengthColor : 'bg-slate-100',
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-500">{strengthLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    {met ? (
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-[9px] font-bold transition-colors',
                        met ? 'text-slate-600' : 'text-slate-400',
                      )}
                    >
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700">
          Confirm new password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError('confirmPassword');
            }}
            placeholder="••••••••"
            className={cn(
              'w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-11 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationErrors.confirmPassword
                ? 'border-red-300'
                : 'border-slate-200 hover:border-slate-300',
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full py-3.5"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting…
          </span>
        ) : (
          'Reset Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#0066ff]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
