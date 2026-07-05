'use client';

import Link from 'next/link';
import { Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6 bg-[#060415] text-slate-500 text-xs md:text-sm relative z-10">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4 mb-12">
        {/* Branding Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center border border-white/10">
              <Server className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">HOSTNIN</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            High-performance, containerized hosting solutions for modern static React applications and fully isolated WordPress projects.
          </p>
        </div>

        {/* Company Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-300 text-sm">Company</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><Link href="#features" className="hover:text-white">About Us</Link></li>
            <li><Link href="#pricing" className="hover:text-white">Careers</Link></li>
            <li><Link href="#faq" className="hover:text-white">Partners</Link></li>
          </ul>
        </div>

        {/* Product Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-300 text-sm">Product</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><Link href="#pricing" className="hover:text-white">React Hosting</Link></li>
            <li><Link href="#pricing" className="hover:text-white">WordPress Hosting</Link></li>
            <li><Link href="#domains" className="hover:text-white">Domain Registry</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-300 text-sm">Legal</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} HOSTNIN / ITBengal. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Status</a>
          <a href="#" className="hover:text-white">Security</a>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  );
}
