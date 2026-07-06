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
      router.push('/dashboard');
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
      router.push('/dashboard');
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-500/10 ring-1 ring-warning-500/20">
          <Mail className="h-8 w-8 text-warning-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Verify your email</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
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
            'flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5',
            'text-sm font-medium text-gray-300',
            'hover:bg-white/10 hover:border-white/20',
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20">
            <ShieldCheck className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Two-factor authentication</h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* API error */}
        {error && (
          <div className="animate-fade-in flex items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
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
                'h-12 w-11 rounded-lg border bg-white/5 text-center text-lg font-semibold text-white',
                'transition-all duration-200',
                'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                'border-white/10 hover:border-white/20',
              )}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !codeComplete}
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
              Verifying…
            </span>
          ) : (
            'Verify'
          )}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
          className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
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
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-gray-400">
          Sign in to your account to continue
        </p>
      </div>

      {/* Success messages from other flows */}
      {justRegistered && (
        <div className="animate-fade-in rounded-lg border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm text-success-400">
          🎉 Account created! Please check your email to verify your account, then sign in.
        </div>
      )}
      {passwordReset && (
        <div className="animate-fade-in rounded-lg border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm text-success-400">
          ✅ Password reset successfully. You can now sign in with your new password.
        </div>
      )}
      {emailVerified && (
        <div className="animate-fade-in rounded-lg border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm text-success-400">
          ✅ Email verified! You can now sign in to your account.
        </div>
      )}

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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors((prev) => ({ ...prev, email: '' }));
              }
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

      {/* Password field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/20 focus:ring-offset-0"
        />
        <label htmlFor="remember" className="text-sm text-gray-400">
          Remember me for 30 days
        </label>
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
            Signing in…
          </span>
        ) : (
          'Sign in'
        )}
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-4 text-gray-500">or continue with</span>
        </div>
      </div>

      {/* Social login */}
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5',
          'text-sm font-medium text-gray-300',
          'hover:bg-white/10 hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'transition-all duration-200',
        )}
      >
        <Github className="h-4 w-4" />
        GitHub
      </button>

      {/* Sign up link */}
      <p className="text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
