'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function Pricing() {
  const [pricingTab, setPricingTab] = useState<'react' | 'wp'>('react');

  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-100 bg-slate-50 text-slate-800 rounded-3xl mt-12 mb-16 relative">
      <div className="text-center mb-16 relative">
        <span className="text-primaryBlue text-sm font-bold uppercase tracking-wider">Pricing Options</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
          Select Your Perfect Plan
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
          Choose a configuration optimized for your projects. Upgrade or scale your plans at any time.
        </p>

        {/* Tab Selector */}
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 mt-6 border border-slate-200">
          <button
            onClick={() => setPricingTab('react')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              pricingTab === 'react' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            React / Static Apps
          </button>
          <button
            onClick={() => setPricingTab('wp')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              pricingTab === 'wp' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Managed WordPress
          </button>
        </div>
      </div>

      {pricingTab === 'react' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Developer</h3>
              <p className="text-slate-400 text-xs mt-1">Hobby & personal projects</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-[#0052cc]">৳0</span>
                <span className="text-slate-400 text-xs"> / forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-500 mb-8 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-1.5">✓ 1 Active project</li>
                <li className="flex items-center gap-1.5">✓ 512 MB RAM limit</li>
                <li className="flex items-center gap-1.5">✓ Git & ZIP Deployments</li>
                <li className="flex items-center gap-1.5">✓ ITBengal subdomain</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Start Free
            </Link>
          </div>

          {/* Card 2: Highlighted Blue */}
          <div className="border-2 border-[#0052cc] rounded-2xl p-6 bg-[#0052cc] text-white flex flex-col justify-between shadow-xl relative transform lg:-translate-y-2 transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Best Seller
            </span>
            <div>
              <h3 className="text-lg font-bold">Startup</h3>
              <p className="text-blue-100/70 text-xs mt-1">Launch production React applications</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold">৳990</span>
                <span className="text-blue-100/70 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-blue-50 mb-8 border-t border-blue-400/30 pt-4">
                <li className="flex items-center gap-1.5">✓ 5 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 1 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Custom domain mapping</li>
                <li className="flex items-center gap-1.5">✓ Auto Let's Encrypt SSL</li>
                <li className="flex items-center gap-1.5">✓ 24/7 Priority support</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold bg-white text-[#0052cc] hover:bg-slate-100 transition-all">
              Upgrade to Startup
            </Link>
          </div>

          {/* Card 3 */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900">VPS Hosting</h3>
              <p className="text-slate-400 text-xs mt-1">Ideal for expanding scaling apps</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-[#0052cc]">৳1,990</span>
                <span className="text-slate-400 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-500 mb-8 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-1.5">✓ 15 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 1.5 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Fast build priority</li>
                <li className="flex items-center gap-1.5">✓ Auto Let's Encrypt SSL</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Get VPS Hosting
            </Link>
          </div>

          {/* Card 4 */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Dedicated</h3>
              <p className="text-slate-400 text-xs mt-1">SaaS enterprise infrastructure</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-[#0052cc]">৳2,990</span>
                <span className="text-slate-400 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-500 mb-8 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-1.5">✓ 25 Active websites</li>
                <li className="flex items-center gap-1.5">✓ 2 GB RAM / container</li>
                <li className="flex items-center gap-1.5">✓ Priority queue + Support</li>
                <li className="flex items-center gap-1.5">✓ Custom nameservers</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Get Dedicated
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {/* WP Starter */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900">WP Starter</h3>
              <p className="text-slate-400 text-xs mt-1">Blogs, personal sites, & portfolios</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-[#0052cc]">৳1,500</span>
                <span className="text-slate-400 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-500 mb-8 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-1.5">✓ 1 Managed WordPress site</li>
                <li className="flex items-center gap-1.5">✓ Isolated MariaDB container</li>
                <li className="flex items-center gap-1.5">✓ 1 GB RAM & 10 GB SSD</li>
                <li className="flex items-center gap-1.5">✓ Daily automated S3 backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all text-[#0052cc]">
              Deploy WP Starter
            </Link>
          </div>

          {/* WP Pro (Highlighted) */}
          <div className="border-2 border-[#0052cc] rounded-2xl p-6 bg-[#0052cc] text-white flex flex-col justify-between shadow-xl relative transform lg:-translate-y-2 transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Best Seller
            </span>
            <div>
              <h3 className="text-lg font-bold">WP Professional</h3>
              <p className="text-blue-100/70 text-xs mt-1">For production corporate WordPress sites</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold">৳4,900</span>
                <span className="text-blue-100/70 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-blue-50 mb-8 border-t border-blue-400/30 pt-4">
                <li className="flex items-center gap-1.5">✓ 5 WordPress websites</li>
                <li className="flex items-center gap-1.5">✓ Isolated MariaDB instances</li>
                <li className="flex items-center gap-1.5">✓ 2 GB RAM & 30 GB SSD / site</li>
                <li className="flex items-center gap-1.5">✓ Hourly automated backups</li>
              </ul>
            </div>
            <Link href="https://dashboard.itbengal.xyz/register" className="w-full py-2.5 rounded-lg text-center text-xs font-bold bg-white text-[#0052cc] hover:bg-slate-100 transition-all">
              Deploy WP Pro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
