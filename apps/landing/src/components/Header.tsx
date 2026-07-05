'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Server } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full z-50 relative">
      {/* Premium Top announcement Promo Bar */}
      <div className="w-full bg-gradient-to-r from-[#1e1b4b] via-[#311042] to-[#1e1b4b] border-b border-white/5 py-2.5 px-6 text-center text-xs md:text-sm font-medium text-slate-200 flex items-center justify-center gap-2 select-none">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-primary-500/20 text-primary-300 text-[10px] font-bold px-2 py-0.5 rounded border border-primary-500/30 uppercase tracking-wide">Promo</span>
          Get Flat 50% Off On All Shared Hosting Plans. Limited Time Offer!
        </span>
        <Link href="#pricing" className="underline hover:text-white text-primary-300 font-bold flex items-center gap-0.5 ml-1">
          Claim Deal <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main Glass Header */}
      <header className="w-full bg-[#060415]/70 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-[#0066ff] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
              <Server className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              HOST<span className="bg-gradient-to-r from-primary-400 to-[#0066ff] bg-clip-text text-transparent">NIN</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Hosting</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#domains" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Domains</a>
            <a href="#faq" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Support</a>
            <Link href="/terms" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Terms</Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="https://dashboard.itbengal.xyz/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Client Portal
            </Link>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow-primary hover:shadow-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 transform active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#060415] border-b border-white/5 px-6 py-8 space-y-6 flex flex-col shadow-2xl animate-fade-in z-50">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Hosting</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Pricing</a>
            <a href="#domains" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Domains</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Support</a>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Terms</Link>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
              <Link href="https://dashboard.itbengal.xyz/login" className="w-full text-center py-3 rounded-xl text-sm font-bold text-slate-300 border border-white/10">
                Client Portal
              </Link>
              <Link href="https://dashboard.itbengal.xyz/register" className="w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-primary-600">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
