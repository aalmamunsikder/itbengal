import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ThemeScript } from '@/components/ThemeProvider';
import '@/styles/variables.css';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'ITBengal — Modern Hosting Platform',
    template: '%s | ITBengal',
  },
  description:
    'Deploy React and WordPress projects with ease. Fast, reliable hosting with custom domains, SSL, and one-click deployments.',
  keywords: ['hosting', 'deployment', 'react', 'wordpress', 'domains', 'ssl'],
  authors: [{ name: 'ITBengal', url: 'https://itbengal.xyz' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-gray-950">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
