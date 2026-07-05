'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Server,
  Rocket,
  Globe,
  CreditCard,
  HelpCircle,
  Activity,
  BarChart3,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

/** Admin sidebar navigation items */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Containers', href: '/containers', icon: Server },
  { label: 'Deployments', href: '/deployments', icon: Rocket },
  { label: 'Domains', href: '/domains', icon: Globe },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'Monitoring', href: '/monitoring', icon: Activity },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen, initialize: initSidebar } = useSidebarStore();
  const { resolvedTheme, setTheme, initialize: initTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    initSidebar();
    initTheme();
  }, [initSidebar, initTheme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const userDisplayName = user?.firstName ?? 'Admin';
  const userEmail = user?.email ?? 'admin@itbengal.xyz';
  const userInitials = user ? getInitials(`${user.firstName} ${user.lastName}`) : 'A';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900',
          'lg:relative lg:z-auto',
          isCollapsed ? 'lg:w-20' : 'lg:w-[260px]',
          isMobileOpen ? 'w-[260px] translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  IT<span className="text-primary-500">Bengal</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Admin
                </span>
              </div>
            )}
          </Link>
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

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150',
              'hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              isCollapsed && 'lg:justify-center lg:px-2',
            )}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 shrink-0 text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 shrink-0 text-gray-400" />
            )}
            {!isCollapsed && (resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode')}
          </button>

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

          <div
            className={cn(
              'mt-2 flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800',
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
                onClick={() => logout()}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:px-6">
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
                placeholder="Search customers, servers..."
                className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:w-80 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-gray-900" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white ring-2 ring-white transition-all hover:ring-primary-200 dark:ring-gray-900 dark:hover:ring-primary-800">
              {userInitials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
