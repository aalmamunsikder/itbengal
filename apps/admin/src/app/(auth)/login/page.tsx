'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch {
      // Error handled by store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20">
          <Shield className="h-6 w-6 text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
        <p className="mt-1.5 text-sm text-gray-400">
          Sign in to the management console
        </p>
      </div>

      {error && (
        <div className="animate-fade-in rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {error}
        </div>
      )}

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
              if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="admin@itbengal.xyz"
            className={cn(
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationErrors.email ? 'border-danger-500/50' : 'border-white/10 hover:border-white/20',
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: '' }));
            }}
            placeholder="••••••••"
            className={cn(
              'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-11 text-sm text-white',
              'placeholder-gray-500 transition-all duration-200',
              'focus:border-primary-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              validationErrors.password ? 'border-danger-500/50' : 'border-white/10 hover:border-white/20',
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
            Authenticating…
          </span>
        ) : (
          'Sign in to Admin'
        )}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      <p className="text-center text-xs text-gray-500">
        This portal is restricted to authorized administrators only.
      </p>
    </form>
  );
}
