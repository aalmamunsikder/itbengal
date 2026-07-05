'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Server } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full z-50 relative">
      {/* Yellow Top Announcement Promo Bar */}
      <div className="w-full bg-[#facc15] py-2.5 px-6 text-center text-xs md:text-sm font-bold text-slate-950 flex items-center justify-center gap-2 select-none">
        <span>⚡ Get Flat 50% Off On All Shared Hosting Plans. Limited Time Offer!</span>
        <Link href="#pricing" className="underline hover:text-slate-800 flex items-center gap-0.5">
          Claim Deal <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main White Header */}
      <header className="w-full bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-primaryBlue flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Server className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
              HOST<span className="text-primaryBlue">NIN</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primaryBlue transition-colors">Hosting</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primaryBlue transition-colors">Pricing</a>
            <a href="#domains" className="text-sm font-bold text-slate-600 hover:text-primaryBlue transition-colors">Domains</a>
            <a href="#faq" className="text-sm font-bold text-slate-600 hover:text-primaryBlue transition-colors">Support</a>
            <Link href="/terms" className="text-sm font-bold text-slate-600 hover:text-primaryBlue transition-colors">Terms</Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="https://dashboard.itbengal.xyz/login" className="text-sm font-bold text-slate-700 hover:text-primaryBlue transition-colors">
              Client Portal
            </Link>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primaryBlue hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 px-6 py-8 space-y-6 flex flex-col shadow-xl animate-fade-in z-50">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-primaryBlue">Hosting</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-primaryBlue">Pricing</a>
            <a href="#domains" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-primaryBlue">Domains</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-primaryBlue">Support</a>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-primaryBlue">Terms</Link>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
              <Link href="https://dashboard.itbengal.xyz/login" className="w-full text-center py-3 rounded-lg text-sm font-bold text-slate-700 border border-slate-200">
                Client Portal
              </Link>
              <Link href="https://dashboard.itbengal.xyz/register" className="w-full text-center py-3 rounded-lg text-sm font-bold text-white bg-primaryBlue">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
