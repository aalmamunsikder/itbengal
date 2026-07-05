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
    <section className="relative w-full bg-gradient-to-r from-[#002e8c] via-[#001f5e] to-[#04081c] py-20 lg:py-28 px-6 overflow-hidden">
      {/* Decorative Wavy Circle in Background */}
      <div className="absolute top-1/2 left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 items-center relative">
        {/* Left Side: Content */}
        <div className="space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-400/20 bg-blue-950/40 text-xs font-semibold text-blue-300">
            <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            Litespeed Optimized SSD Hosting
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            10x Faster Hosting. <br />
            Launch in Minutes.
          </h1>

          <p className="text-blue-100/80 text-base md:text-lg max-w-xl leading-relaxed">
            Fast, reliable, and secure web hosting starting at just ৳0/mo. Register domain names, manage databases, and deploy your site in seconds with automatic wildcard SSL.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-8 py-4 rounded-lg text-base font-bold text-white bg-[#0052cc] hover:bg-blue-600 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-lg text-base font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
            >
              View Pricing plans
            </a>
          </div>

          {/* Bullet List */}
          <div className="grid gap-3 sm:grid-cols-2 pt-6 border-t border-white/5">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Presenter Illustration */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            {/* Soft backdrop glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-indigo-600/10 to-transparent blur-2xl rounded-full" />
            <img
              src="/hostnin_presenter_mockup.png"
              alt="High-Performance Hosting Features Illustration"
              className="relative w-full object-cover hover:scale-[1.01] transition-all duration-500 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
