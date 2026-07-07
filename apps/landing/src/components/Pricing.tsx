'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-16 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col text-center items-center gap-3 mb-12">
        <span className="text-[#0066ff] text-xs font-bold uppercase tracking-widest">
          Pricing Plans
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          The Affordable Unfair Advantage
        </h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-lg leading-relaxed">
          Choose the plan that aligns with your cloud container management and WordPress requirements.
        </p>

        {/* Dynamic Tab Selector */}
        <div className="inline-flex rounded-xl bg-slate-200/50 p-1 mt-4 border border-slate-200/80">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-250 ${
              pricingTab === 'react'
                ? 'bg-[#0066ff] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            React / Static Apps
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-250 ${
              pricingTab === 'wp'
                ? 'bg-[#0066ff] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Managed WordPress
          </button>
        </div>
      </div>

      {/* Grid container */}
      {pricingTab === 'react' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Developer */}
          <div className="bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)] transition-all">
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-slate-400">Developer</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black text-slate-900">৳0</span>
                  <span className="text-[10px] text-slate-400 font-bold mb-1">/ forever</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-full border border-slate-100">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>1 Active project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>512 MB RAM limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Git & ZIP Deployments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>ITBengal subdomain</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0066ff]"
            >
              Start Free
            </Link>
          </div>

          {/* Card 2: Startup (Featured) */}
          <div className="bg-[#0066ff] text-white rounded-3xl border border-[#0066ff] p-6 flex flex-col justify-between shadow-lg relative hover:scale-[1.01] transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              Best Seller
            </span>
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-blue-200">Startup</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black">৳990</span>
                  <span className="text-blue-200 text-[10px] font-bold mb-1">/ month</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-blue-400/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#0066ff] text-[10px] font-bold text-blue-200 uppercase tracking-wider rounded-full border border-blue-400/30">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs">
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>5 Active websites</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>1 GB RAM / container</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>Custom domain mapping</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>Auto Let's Encrypt SSL</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>24/7 Priority support</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold bg-white text-[#0066ff] hover:bg-slate-100 transition-all shadow-xs"
            >
              Get Started
            </Link>
          </div>

          {/* Card 3: VPS Hosting */}
          <div className="bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)] transition-all">
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-slate-400">VPS Hosting</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black text-slate-900">৳1,990</span>
                  <span className="text-[10px] text-slate-400 font-bold mb-1">/ month</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-full border border-slate-100">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>15 Active websites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>1.5 GB RAM / container</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Fast build priority</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Auto Let's Encrypt SSL</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0066ff]"
            >
              Get VPS
            </Link>
          </div>

          {/* Card 4: Dedicated */}
          <div className="bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)] transition-all">
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-slate-400">Dedicated</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black text-slate-900">৳2,990</span>
                  <span className="text-[10px] text-slate-400 font-bold mb-1">/ month</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-full border border-slate-100">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>25 Active websites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>2 GB RAM / container</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Custom nameservers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Priority Support</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0066ff]"
            >
              Get Dedicated
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto items-stretch">
          
          {/* WP Lite */}
          <div className="bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)] transition-all">
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-slate-400">WP Lite</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black text-slate-900">৳1,500</span>
                  <span className="text-[10px] text-slate-400 font-bold mb-1">/ month</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-full border border-slate-100">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>1 Managed WordPress site</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Isolated MariaDB container</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>1 GB RAM & 10 GB SSD</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Daily automated S3 backups</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0066ff]"
            >
              Deploy Lite
            </Link>
          </div>

          {/* WP Pro */}
          <div className="bg-[#0066ff] text-white rounded-3xl border border-[#0066ff] p-6 flex flex-col justify-between shadow-lg relative hover:scale-[1.01] transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              Best Seller
            </span>
            <div className="space-y-6">
              <div className="text-center">
                <h6 className="text-xs font-bold uppercase tracking-widest text-blue-200">WP Professional</h6>
                <div className="flex flex-row items-end justify-center mt-3 gap-0.5">
                  <span className="text-3xl font-black">৳4,900</span>
                  <span className="text-blue-200 text-[10px] font-bold mb-1">/ month</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-blue-400/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#0066ff] text-[10px] font-bold text-blue-200 uppercase tracking-wider rounded-full border border-blue-400/30">
                    Features
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-xs">
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>5 WordPress websites</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>Isolated MariaDB instances</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>2 GB RAM & 30 GB SSD / site</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <Check className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                  <span>Hourly automated backups</span>
                </li>
              </ul>
            </div>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="mt-8 w-full py-3 rounded-xl text-center text-xs font-bold bg-white text-[#0066ff] hover:bg-slate-100 transition-all shadow-xs"
            >
              Deploy Pro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
