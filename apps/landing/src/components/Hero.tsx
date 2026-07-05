'use client';

import Link from 'next/link';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const benefits = [
    'Superfast SSD storage clusters',
    'Automatic Let\'s Encrypt SSL config',
    'Isolated MariaDB database systems',
    'One-click WordPress container provisioning',
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-[#0b0825] via-[#060415] to-[#060415] py-20 lg:py-32 px-6 overflow-hidden">
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern-luxury opacity-100 pointer-events-none" />

      {/* Luxury glowing shapes in background */}
      <div className="absolute top-1/4 left-[-10%] w-[450px] h-[450px] rounded-full bg-primary-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066ff]/10 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-12 items-center relative z-10">
        {/* Left Column: Text Content */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-950/40 text-xs font-semibold text-primary-300">
            <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            Litespeed Optimized SSD Hosting
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
            10x Faster Hosting. <br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-primary-400 bg-clip-text text-transparent">Launch in Minutes.</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
            Fast, reliable, and secure container-isolated web hosting. Manage databases, map custom domains, and auto-renew SSL certificates without the complexity.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-xl text-base font-bold text-slate-300 border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center"
            >
              View Pricing Plans
            </a>
          </div>

          {/* Benefit Checkmarks */}
          <div className="grid gap-3 sm:grid-cols-2 pt-6 border-t border-white/5">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Presenter Mockup (5 columns) */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md rounded-2xl p-1 bg-gradient-to-br from-primary-500/20 via-white/5 to-accent-500/20 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-[#060415]/75 backdrop-blur-2xl rounded-2xl" />
            <img
              src="/hostnin_presenter_mockup.png"
              alt="High-Performance Hosting Features Illustration"
              className="relative w-full rounded-xl object-cover hover:scale-[1.01] transition-all duration-500 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
