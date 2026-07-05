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
    if (passwordStrength <= 1) return 'bg-danger-500';
    if (passwordStrength <= 2) return 'bg-warning-500';
    if (passwordStrength <= 3) return 'bg-warning-400';
    if (passwordStrength <= 4) return 'bg-success-400';
    return 'bg-success-500';
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-500/10 ring-1 ring-danger-500/20">
          <AlertCircle className="h-8 w-8 text-danger-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Invalid reset link</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            This password reset link is invalid or missing a token. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className={cn(
            'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
            'bg-gradient-to-r from-primary-600 to-primary-500',
            'hover:from-primary-500 hover:to-primary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-950',
            'transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
          )}
        >
          Request new reset link
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>
      </div>
    );
  }

  // ─── Success State ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-success-500/20 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 ring-1 ring-success-500/30">
            <CheckCircle2 className="h-8 w-8 text-success-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Password reset!</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/login?reset=true"
          className={cn(
            'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
            'bg-gradient-to-r from-primary-600 to-primary-500',
            'hover:from-primary-500 hover:to-primary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-950',
            'transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
          )}
        >
          Go to sign in
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>
      </div>
    );
  }

  // ─── Reset Password Form ───────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20">
          <KeyRound className="h-8 w-8 text-primary-400" />
        </div>

        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Your new password must be different from your previous password.
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          New password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-11 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationErrors.password
                ? 'border-danger-500/50'
                : 'border-white/10 hover:border-white/20',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {validationErrors.password && (
          <p className="animate-fade-in text-xs text-danger-400">{validationErrors.password}</p>
        )}

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="animate-fade-in space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i < passwordStrength ? strengthColor : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">{strengthLabel}</span>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    {met ? (
                      <Check className="h-3 w-3 text-success-400" />
                    ) : (
                      <X className="h-3 w-3 text-gray-600" />
                    )}
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        met ? 'text-success-400' : 'text-gray-500',
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
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
          Confirm new password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-11 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationErrors.confirmPassword
                ? 'border-danger-500/50'
                : 'border-white/10 hover:border-white/20',
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="animate-fade-in text-xs text-danger-400">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit */}
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
            Resetting…
          </span>
        ) : (
          'Reset password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
