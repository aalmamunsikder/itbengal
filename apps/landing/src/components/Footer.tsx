'use client';

import Link from 'next/link';
import { Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 px-6 bg-slate-50 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-4 mb-8">
        {/* Branding Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-primaryBlue flex items-center justify-center">
              <Server className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-800 tracking-tight">HOSTNIN</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            High-performance, containerized hosting solutions for modern static React applications and fully isolated WordPress projects.
          </p>
        </div>

        {/* Company Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Company</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="#features" className="hover:text-primaryBlue">About Us</Link></li>
            <li><Link href="#pricing" className="hover:text-primaryBlue">Careers</Link></li>
            <li><Link href="#faq" className="hover:text-primaryBlue">Partners</Link></li>
          </ul>
        </div>

        {/* Product Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Product</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="#pricing" className="hover:text-primaryBlue">React Hosting</Link></li>
            <li><Link href="#pricing" className="hover:text-primaryBlue">WordPress Hosting</Link></li>
            <li><Link href="#domains" className="hover:text-primaryBlue">Domain Registry</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Legal</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="/terms" className="hover:text-primaryBlue">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-primaryBlue">Privacy Policy</Link></li>
            <li><Link href="#faq" className="hover:text-primaryBlue">FAQ</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
        <p>© {new Date().getFullYear()} HOSTNIN / ITBengal. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primaryBlue">Status</a>
          <a href="#" className="hover:text-primaryBlue">Security</a>
          <a href="#" className="hover:text-primaryBlue">Contact</a>
        </div>
      </div>
    </footer>
  );
}
