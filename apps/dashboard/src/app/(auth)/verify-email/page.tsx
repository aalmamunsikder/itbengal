'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

/** Generate random confetti particles */
function generateParticles(count: number) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    color: [
      'bg-primary-400',
      'bg-accent-400',
      'bg-success-400',
      'bg-warning-400',
      'bg-primary-300',
      'bg-accent-300',
    ][Math.floor(Math.random() * 6)],
  }));
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { verifyEmail, isLoading, error, clearError } = useAuthStore();

  const [verified, setVerified] = useState(false);
  const [particles] = useState(() => generateParticles(24));
  const hasAttempted = useRef(false);

  // Auto-submit on mount
  useEffect(() => {
    if (!token || hasAttempted.current) return;
    hasAttempted.current = true;

    async function verify() {
      clearError();
      const success = await verifyEmail(token as string);
      if (success) {
        setVerified(true);
      }
    }

    verify();
  }, [token, verifyEmail, clearError]);

  // ─── No Token Provided ─────────────────────────────────────────────
  if (!token) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-500/10 ring-1 ring-danger-500/20">
          <AlertCircle className="h-8 w-8 text-danger-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Invalid verification link</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            This verification link is invalid or missing a token.
          </p>
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

  // ─── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Verifying your email</h1>
          <p className="mt-2 text-sm text-gray-400">
            Please wait while we verify your email address…
          </p>
        </div>
        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary-400 animate-pulse-soft"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-500/10 ring-1 ring-danger-500/20">
          <AlertCircle className="h-8 w-8 text-danger-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Verification failed</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            {error}
          </p>
        </div>

        <div className="space-y-3">
          {/* TODO: wire to a resend-verification endpoint if available */}
          <button
            onClick={() => {
              hasAttempted.current = false;
              clearError();
              // Re-trigger verification
              if (token) {
                verifyEmail(token).then((success) => {
                  if (success) setVerified(true);
                });
              }
            }}
            className={cn(
              'group relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
              'bg-gradient-to-r from-primary-600 to-primary-500',
              'hover:from-primary-500 hover:to-primary-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-950',
              'transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
            )}
          >
            Try again
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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

  // ─── Verified Successfully ─────────────────────────────────────────
  if (verified) {
    return (
      <div className="relative space-y-6 text-center animate-fade-in overflow-hidden">
        {/* Confetti / Celebration particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={cn('absolute rounded-full opacity-0', particle.color)}
              style={{
                left: `${particle.x}%`,
                top: '-10px',
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animation: `confettiFall ${particle.duration}s ease-out ${particle.delay}s forwards`,
              }}
            />
          ))}
        </div>

        {/* Animated success icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-success-500/20 animate-pulse-soft" />
          <div className="absolute -inset-2 rounded-full bg-success-500/5 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 ring-1 ring-success-500/30">
            <CheckCircle2 className="h-8 w-8 text-success-400" />
          </div>
          {/* Sparkle accents */}
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-warning-400 animate-pulse-soft" />
          <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-primary-400 animate-pulse-soft" style={{ animationDelay: '300ms' }} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Email verified!</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Your email has been successfully verified. Your account is now active
            and you can sign in to start using the platform.
          </p>
        </div>

        <Link
          href="/login?verified=true"
          className={cn(
            'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
            'bg-gradient-to-r from-primary-600 to-primary-500',
            'hover:from-primary-500 hover:to-primary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-950',
            'transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
          )}
        >
          Sign in to your account
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>

        {/* Confetti CSS animation */}
        <style jsx>{`
          @keyframes confettiFall {
            0% {
              opacity: 1;
              transform: translateY(0) rotate(0deg) scale(1);
            }
            70% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(300px) rotate(720deg) scale(0.3);
            }
          }
        `}</style>
      </div>
    );
  }

  // Fallback — should not normally reach here
  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
