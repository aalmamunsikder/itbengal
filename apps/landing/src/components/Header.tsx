'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030014]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            ITBengal
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">FAQ</a>
          <Link href="/terms" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Terms</Link>
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="https://dashboard.itbengal.xyz/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Sign In
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

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-[#030014] border-b border-white/5 px-6 py-8 space-y-6 flex flex-col animate-fade-in">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white">Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white">Pricing</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white">FAQ</a>
          <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white">Terms</Link>
          <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
            <Link href="https://dashboard.itbengal.xyz/login" className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10">
              Sign In
            </Link>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full text-center py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
