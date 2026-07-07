'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

function RegisterForm() {
  const searchParams = useSearchParams();
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
          <div className="absolute inset-0 rounded-full bg-emerald-50 animate-pulse-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-250">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="font-bold text-slate-800">{email}</span>.
            <br />
            Please verify your email to activate your account.
          </p>
        </div>

        {/* Helpful tips */}
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

        <Link
          href={searchParams.get('redirect') ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/login'}
          className="btn btn-primary w-full py-3.5"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // ─── Registration Form ──────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="text-center mb-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-xs text-slate-500">
          Get started with free container credits today
        </p>
      </div>

      {/* API error */}
      {error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-655">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="block text-xs font-bold text-slate-700">
            First name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError('firstName');
              }}
              placeholder="First name"
              className={cn(
                'w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-900',
                'placeholder-slate-400 transition-all duration-200',
                'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
                validationErrors.firstName ? 'border-red-300' : 'border-slate-200',
              )}
            />
          </div>
          {validationErrors.firstName && (
            <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="block text-xs font-bold text-slate-700">
            Last name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError('lastName');
              }}
              placeholder="Last name"
              className={cn(
                'w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-900',
                'placeholder-slate-400 transition-all duration-200',
                'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
                validationErrors.lastName ? 'border-red-300' : 'border-slate-200',
              )}
            />
          </div>
          {validationErrors.lastName && (
            <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email address */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-bold text-slate-700">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              'w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationErrors.email ? 'border-red-300' : 'border-slate-200',
            )}
          />
        </div>
        {validationErrors.email && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-bold text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              'w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-11 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationErrors.password ? 'border-red-300' : 'border-slate-200',
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

            {/* Checklist */}
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
                    <span className={cn('text-[9px] font-bold', met ? 'text-slate-600' : 'text-slate-400')}>
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
          Confirm password
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
              validationErrors.confirmPassword ? 'border-red-300' : 'border-slate-200',
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
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.confirmPassword}</p>
        )}
      </div>

      {/* Terms of Service checkbox */}
      <div className="space-y-1.5 select-none">
        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => {
              setAgreeToTerms(e.target.checked);
              clearFieldError('terms');
            }}
            className="h-4 w-4 rounded border-slate-300 bg-slate-50 text-[#0066ff] focus:ring-[#0066ff]/20 focus:ring-offset-0 mt-0.5 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-slate-500 font-medium cursor-pointer leading-tight">
            I agree to the{' '}
            <Link href="/terms" className="font-bold text-[#0066ff] hover:text-blue-750 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold text-[#0066ff] hover:text-blue-750 hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {validationErrors.terms && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.terms}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full py-3.5 mt-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </span>
        ) : (
          'Sign Up'
        )}
      </button>

      {/* Sign in link */}
      <p className="text-center text-xs text-slate-550 pt-2">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold text-[#0066ff] hover:text-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#0066ff]" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
