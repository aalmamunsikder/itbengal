'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ResellerHostingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter Reseller',
      desc: 'Perfect for starting hosters',
      monthlyPrice: 2500,
      yearlyPrice: 2000,
      specs: [
        '50 GB NVMe SSD Storage',
        '1,000 GB Premium Bandwidth',
        '20 Whitelabel cPanel Accounts',
        '1 GB RAM / cPanel account',
        '1 Core CPU / cPanel account',
        'Private Nameservers support',
      ],
    },
    {
      name: 'Standard Reseller',
      desc: 'Most popular for small agencies',
      monthlyPrice: 4000,
      yearlyPrice: 3200,
      specs: [
        '100 GB NVMe SSD Storage',
        'Unlimited Premium Bandwidth',
        '50 Whitelabel cPanel Accounts',
        '1.5 GB RAM / cPanel account',
        '1.5 Core CPU / cPanel account',
        'Private Nameservers support',
      ],
      popular: true,
    },
    {
      name: 'Agency Reseller',
      desc: 'For large agencies & web developers',
      monthlyPrice: 5000,
      yearlyPrice: 4000,
      specs: [
        '250 GB NVMe SSD Storage',
        'Unlimited Premium Bandwidth',
        '100 Whitelabel cPanel Accounts',
        '2 GB RAM / cPanel account',
        '2 Core CPU / cPanel account',
        'Private Nameservers support',
      ],
    },
  ];

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      <Header />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Segment */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">White-label Hosting</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Launch Your Brand with Reseller Hosting
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Sell hosting services under your own logo, brands, and private name servers. High-performance white-label cPanel environments configured in minutes.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/60 p-0.5 mt-6 border border-slate-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingPeriod === 'monthly' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-850'
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-850'
              }`}
            >
              Billed Yearly
              <span className="bg-[#facc15] text-slate-900 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mb-14 grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, idx) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            return (
              <div
                key={idx}
                className={`border rounded-xl p-5 flex flex-col justify-between hover:shadow transition-all relative ${
                  plan.popular ? 'border-[#0052cc] bg-white shadow-sm' : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-4 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">{plan.desc}</p>
                  <div className="my-4">
                    <span className="text-2xl font-extrabold text-[#0052cc]">{formatPrice(price)}</span>
                    <span className="text-slate-400 text-[10px]"> / month</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-500 mb-6 border-t border-slate-100 pt-3">
                    {plan.specs.map((spec, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="https://dashboard.itbengal.xyz/register"
                  className={`w-full py-2.5 rounded-lg text-center text-xs font-bold transition-all ${
                    plan.popular
                      ? 'bg-[#0052cc] text-white hover:bg-blue-700'
                      : 'border border-slate-200 hover:bg-slate-55 text-[#0052cc]'
                  }`}
                >
                  Start Reselling
                </Link>
              </div>
            );
          })}
        </div>

        {/* Global Datacenter details */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="space-y-3">
              <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Global Nodes</span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Our Strategic Global Datacenters
              </h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Host your reseller clients on optimized servers situated globally. Low latency routes via Dhaka, Singapore, USA, and Central Europe keep websites responsive.
              </p>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-start gap-2">
                <Globe className="h-4 w-4 text-[#0052cc] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-800">Dhaka, BD</h4>
                  <p className="text-[9px] text-slate-400">Local BDIX routes</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-start gap-2">
                <Globe className="h-4 w-4 text-[#0052cc] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-800">Singapore</h4>
                  <p className="text-[9px] text-slate-400">Asia Pacific Hub</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-start gap-2">
                <Globe className="h-4 w-4 text-[#0052cc] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-800">Germany</h4>
                  <p className="text-[9px] text-slate-400">GDPR Secure Nodes</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex items-start gap-2">
                <Globe className="h-4 w-4 text-[#0052cc] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-800">Ashburn, USA</h4>
                  <p className="text-[9px] text-slate-400">East Coast Gateway</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
