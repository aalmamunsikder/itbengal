import type { Metadata } from 'next';
import { Figtree, Archivo } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

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
    <html lang="en" className={`${figtree.variable} ${archivo.variable}`}>
      <body className="font-sans antialiased text-slate-800 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
