'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
      {/* Glow shapes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-850/5 blur-[120px] pointer-events-none" />

      <div className="text-center mb-16 relative">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Choose your <span className="gradient-text">hosting plan</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-base md:text-lg">
          Flexible pricing built for developers, agencies, and production applications.
        </p>

        {/* Plan toggle tabs */}
        <div className="inline-flex rounded-xl bg-white/5 p-1.5 mt-8 border border-white/5 backdrop-blur-lg">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pricingTab === 'react' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            React / Static Apps
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pricingTab === 'wp' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Managed WordPress
          </button>
        </div>
      </div>

      {pricingTab === 'react' ? (
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto relative">
          {/* Card 1: Basic */}
          <div className="glass-panel rounded-3xl p-8 flex flex-col border border-white/5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]">
            <h3 className="text-xl font-bold text-slate-200">Developer</h3>
            <p className="text-slate-500 text-sm mt-1">Hobby & personal projects</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">৳0</span>
              <span className="text-slate-500 text-sm"> / forever</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-10 flex-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 1 Active Project
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 512 MB RAM limit
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> Git & ZIP Deployments
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> ITBengal free subdomain
              </li>
            </ul>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="w-full py-3.5 rounded-xl text-center text-sm font-bold border border-white/10 text-slate-200 hover:bg-white/5 transition-all duration-300"
            >
              Start For Free
            </Link>
          </div>

          {/* Card 2: Premium (Highlighted purple) */}
          <div className="relative rounded-3xl p-8 flex flex-col bg-gradient-to-b from-primary-600 to-indigo-950 border border-primary-500/30 shadow-glow-primary transform md:-translate-y-4 transition-all duration-300">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-accent-400 to-teal-500 px-3.5 py-1 rounded-full text-xs font-bold text-slate-950 uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white">Startup</h3>
            <p className="text-primary-200 text-sm mt-1">High-performance production app hosting</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">৳990</span>
              <span className="text-primary-200 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-primary-100 mb-10 flex-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> 5 Active Websites
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> 1 GB RAM / container
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> Custom domain mapping
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> Auto renew wildcard SSL
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> 24/7 Priority support
              </li>
            </ul>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="w-full py-3.5 rounded-xl text-center text-sm font-bold bg-white text-primary-950 hover:bg-slate-100 shadow-xl transition-all duration-300"
            >
              Upgrade to Startup
            </Link>
          </div>

          {/* Card 3: Business */}
          <div className="glass-panel rounded-3xl p-8 flex flex-col border border-white/5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]">
            <h3 className="text-xl font-bold text-slate-200">Enterprise</h3>
            <p className="text-slate-500 text-sm mt-1">Scalable multi-app infrastructure</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">৳2,990</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-10 flex-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 25 Active Projects
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 2 GB RAM / container
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> Priority build queues
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> Custom DNS management
              </li>
            </ul>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="w-full py-3.5 rounded-xl text-center text-sm font-bold border border-white/10 text-slate-200 hover:bg-white/5 transition-all duration-300"
            >
              Get Enterprise
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto relative">
          {/* WP Starter */}
          <div className="glass-panel rounded-3xl p-8 flex flex-col border border-white/5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]">
            <h3 className="text-xl font-bold text-slate-200">WP Starter</h3>
            <p className="text-slate-500 text-sm mt-1">Blogs, personal sites, & portfolios</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">৳1,500</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-10 flex-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 1 WordPress website
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> Isolated MariaDB database
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> 1 GB RAM & 10 GB SSD storage
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-400" /> Daily automated backups
              </li>
            </ul>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="w-full py-3.5 rounded-xl text-center text-sm font-bold border border-white/10 text-slate-200 hover:bg-white/5 transition-all duration-300"
            >
              Deploy WP Starter
            </Link>
          </div>

          {/* WP Professional (Highlighted) */}
          <div className="relative rounded-3xl p-8 flex flex-col bg-gradient-to-b from-primary-600 to-indigo-950 border border-primary-500/30 shadow-glow-primary transform md:-translate-y-4 transition-all duration-300">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-accent-400 to-teal-500 px-3.5 py-1 rounded-full text-xs font-bold text-slate-950 uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white">WP Professional</h3>
            <p className="text-primary-200 text-sm mt-1">For production corporate WordPress sites</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">৳4,900</span>
              <span className="text-primary-200 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-primary-100 mb-10 flex-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> 5 WordPress websites
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> Isolated MariaDB instances
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> 2 GB RAM & 30 GB SSD / site
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> Hourly automated DB backups
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-300 fill-accent-300/10" /> Priority custom domain SSL config
              </li>
            </ul>
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="w-full py-3.5 rounded-xl text-center text-sm font-bold bg-white text-primary-950 hover:bg-slate-100 shadow-xl transition-all duration-300"
            >
              Deploy WP Pro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
