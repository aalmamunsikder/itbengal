'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Cloud, Server, HelpCircle, MessageSquare } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hostingMenuOpen, setHostingMenuOpen] = useState(false);

  // Live countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 3 hours for demonstration loop
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full z-50 relative">
      {/* Top BDT Promo Bar with Live Countdown Timer */}
      <div className="w-full bg-[#facc15] py-2 px-6 text-center text-xs font-bold text-slate-900 flex flex-wrap items-center justify-center gap-2 select-none">
        <span>⚡ Get Flat 50% Off On All Container Plans. Offer ends in:</span>
        <span className="font-mono bg-slate-950 text-[#facc15] px-2 py-0.5 rounded text-[10px] md:text-xs">
          {formatNumber(timeLeft.hours)}h : {formatNumber(timeLeft.minutes)}m : {formatNumber(timeLeft.seconds)}s
        </span>
        <Link href="#pricing" className="underline hover:text-slate-800 flex items-center gap-0.5 ml-1">
          Claim Deal <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main White Header */}
      <header className="w-full bg-white border-b border-slate-100 relative">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primaryBlue flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Cloud className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              ITBENGAL
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Hosting with Mega Menu dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setHostingMenuOpen(true)}
              onMouseLeave={() => setHostingMenuOpen(false)}
            >
              <button
                className={`text-xs font-bold flex items-center gap-1 py-4 transition-colors ${
                  hostingMenuOpen ? 'text-primaryBlue' : 'text-slate-500 hover:text-primaryBlue'
                }`}
              >
                Hosting
              </button>

              {/* Mega Menu Dropdown */}
              {hostingMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/3 w-[520px] bg-white rounded-xl shadow-xl border border-slate-100 p-4 grid grid-cols-12 gap-4 z-50 animate-fade-in">
                  <div className="col-span-8 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hosting Services</span>
                    
                    <Link
                      href="#pricing"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                    >
                      <Server className="h-5 w-5 text-primaryBlue mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">React & Static Hosting</h4>
                        <p className="text-[10px] text-slate-400">Blazing fast SSD storage and git integration.</p>
                      </div>
                    </Link>

                    <Link
                      href="#pricing"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                    >
                      <Cloud className="h-5 w-5 text-primaryBlue mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Managed WordPress</h4>
                        <p className="text-[10px] text-slate-400">Sandboxed container boundaries with MariaDB.</p>
                      </div>
                    </Link>
                  </div>

                  {/* Help Sidebar inside Mega Menu */}
                  <div className="col-span-4 border-l border-slate-100 pl-4 flex flex-col justify-between bg-slate-50/50 p-2.5 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                        <HelpCircle className="h-3.5 w-3.5 text-primaryBlue" />
                        <span>Need Help?</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Get instant support from our experts.
                      </p>
                    </div>
                    <a
                      href="https://api.whatsapp.com/send/?phone=8801325875955"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full text-center bg-primaryBlue hover:bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <MessageSquare className="h-3 w-3" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#domains" className="text-xs font-bold text-slate-500 hover:text-primaryBlue transition-colors">Domains</a>
            <a href="#features" className="text-xs font-bold text-slate-500 hover:text-primaryBlue transition-colors">Features</a>
            <a href="#pricing" className="text-xs font-bold text-slate-500 hover:text-primaryBlue transition-colors">Pricing</a>
            <a href="#faq" className="text-xs font-bold text-slate-500 hover:text-primaryBlue transition-colors">FAQ</a>
            <Link href="/terms" className="text-xs font-bold text-slate-500 hover:text-primaryBlue transition-colors">Terms</Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="https://dashboard.itbengal.xyz/login" className="text-xs font-bold text-slate-600 hover:text-primaryBlue transition-colors">
              Client Portal
            </Link>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-primaryBlue hover:bg-blue-700 hover:shadow transition-all duration-300 transform active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 px-6 py-6 space-y-4 flex flex-col shadow-lg z-50">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-primaryBlue">Features</a>
            <a href="#domains" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-primaryBlue">Domains</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-primaryBlue">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-primaryBlue">FAQ</a>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 hover:text-primaryBlue">Terms</Link>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              <Link href="https://dashboard.itbengal.xyz/login" className="w-full text-center py-2.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                Client Portal
              </Link>
              <Link href="https://dashboard.itbengal.xyz/register" className="w-full text-center py-2.5 rounded-lg text-xs font-bold text-white bg-primaryBlue">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
