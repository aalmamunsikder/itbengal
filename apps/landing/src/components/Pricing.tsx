'use client';

import { useState } from 'react';
import Link from 'next/link';
// No unused imports

export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border border-white/5 bg-[#0b0825]/30 text-white rounded-3xl mt-12 mb-16 relative overflow-hidden backdrop-blur-xl">
      {/* Glow shapes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-900/5 blur-[150px] pointer-events-none" />

      <div className="text-center mb-16 relative z-10">
        <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Pricing Options</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-2 mb-4">
          Select Your Perfect Plan
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Choose a configuration optimized for your projects. Upgrade or scale your plans at any time.
        </p>

        {/* Tab Selector */}
        <div className="inline-flex rounded-xl bg-slate-950/60 p-1 mt-6 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              pricingTab === 'react' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            React / Static Apps
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              pricingTab === 'wp' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Managed WordPress
          </button>
        </div>
      </div>

      {pricingTab === 'react' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto relative z-10">
          {/* Card 1 */}
          <div className="border border-white/5 rounded-2xl p-6 bg-[#060415]/60 flex flex-col justify-between hover:border-white/10 hover:bg-[#060415]/80 transition-all group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">Developer</h3>
              <p className="text-slate-500 text-xs mt-1">Hobby & personal projects</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">৳0</span>
                <span className="text-slate-500 text-xs"> / forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8 border-t border-white/5 pt-4">
                <li className="flex items-center gap-1.5">✓ 1 Active project</li>
                <li className="flex items-center gap-1.5">✓ 512 MB RAM limit</li>
                <li className="flex items-center gap-1.5">✓ Git & ZIP Deployments</li>
                <li className="flex items-center gap-1.5">✓ ITBengal subdomain</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-white/10 text-white hover:bg-white/5 transition-all">
              Start Free
            </Link>
          </div>

          {/* Card 2: Highlighted Blue */}
          <div className="border-2 border-primary-500/40 rounded-2xl p-6 bg-gradient-to-b from-primary-600 to-indigo-950 text-white flex flex-col justify-between shadow-glow-primary relative transform lg:-translate-y-2 transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-accent-400 to-teal-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg border border-white/10">
              Best Seller
            </span>
            <div>
              <h3 className="text-lg font-bold">Startup</h3>
              <p className="text-blue-200 text-xs mt-1">Launch production React applications</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold">৳990</span>
                <span className="text-blue-200 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-blue-100 mb-8 border-t border-white/10 pt-4">
                <li className="flex items-center gap-1.5">✓ 5 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 1 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Custom domain mapping</li>
                <li className="flex items-center gap-1.5">✓ Auto Let's Encrypt SSL</li>
                <li className="flex items-center gap-1.5">✓ 24/7 Priority support</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold bg-white text-primary-950 hover:bg-slate-100 transition-all">
              Upgrade to Startup
            </Link>
          </div>

          {/* Card 3 */}
          <div className="border border-white/5 rounded-2xl p-6 bg-[#060415]/60 flex flex-col justify-between hover:border-white/10 hover:bg-[#060415]/80 transition-all group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">VPS Hosting</h3>
              <p className="text-slate-500 text-xs mt-1">Ideal for expanding scaling apps</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">৳1,990</span>
                <span className="text-slate-500 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8 border-t border-white/5 pt-4">
                <li className="flex items-center gap-1.5">✓ 15 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 1.5 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Fast build priority</li>
                <li className="flex items-center gap-1.5">✓ Auto Let's Encrypt SSL</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-white/10 text-white hover:bg-white/5 transition-all">
              Get VPS Hosting
            </Link>
          </div>

          {/* Card 4 */}
          <div className="border border-white/5 rounded-2xl p-6 bg-[#060415]/60 flex flex-col justify-between hover:border-white/10 hover:bg-[#060415]/80 transition-all group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">Dedicated</h3>
              <p className="text-slate-500 text-xs mt-1">SaaS enterprise infrastructure</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">৳2,990</span>
                <span className="text-slate-500 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8 border-t border-white/5 pt-4">
                <li className="flex items-center gap-1.5">✓ 25 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 2 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Priority queue + Support</li>
                <li className="flex items-center gap-1.5">✓ Custom nameservers</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-white/10 text-white hover:bg-white/5 transition-all">
              Get Dedicated
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto relative z-10">
          {/* WP Starter */}
          <div className="border border-white/5 rounded-2xl p-6 bg-[#060415]/60 flex flex-col justify-between hover:border-white/10 hover:bg-[#060415]/80 transition-all group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">WP Starter</h3>
              <p className="text-slate-400 text-xs mt-1">Blogs, personal sites, & portfolios</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">৳1,500</span>
                <span className="text-slate-500 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8 border-t border-white/5 pt-4">
                <li className="flex items-center gap-1.5">✓ 1 Managed WordPress site</li>
                <li className="flex items-center gap-1.5">✓ Isolated MariaDB container</li>
                <li className="flex items-center gap-1.5">✓ 1 GB RAM & 10 GB SSD</li>
                <li className="flex items-center gap-1.5">✓ Daily automated S3 backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-white/10 text-white hover:bg-white/5 transition-all">
              Deploy WP Starter
            </Link>
          </div>

          {/* WP Pro (Highlighted) */}
          <div className="border-2 border-primary-500/40 rounded-2xl p-6 bg-gradient-to-b from-primary-600 to-indigo-950 text-white flex flex-col justify-between shadow-glow-primary relative transform lg:-translate-y-2 transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg border border-white/10">
              Best Seller
            </span>
            <div>
              <h3 className="text-lg font-bold">WP Professional</h3>
              <p className="text-blue-200 text-xs mt-1">For production corporate WordPress sites</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold">৳4,900</span>
                <span className="text-blue-200 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-blue-100 mb-8 border-t border-white/10 pt-4">
                <li className="flex items-center gap-1.5">✓ 5 WordPress websites</li>
                <li className="flex items-center gap-1.5">✓ Isolated MariaDB instances</li>
                <li className="flex items-center gap-1.5">✓ 2 GB RAM & 30 GB SSD / site</li>
                <li className="flex items-center gap-1.5">✓ Hourly automated backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold bg-white text-primary-950 hover:bg-slate-100 transition-all">
              Deploy WP Pro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
