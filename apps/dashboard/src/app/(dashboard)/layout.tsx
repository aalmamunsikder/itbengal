'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  Globe,
  Link as LinkIcon,
  CreditCard,
  HelpCircle,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

/** Sidebar navigation items */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderGit2 },
  { label: 'WordPress', href: '/wordpress', icon: Globe },
  { label: 'Domains', href: '/domains', icon: LinkIcon },
  { label: 'Usage', href: '/usage', icon: Activity },
  { label: 'SSL Settings', href: '/ssl', icon: ShieldCheck },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

/** Full-screen loading skeleton shown while verifying auth */
function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4 dark:border-gray-800">
          <div className="h-8 w-8 rounded-lg shimmer" />
          <div className="h-5 w-24 rounded shimmer" />
        </div>
        {/* Nav items */}
        <div className="flex-1 space-y-2 p-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-5 w-5 rounded shimmer" />
              <div className="h-4 w-24 rounded shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header skeleton */}
        <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:px-6">
          <div className="h-9 w-64 rounded-lg shimmer" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg shimmer" />
            <div className="h-9 w-9 rounded-full shimmer" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 rounded shimmer" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl shimmer" />
              ))}
            </div>
            <div className="h-64 rounded-xl shimmer" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen, initialize: initSidebar } = useSidebarStore();
  const { resolvedTheme, setTheme, initialize: initTheme } = useThemeStore();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuthStore();

  const [authChecked, setAuthChecked] = useState(false);

  // On mount: verify session via cookie-based refresh
  useEffect(() => {
    async function checkAuth() {
      await refreshUser();
      setAuthChecked(true);
    }
    checkAuth();
  }, [refreshUser]);

  // Redirect to login if not authenticated after auth check
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authChecked, isAuthenticated, router]);

  useEffect(() => {
    initSidebar();
    initTheme();
  }, [initSidebar, initTheme]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Show loading skeleton while checking auth
  if (!authChecked || isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Don't render the dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  const userDisplayName = user?.firstName ?? 'User';
  const userEmail = user?.email ?? 'user@example.com';
  const userInitials = user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U';

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* ===== Mobile overlay ===== */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-100 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900',
          'lg:relative lg:z-auto',
          isCollapsed ? 'lg:w-20' : 'lg:w-[260px]',
          isMobileOpen ? 'w-[260px] translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-1.5 overflow-hidden group select-none">
            <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0 group-hover:scale-105 transition-transform duration-350">
              {/* Isometric Server Blades */}
              <path d="M50 20 L75 30 L50 40 L25 30 Z" fill="#0066ff" />
              <path d="M25 30 L50 40 L50 48 L25 38 Z" fill="#0052cc" />
              <path d="M50 40 L75 30 L75 38 L50 48 Z" fill="#003d99" />
              
              <path d="M25 44 L50 54 L50 62 L25 52 Z" fill="#0052cc" />
              <path d="M50 54 L75 44 L75 52 L50 62 Z" fill="#003d99" />
              
              <path d="M25 58 L50 68 L50 76 L25 66 Z" fill="#0052cc" />
              <path d="M50 68 L75 58 L75 66 L50 76 Z" fill="#003d99" />

              {/* Hexagonal curved arrows */}
              <path d="M54 15 C66 15, 78 23, 83 35 C88 47, 85 61, 77 71" fill="none" stroke="#0066ff" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M72 67 L77 71 L81 66" fill="none" stroke="#0066ff" strokeWidth="4.5" strokeLinecap="round" />

              <path d="M71 77 C59 84, 45 85, 32 79 C19 73, 12 59, 13 45" fill="none" stroke="#0052cc" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M18 49 L13 45 L11 50" fill="none" stroke="#0052cc" strokeWidth="4.5" strokeLinecap="round" />

              <path d="M18 36 C24 23, 36 15, 48 14" fill="none" stroke="#0066ff" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M43 11 L48 14 L45 19" fill="none" stroke="#0066ff" strokeWidth="4.5" strokeLinecap="round" />
            </svg>
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight uppercase text-gray-900 dark:text-white whitespace-nowrap">
                IT<span className="text-[#0066ff]">Bengal</span>
              </span>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hidden">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                      isCollapsed && 'lg:justify-center lg:px-2',
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300',
                      )}
                    />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-100 p-3 dark:border-gray-800">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150',
              'hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              isCollapsed && 'lg:justify-center lg:px-2',
            )}
            title={isCollapsed ? 'Toggle theme' : undefined}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 shrink-0 text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 shrink-0 text-gray-400" />
            )}
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggle}
            className={cn(
              'hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150',
              'hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              isCollapsed && 'lg:justify-center lg:px-2',
            )}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300',
                isCollapsed && 'rotate-180',
              )}
            />
            {!isCollapsed && <span>Collapse</span>}
          </button>

          {/* User info */}
          <div
            className={cn(
              'mt-2 flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-gray-800',
              isCollapsed && 'lg:justify-center lg:p-2',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {userDisplayName}
                </p>
                <p className="truncate text-xs text-gray-500">{userEmail}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ===== Main content area ===== */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:px-6">
          {/* Left: mobile menu + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, domains..."
                className="w-64 rounded-lg border border-slate-100 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:w-80 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800"
              />
            </div>
          </div>

          {/* Right: notifications + avatar */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-gray-900" />
            </button>

            {/* Avatar */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white ring-2 ring-white transition-all hover:ring-primary-200 dark:ring-gray-900 dark:hover:ring-primary-800">
              {userInitials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
