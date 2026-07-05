import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ITBengal — Premium Managed Hosting Platform',
  description: 'Deploy React apps and managed WordPress sites in seconds with automatic SSL certificates, fast global routing, and worldwide DNS routing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
