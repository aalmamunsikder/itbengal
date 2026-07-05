'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-12 px-6 max-w-7xl mx-auto border border-slate-100 bg-slate-50 text-slate-800 rounded-2xl mt-8 mb-8 relative">
      <div className="text-center mb-8 relative">
        <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Pricing Options</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 mb-2 tracking-tight">
          Select Your Perfect Plan
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm leading-relaxed">
          Choose a configuration optimized for your projects. Upgrade or scale your plans at any time.
        </p>

        {/* Tab Selector */}
        <div className="inline-flex rounded-xl bg-slate-200/60 p-0.5 mt-4 border border-slate-200">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pricingTab === 'react' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            React / Static Apps
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pricingTab === 'wp' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            Managed WordPress
          </button>
        </div>
      </div>

      {pricingTab === 'react' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow transition-all">
            <div>
              <h3 className="text-base font-bold text-slate-900">Developer</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Hobby & personal projects</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-[#0052cc]">৳0</span>
                <span className="text-slate-400 text-[10px]"> / forever</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-500 mb-6 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1">✓ 1 Active project</li>
                <li className="flex items-center gap-1">✓ 512 MB RAM limit</li>
                <li className="flex items-center gap-1">✓ Git & ZIP Deployments</li>
                <li className="flex items-center gap-1">✓ ITBengal subdomain</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Start Free
            </Link>
          </div>

          {/* Card 2: Highlighted Blue */}
          <div className="border border-[#0052cc] rounded-xl p-5 bg-[#0052cc] text-white flex flex-col justify-between shadow relative transform lg:-translate-y-1 transition-all">
            <span className="absolute top-0 right-4 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Best Seller
            </span>
            <div>
              <h3 className="text-base font-bold">Startup</h3>
              <p className="text-blue-100/70 text-[10px] mt-0.5">Launch production React applications</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold">৳990</span>
                <span className="text-blue-100/70 text-[10px]"> / month</span>
              </div>
              <ul className="space-y-2 text-[11px] text-blue-50 mb-6 border-t border-blue-400/30 pt-3">
                <li className="flex items-center gap-1">✓ 5 Active websites</li>
                <li className="flex items-center gap-1">✓ 1 GB RAM / container</li>
                <li className="flex items-center gap-1">✓ Custom domain mapping</li>
                <li className="flex items-center gap-1">✓ Auto Let's Encrypt SSL</li>
                <li className="flex items-center gap-1">✓ 24/7 Priority support</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold bg-white text-[#0052cc] hover:bg-slate-100 transition-all">
              Upgrade to Startup
            </Link>
          </div>

          {/* Card 3 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow transition-all">
            <div>
              <h3 className="text-base font-bold text-slate-900">VPS Hosting</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Ideal for expanding scaling apps</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-[#0052cc]">৳1,990</span>
                <span className="text-slate-400 text-[10px]"> / month</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-500 mb-6 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1">✓ 15 Active websites</li>
                <li className="flex items-center gap-1">✓ 1.5 GB RAM / container</li>
                <li className="flex items-center gap-1">✓ Fast build priority</li>
                <li className="flex items-center gap-1">✓ Auto Let's Encrypt SSL</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Get VPS Hosting
            </Link>
          </div>

          {/* Card 4 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow transition-all">
            <div>
              <h3 className="text-base font-bold text-slate-900">Dedicated</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">SaaS enterprise infrastructure</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-[#0052cc]">৳2,990</span>
                <span className="text-slate-400 text-[10px]"> / month</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-500 mb-6 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1">✓ 25 Active websites</li>
                <li className="flex items-center gap-1">✓ 2 GB RAM / container</li>
                <li className="flex items-center gap-1">✓ Priority queue + Support</li>
                <li className="flex items-center gap-1">✓ Custom nameservers</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Get Dedicated
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* WP Starter */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow transition-all">
            <div>
              <h3 className="text-base font-bold text-slate-900">WP Starter</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Blogs, personal sites, & portfolios</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-[#0052cc]">৳1,500</span>
                <span className="text-slate-400 text-[10px]"> / month</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-500 mb-6 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1">✓ 1 Managed WordPress site</li>
                <li className="flex items-center gap-1">✓ Isolated MariaDB container</li>
                <li className="flex items-center gap-1">✓ 1 GB RAM & 10 GB SSD</li>
                <li className="flex items-center gap-1">✓ Daily automated S3 backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Deploy WP Starter
            </Link>
          </div>

          {/* WP Pro (Highlighted) */}
          <div className="border border-[#0052cc] rounded-xl p-5 bg-[#0052cc] text-white flex flex-col justify-between shadow relative transform lg:-translate-y-1 transition-all">
            <span className="absolute top-0 right-4 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Best Seller
            </span>
            <div>
              <h3 className="text-base font-bold">WP Professional</h3>
              <p className="text-blue-100/70 text-[10px] mt-0.5">For production corporate WordPress sites</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold">৳4,900</span>
                <span className="text-blue-100/70 text-[10px]"> / month</span>
              </div>
              <ul className="space-y-2 text-[11px] text-blue-50 mb-6 border-t border-blue-400/30 pt-3">
                <li className="flex items-center gap-1">✓ 5 WordPress websites</li>
                <li className="flex items-center gap-1">✓ Isolated MariaDB instances</li>
                <li className="flex items-center gap-1">✓ 2 GB RAM & 30 GB SSD / site</li>
                <li className="flex items-center gap-1">✓ Hourly automated backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2 rounded-lg text-center text-xs font-bold bg-white text-[#0052cc] hover:bg-slate-100 transition-all">
              Deploy WP Pro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
