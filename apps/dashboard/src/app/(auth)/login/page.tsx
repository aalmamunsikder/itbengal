'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Github, Loader2, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    isLoading,
    error,
    clearError,
    requiresTwoFactor,
    requiresVerification,
    pendingEmail,
    pendingPassword,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 2FA state
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);
  const twoFactorRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for success messages from other flows
  const justRegistered = searchParams.get('registered') === 'true';
  const passwordReset = searchParams.get('reset') === 'true';
  const emailVerified = searchParams.get('verified') === 'true';

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const success = await login(email, password);
    if (success) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }

  /** Handle 2FA code submission */
  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const code = twoFactorCode.join('');
    if (code.length !== 6) return;

    const success = await login(
      pendingEmail ?? email,
      pendingPassword ?? password,
      code,
    );
    if (success) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }

  /** Handle individual 2FA digit input */
  const handleTwoFactorChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, '').slice(-1);
      const newCode = [...twoFactorCode];
      newCode[index] = digit;
      setTwoFactorCode(newCode);

      // Auto-advance to next field
      if (digit && index < 5) {
        twoFactorRefs.current[index + 1]?.focus();
      }
    },
    [twoFactorCode],
  );

  /** Handle backspace to go to previous field */
  const handleTwoFactorKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
        twoFactorRefs.current[index - 1]?.focus();
      }
    },
    [twoFactorCode],
  );

  /** Handle paste for 2FA code */
  const handleTwoFactorPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newCode = [...twoFactorCode];
        for (let i = 0; i < 6; i++) {
          newCode[i] = pasted[i] || '';
        }
        setTwoFactorCode(newCode);
        // Focus the last filled field or the next empty one
        const focusIndex = Math.min(pasted.length, 5);
        twoFactorRefs.current[focusIndex]?.focus();
      }
    },
    [twoFactorCode],
  );

  // ─── Email Verification Required ────────────────────────────────────
  if (requiresVerification) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
          <Mail className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Verify your email</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Your email address has not been verified yet. Please check your inbox
            for a verification link before signing in.
          </p>
        </div>
        <button
          onClick={() => {
            useAuthStore.setState({
              requiresVerification: false,
              error: null,
            });
          }}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5',
            'text-xs font-bold text-slate-700',
            'hover:bg-slate-100 hover:border-slate-300',
            'transition-all duration-200',
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
      </div>
    );
  }

  // ─── Two-Factor Authentication ──────────────────────────────────────
  if (requiresTwoFactor) {
    const codeComplete = twoFactorCode.every((d) => d !== '');

    return (
      <form onSubmit={handleTwoFactorSubmit} className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-200">
            <ShieldCheck className="h-8 w-8 text-[#0066ff]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Two-factor authentication</h1>
          <p className="mt-2 text-xs text-slate-505">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* API error */}
        {error && (
          <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-650">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 6-digit input */}
        <div className="flex justify-center gap-2" onPaste={handleTwoFactorPaste}>
          {twoFactorCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { twoFactorRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleTwoFactorChange(index, e.target.value)}
              onKeyDown={(e) => handleTwoFactorKeyDown(index, e)}
              autoFocus={index === 0}
              className={cn(
                'h-12 w-11 rounded-xl border bg-slate-50 text-center text-lg font-bold text-slate-900',
                'transition-all duration-200',
                'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
                'border-slate-200 hover:border-slate-300',
              )}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !codeComplete}
          className="btn btn-primary w-full py-3.5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </span>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Back */}
        <button
          type="button"
          onClick={() => {
            useAuthStore.setState({
              requiresTwoFactor: false,
              error: null,
              pendingEmail: null,
              pendingPassword: null,
            });
            setTwoFactorCode(['', '', '', '', '', '']);
          }}
          className="flex w-full items-center justify-center gap-2 text-xs text-slate-450 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Use a different account
        </button>
      </form>
    );
  }

  // ─── Standard Login Form ────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
        <p className="mt-2 text-xs text-slate-500">
          Sign in to your dashboard console to manage containers
        </p>
      </div>

      {/* Success messages */}
      {justRegistered && (
        <div className="animate-fade-in rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 leading-normal">
          🎉 Account created! Please check your email to verify your account, then sign in.
        </div>
      )}
      {passwordReset && (
        <div className="animate-fade-in rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          ✅ Password reset successfully. You can now sign in with your new password.
        </div>
      )}
      {emailVerified && (
        <div className="animate-fade-in rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          ✅ Email verified! You can now sign in to your account.
        </div>
      )}

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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            placeholder="you@example.com"
            className={cn(
              'w-full rounded-xl border bg-slate-50 py-3 pl-10.5 pr-4 text-xs text-slate-900',
              'placeholder-slate-400 transition-all duration-200',
              'focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100',
              validationErrors.email
                ? 'border-red-300'
                : 'border-slate-200 hover:border-slate-300',
            )}
          />
        </div>
        {validationErrors.email && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.email}</p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-xs font-bold text-slate-700">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-[#0066ff] hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            placeholder="••••••••"
            className={cn(
              'w-full rounded-xl border bg-slate-50 py-3 pl-10.5 pr-11 text-xs text-slate-900',
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {validationErrors.password && (
          <p className="animate-fade-in text-[10px] text-red-500 font-bold">{validationErrors.password}</p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2 select-none">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 bg-slate-50 text-[#0066ff] focus:ring-[#0066ff]/20 focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">
          Remember me for 30 days
        </label>
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
            Signing in…
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
          <span className="bg-white px-4 text-slate-400">or continue with</span>
        </div>
      </div>

      {/* Social login */}
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3',
          'text-xs font-bold text-slate-700',
          'hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50',
          'transition-all duration-200',
        )}
      >
        <Github className="h-4 w-4 text-slate-800" />
        GitHub
      </button>

      {/* Sign up link */}
      <p className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-bold text-[#0066ff] hover:text-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#0066ff]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
