'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-24 md:py-36 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent <span className="gradient-text">Pricing</span></h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">Choose a plan that fits your project. Upgrade, downgrade, or cancel at any time.</p>

        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-white/5 p-1.5 mt-8 border border-white/5">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pricingTab === 'react' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            React / Static Hosting
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pricingTab === 'wp' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            WordPress Hosting
          </button>
        </div>
      </div>

      {pricingTab === 'react' ? (
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Free */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border border-white/5 relative">
            <h3 className="text-lg font-bold text-slate-300">Developer</h3>
            <p className="text-slate-500 text-sm mt-1">For hobbyists and testing</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-slate-500 text-sm"> / forever</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
              <li className="flex items-center gap-2">✓ 1 Active Website</li>
              <li className="flex items-center gap-2">✓ 512 MB Ram Limit</li>
              <li className="flex items-center gap-2">✓ GitHub & ZIP Deployments</li>
              <li className="flex items-center gap-2">✓ Subdomain mapping</li>
            </ul>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-3 rounded-xl text-center text-sm font-bold border border-white/10 hover:bg-white/5 transition-all duration-300">
              Deploy Now
            </Link>
          </div>

          {/* Growth */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border-2 border-primary-500/40 relative shadow-glow-primary">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-lg font-bold text-white">Startup</h3>
            <p className="text-primary-300 text-sm mt-1">For launching startup apps</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold">$9</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-300 mb-8 flex-1">
              <li className="flex items-center gap-2">✓ 5 Active Websites</li>
              <li className="flex items-center gap-2">✓ 1 GB Ram Limit / app</li>
              <li className="flex items-center gap-2">✓ Custom Domain mapping</li>
              <li className="flex items-center gap-2">✓ Auto Let's Encrypt SSL</li>
              <li className="flex items-center gap-2">✓ 24/7 Server uptime</li>
            </ul>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-3 rounded-xl text-center text-sm font-bold bg-primary-600 hover:bg-primary-700 transition-all duration-300 text-white">
              Deploy Now
            </Link>
          </div>

          {/* Pro */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border border-white/5 relative">
            <h3 className="text-lg font-bold text-slate-300">Enterprise</h3>
            <p className="text-slate-500 text-sm mt-1">For high-traffic platforms</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold">$29</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
              <li className="flex items-center gap-2">✓ 25 Active Websites</li>
              <li className="flex items-center gap-2">✓ 2 GB Ram Limit / app</li>
              <li className="flex items-center gap-2">✓ Priority Build Queues</li>
              <li className="flex items-center gap-2">✓ Custom Domain + SSL</li>
              <li className="flex items-center gap-2">✓ Dedicated Support channel</li>
            </ul>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-3 rounded-xl text-center text-sm font-bold border border-white/10 hover:bg-white/5 transition-all duration-300">
              Contact Sales
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {/* WP Starter */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border border-white/5 relative">
            <h3 className="text-lg font-bold text-slate-300">WP Starter</h3>
            <p className="text-slate-500 text-sm mt-1">For personal blogs & portfolios</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold">$15</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-400 mb-8 flex-1">
              <li className="flex items-center gap-2">✓ 1 Managed WordPress Site</li>
              <li className="flex items-center gap-2">✓ Isolated MariaDB Container</li>
              <li className="flex items-center gap-2">✓ 1 GB RAM & 10 GB SSD</li>
              <li className="flex items-center gap-2">✓ Daily Automatic Backups</li>
              <li className="flex items-center gap-2">✓ SSL Certificates included</li>
            </ul>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-3 rounded-xl text-center text-sm font-bold border border-white/10 hover:bg-white/5 transition-all duration-300">
              Deploy Now
            </Link>
          </div>

          {/* WP Professional */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border-2 border-primary-500/40 relative shadow-glow-primary">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-lg font-bold text-white">WP Professional</h3>
            <p className="text-primary-300 text-sm mt-1">For production business sites</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold">$49</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-300 mb-8 flex-1">
              <li className="flex items-center gap-2">✓ 5 Managed WordPress Sites</li>
              <li className="flex items-center gap-2">✓ Isolated MariaDB Containers</li>
              <li className="flex items-center gap-2">✓ 2 GB RAM & 30 GB SSD / site</li>
              <li className="flex items-center gap-2">✓ Hourly Database Backups</li>
              <li className="flex items-center gap-2">✓ Custom Domain + SSL Support</li>
            </ul>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-3 rounded-xl text-center text-sm font-bold bg-primary-600 hover:bg-primary-700 transition-all duration-300 text-white">
              Deploy Now
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
