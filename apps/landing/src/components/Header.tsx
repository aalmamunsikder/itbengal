'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Cloud, Server, HelpCircle, MessageSquare, HardDrive, Cpu, Users, ShoppingCart, ChevronDown } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hostingMenuOpen, setHostingMenuOpen] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);

  // Live countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 0 });
  const [cartCount, setCartCount] = useState(0);

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
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!);
      return null;
    };

    const updateCartCount = () => {
      const rawCart = getCookie('itbengal_cart');
      if (rawCart) {
        try {
          const parsed = JSON.parse(rawCart);
          if (Array.isArray(parsed)) {
            setCartCount(parsed.length);
            return;
          }
        } catch (e) {}
      }
      setCartCount(0);
    };

    updateCartCount();

    window.addEventListener('cart-updated', updateCartCount);
    return () => window.removeEventListener('cart-updated', updateCartCount);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full z-50 relative font-sans">
      {/* Top BDT Promo Bar with Live Countdown Timer */}
      <div className="w-full bg-[#facc15] py-2 px-6 text-center text-xs font-extrabold text-slate-900 flex flex-wrap items-center justify-center gap-2 select-none">
        <span className="bg-slate-950 text-[#facc15] px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider leading-none">
          ⚡ Limited Deal
        </span>
        <span>Get Flat 50% Off On All Container Plans. Offer ends in:</span>
        <span className="font-mono bg-slate-950 text-[#facc15] px-2 py-0.5 rounded text-[10px] md:text-xs">
          {formatNumber(timeLeft.hours)}h : {formatNumber(timeLeft.minutes)}m : {formatNumber(timeLeft.seconds)}s
        </span>
        <Link href="#pricing" className="underline hover:text-slate-800 flex items-center gap-0.5 ml-1">
          Claim Deal <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main White Header */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/60 relative">
        <div className="mx-auto max-w-7xl px-6 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group select-none">
            <svg viewBox="0 0 100 100" className="h-9 w-9 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
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
          </Link>

          {/* Nav Links in Center Capsule */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 border border-slate-200/50 rounded-full p-1 select-none shadow-2xs">
            <Link
              href="/"
              className="inline-block text-slate-800 hover:bg-[#0066ff]/[0.05] hover:text-[#0066ff] rounded-full px-[16px] py-2 text-[13px] font-bold transition-all leading-none"
            >
              Overview
            </Link>

            {/* Hosting dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setHostingMenuOpen(true)}
              onMouseLeave={() => setHostingMenuOpen(false)}
            >
              <button
                className={`inline-flex items-center gap-1 text-slate-800 hover:bg-[#0066ff]/[0.05] hover:text-[#0066ff] rounded-full px-[16px] py-2 text-[13px] font-bold transition-all leading-none focus:outline-none ${
                  hostingMenuOpen ? 'bg-[#0066ff]/[0.05] text-[#0066ff]' : ''
                }`}
              >
                Hosting
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Mega Dropdown menu */}
              {hostingMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 grid grid-cols-12 gap-3.5 z-50 mt-1 animate-fade-in">
                  <div className="col-span-8 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Hosting Packages</span>
                    
                    <Link
                      href="/hosting/react"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Server className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">React & Static Hosting</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Blazing fast SSD storage and git integration.</p>
                      </div>
                    </Link>

                    <Link
                      href="/hosting/wordpress-hosting"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Cloud className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">Managed WordPress</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Sandboxed container boundaries with MariaDB.</p>
                      </div>
                    </Link>

                    <Link
                      href="/hosting/nodejs-hosting"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Cpu className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">Node.js Hosting</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Isolated memory runner with PM2 process control.</p>
                      </div>
                    </Link>

                    <Link
                      href="/hosting/reseller-hosting"
                      onClick={() => setHostingMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Users className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">Reseller Hosting</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Launch your brand with white-label cPanel packages.</p>
                      </div>
                    </Link>
                  </div>

                  {/* Right Help sidebar */}
                  <div className="col-span-4 border-l border-slate-100 pl-3 flex flex-col justify-between bg-slate-50/50 p-2 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                        <HelpCircle className="h-3.5 w-3.5 text-primaryBlue shrink-0" />
                        <span>Support</span>
                      </div>
                      <p className="text-[9px] text-slate-450 leading-relaxed mt-1">
                        Direct access to container engineers.
                      </p>
                    </div>
                    <a
                      href="https://api.whatsapp.com/send/?phone=8801325875955"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full text-center bg-primaryBlue hover:bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Server dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServerMenuOpen(true)}
              onMouseLeave={() => setServerMenuOpen(false)}
            >
              <button
                className={`inline-flex items-center gap-1 text-slate-800 hover:bg-[#0066ff]/[0.05] hover:text-[#0066ff] rounded-full px-[16px] py-2 text-[13px] font-bold transition-all leading-none focus:outline-none ${
                  serverMenuOpen ? 'bg-[#0066ff]/[0.05] text-[#0066ff]' : ''
                }`}
              >
                Server
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Server menu */}
              {serverMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 grid grid-cols-12 gap-3.5 z-50 mt-1 animate-fade-in">
                  <div className="col-span-8 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Server Specs</span>
                    
                    <Link
                      href="/hosting/vps-hosting"
                      onClick={() => setServerMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Server className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">Cloud VPS Hosting</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">AMD Epyc hardware with SSD storage.</p>
                      </div>
                    </Link>

                    <Link
                      href="/hosting/dedicated-server"
                      onClick={() => setServerMenuOpen(false)}
                      className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <HardDrive className="h-4.5 w-4.5 text-primaryBlue shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-none">Dedicated Server</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Bare Metal unshared resources in Bangladesh.</p>
                      </div>
                    </Link>
                  </div>

                  <div className="col-span-4 border-l border-slate-100 pl-3 flex flex-col justify-between bg-slate-50/50 p-2 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                        <HelpCircle className="h-3.5 w-3.5 text-primaryBlue shrink-0" />
                        <span>Config</span>
                      </div>
                      <p className="text-[9px] text-slate-450 leading-relaxed mt-1">
                        Get customized CPU/RAM setups.
                      </p>
                    </div>
                    <a
                      href="https://api.whatsapp.com/send/?phone=8801325875955"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full text-center bg-primaryBlue hover:bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/domain"
              className="inline-block text-slate-800 hover:bg-[#0066ff]/[0.05] hover:text-[#0066ff] rounded-full px-[16px] py-2 text-[13px] font-bold transition-all leading-none"
            >
              Domains
            </Link>
            <Link
              href="/pricing"
              className="inline-block text-slate-800 hover:bg-[#0066ff]/[0.05] hover:text-[#0066ff] rounded-full px-[16px] py-2 text-[13px] font-bold transition-all leading-none"
            >
              Pricing
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {cartCount > 0 && (
              <Link
                href="https://dashboard.itbengal.xyz/cart"
                className="relative rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-[#0066ff] transition-all flex items-center gap-1 shadow-xs border border-slate-200/50"
                title="Shopping Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0066ff] text-[9px] font-extrabold text-white ring-2 ring-white">
                  {cartCount}
                </span>
              </Link>
            )}
            <Link
              href="https://dashboard.itbengal.xyz/login"
              className="btn btn-outline-primary btn-sm rounded-full"
            >
              Sign In
            </Link>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="btn btn-primary btn-sm rounded-full"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200/60 px-6 py-6 space-y-4 flex flex-col shadow-lg z-50">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-primaryBlue">Overview</Link>
            <Link href="/domain" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-primaryBlue">Domains</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-primaryBlue">Pricing</Link>
            
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              {cartCount > 0 && (
                <Link
                  href="https://dashboard.itbengal.xyz/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                  View Cart ({cartCount})
                </Link>
              )}
              <Link
                href="https://dashboard.itbengal.xyz/login"
                className="w-full text-center py-3 rounded-xl text-xs font-bold text-slate-700 border border-slate-200/80 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                href="https://dashboard.itbengal.xyz/register"
                className="w-full text-center py-3 rounded-xl text-xs font-bold text-white bg-primaryBlue"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
