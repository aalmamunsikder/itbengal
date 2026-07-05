'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-slate-950/40 relative z-10 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Rocket className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-slate-400">ITBengal Inc.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
        </div>
        <p>© {new Date().getFullYear()} ITBengal. All rights reserved.</p>
      </div>
    </footer>
  );
}
