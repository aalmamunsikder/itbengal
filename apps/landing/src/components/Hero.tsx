'use client';

import Link from 'next/link';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const benefits = [
    'Local BDT bKash/Nagad billing',
    'Automatic Let\'s Encrypt SSL config',
    'Isolated MariaDB database systems',
    'One-click WordPress container provisioning',
  ];

  return (
    <section className="relative w-full bg-gradient-to-r from-[#003ba3] via-[#002266] to-[#010821] py-14 lg:py-20 px-6 overflow-hidden">
      {/* Background neon blur shapes */}
      <div className="absolute top-1/2 left-[-10%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-12 items-center relative z-10">
        {/* Left Column: Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-400/20 bg-blue-950/40 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            Litespeed Optimized SSD Containers
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            The Developer Cloud <br />
            for Bangladesh.
          </h1>

          <p className="text-blue-100/80 text-sm md:text-base max-w-lg leading-relaxed">
            Deploy React static apps and container-isolated WordPress stacks in seconds. High-speed local servers starting at ৳0/mo.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-6 py-3.5 rounded-lg text-sm font-bold text-white bg-primaryBlue hover:bg-blue-700 shadow-md hover:shadow-blue-500/15 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Deploy Your First App
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="px-6 py-3.5 rounded-lg text-sm font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
            >
              View Pricing Plans
            </a>
          </div>

          {/* Bullet List */}
          <div className="grid gap-2 sm:grid-cols-2 pt-4 border-t border-white/5">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs md:text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Presenter Illustration */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-transparent blur-2xl rounded-full" />
            <img
              src="/hostnin_presenter_mockup.png"
              alt="High-Performance Hosting Features Illustration"
              className="relative w-full object-cover select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
