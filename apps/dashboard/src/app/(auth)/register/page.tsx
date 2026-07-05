'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

/** Password strength requirements */
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
] as const;

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

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

    if (!agreeToTerms) {
      errors.terms = 'You must agree to the terms of service';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const success = await register({ firstName, lastName, email, password });
    if (success) {
      setRegistrationSuccess(true);
    }
  }

  function clearFieldError(field: string) {
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  // ─── Registration Success ───────────────────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        {/* Animated check icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          {/* Outer ring animation */}
          <div className="absolute inset-0 rounded-full bg-success-500/20 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 ring-1 ring-success-500/30">
            <CheckCircle2 className="h-8 w-8 text-success-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-white">{email}</span>.
            <br />
            Please verify your email to activate your account.
          </p>
        </div>

        {/* Helpful tips */}
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

        <Link
          href="/login"
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

  // ─── Registration Form ──────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1.5 text-sm text-gray-400">
          Start deploying projects in minutes
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
            First name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError('firstName');
              }}
              placeholder="John"
              className={cn(
                'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white',
                'placeholder-gray-500 transition-all duration-200',
                'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                validationErrors.firstName
                  ? 'border-danger-500/50'
                  : 'border-white/10 hover:border-white/20',
              )}
            />
          </div>
          {validationErrors.firstName && (
            <p className="animate-fade-in text-xs text-danger-400">{validationErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
            Last name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError('lastName');
              }}
              placeholder="Doe"
              className={cn(
                'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white',
                'placeholder-gray-500 transition-all duration-200',
                'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                validationErrors.lastName
                  ? 'border-danger-500/50'
                  : 'border-white/10 hover:border-white/20',
              )}
            />
          </div>
          {validationErrors.lastName && (
            <p className="animate-fade-in text-xs text-danger-400">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            placeholder="you@example.com"
            className={cn(
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationErrors.email
                ? 'border-danger-500/50'
                : 'border-white/10 hover:border-white/20',
            )}
          />
        </div>
        {validationErrors.email && (
          <p className="animate-fade-in text-xs text-danger-400">{validationErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
            {/* Strength bar */}
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

            {/* Requirements checklist */}
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
          Confirm password
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

      {/* Terms */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => {
              setAgreeToTerms(e.target.checked);
              clearFieldError('terms');
            }}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/20 focus:ring-offset-0"
          />
          <label htmlFor="terms" className="text-sm text-gray-400">
            I agree to the{' '}
            <Link href="/terms" className="text-primary-400 hover:text-primary-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>
        {validationErrors.terms && (
          <p className="animate-fade-in text-xs text-danger-400">{validationErrors.terms}</p>
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
            Creating account…
          </span>
        ) : (
          'Create account'
        )}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Sign in link */}
      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
