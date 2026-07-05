'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Monitor, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
  comingSoon?: boolean;
}

/** Settings navigation items */
const SETTINGS_NAV: NavItem[] = [
  { label: 'Profile', href: '/settings', icon: User, exact: true },
  { label: 'Security', href: '/settings/security', icon: Shield },
  { label: 'Sessions', href: '/settings/sessions', icon: Monitor },
  {
    label: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    comingSoon: true,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-2">
            <ul className="space-y-0.5">
              {SETTINGS_NAV.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    {item.comingSoon ? (
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                          'text-gray-400 dark:text-gray-600 cursor-not-allowed',
                        )}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{item.label}</span>
                        <span className="ml-auto rounded-full bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Soon
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4.5 w-4.5 shrink-0 transition-colors',
                            isActive
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-400 dark:text-gray-500',
                          )}
                        />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
