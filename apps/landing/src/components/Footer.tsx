'use client';

import Link from 'next/link';
import { Shield, Zap, Globe, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-16 px-6 bg-slate-50 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 justify-between items-stretch mb-10">
        
        {/* Branding & Tech specifications Column */}
        <div className="basis-full lg:basis-5/12 flex flex-col gap-6 justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 select-none">
              <svg viewBox="0 0 100 100" className="h-8 w-8 flex-shrink-0">
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
            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest">
              Version 1.0.0
            </span>
            <p className="text-slate-450 max-w-sm leading-relaxed text-[11px]">
              High-performance, containerized hosting solutions for modern static React applications and fully isolated WordPress projects in Bangladesh.
            </p>
          </div>

          {/* Technology specifics list */}
          <div className="flex flex-col gap-3.5 pt-4">
            <div className="flex flex-row gap-2 items-center text-slate-450">
              <Globe className="h-4.5 w-4.5 text-[#0066ff]" />
              <span className="text-[11px] font-bold">Automatic Let's Encrypt SSL config</span>
            </div>
            <div className="flex flex-row gap-2 items-center text-slate-450">
              <Zap className="h-4.5 w-4.5 text-[#0066ff]" />
              <span className="text-[11px] font-bold">Litespeed SSD isolation runner</span>
            </div>
            <div className="flex flex-row gap-2 items-center text-slate-450">
              <Shield className="h-4.5 w-4.5 text-[#0066ff]" />
              <span className="text-[11px] font-bold">Secure automatic daily backups</span>
            </div>
          </div>
        </div>

        {/* Links Grid Column */}
        <div className="basis-full lg:basis-6/12">
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            {/* Company Column */}
            <div className="flex flex-col items-start gap-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Company</h4>
              <ul className="space-y-3 text-[11px] font-bold text-slate-500">
                <li><Link href="#features" className="hover:text-[#0066ff] transition-colors">About Us</Link></li>
                <li><Link href="#pricing" className="hover:text-[#0066ff] transition-colors">Careers</Link></li>
                <li><Link href="#faq" className="hover:text-[#0066ff] transition-colors">Partners</Link></li>
              </ul>
            </div>

            {/* Product Column */}
            <div className="flex flex-col items-start gap-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Product</h4>
              <ul className="space-y-3 text-[11px] font-bold text-slate-500">
                <li><Link href="#pricing" className="hover:text-[#0066ff] transition-colors">React Hosting</Link></li>
                <li><Link href="#pricing" className="hover:text-[#0066ff] transition-colors">WordPress Hosting</Link></li>
                <li><Link href="/domain" className="hover:text-[#0066ff] transition-colors">Domain Registry</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="flex flex-col items-start gap-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-3 text-[11px] font-bold text-slate-500">
                <li><Link href="/terms" className="hover:text-[#0066ff] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#0066ff] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#faq" className="hover:text-[#0066ff] transition-colors">FAQ Support</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Capsule bottom banner */}
      <div className="max-w-7xl mx-auto bg-slate-100 rounded-2xl border border-slate-200/40 p-4 sm:py-3 sm:px-6 mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
        <span className="font-bold">
          Copyright © {new Date().getFullYear()}{' '}
          <Link href="/" className="hover:text-[#0066ff] hover:underline">
            ITBengal
          </Link>
          . All rights reserved.
        </span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-[#0066ff] font-semibold">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#0066ff] font-semibold">Terms</Link>
          <a
            href="https://api.whatsapp.com/send/?phone=8801325875955"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0066ff] font-semibold flex items-center gap-1"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
}
