'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 px-6 bg-slate-50 text-slate-555 text-xs">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-4 mb-8">
        {/* Branding Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 select-none">
            <svg viewBox="0 0 100 100" className="h-7 w-7 flex-shrink-0">
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
            <span className="text-base font-black tracking-tight uppercase">
              <span className="text-primaryBlue">IT</span>
              <span className="text-slate-800">Bengal</span>
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            High-performance, containerized hosting solutions for modern static React applications and fully isolated WordPress projects in Bangladesh.
          </p>
        </div>

        {/* Company Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Company</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="https://itbengal.xyz/#features" className="hover:text-primaryBlue">About Us</Link></li>
            <li><Link href="https://itbengal.xyz/#pricing" className="hover:text-primaryBlue">Careers</Link></li>
            <li><Link href="https://itbengal.xyz/#faq" className="hover:text-primaryBlue">Partners</Link></li>
          </ul>
        </div>

        {/* Product Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Product</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="https://itbengal.xyz/#pricing" className="hover:text-primaryBlue">React Hosting</Link></li>
            <li><Link href="https://itbengal.xyz/#pricing" className="hover:text-primaryBlue">WordPress Hosting</Link></li>
            <li><Link href="https://itbengal.xyz/#domains" className="hover:text-primaryBlue">Domain Registry</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Legal</h4>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li><Link href="https://itbengal.xyz/terms" className="hover:text-primaryBlue">Terms of Service</Link></li>
            <li><Link href="https://itbengal.xyz/privacy" className="hover:text-primaryBlue">Privacy Policy</Link></li>
            <li><Link href="https://itbengal.xyz/#faq" className="hover:text-primaryBlue">FAQ</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
        <p>© {new Date().getFullYear()} ITBENGAL. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primaryBlue">Status</a>
          <a href="#" className="hover:text-primaryBlue">Security</a>
          <a href="#" className="hover:text-primaryBlue">Contact</a>
        </div>
      </div>
    </footer>
  );
}
