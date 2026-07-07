'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Database, HardDrive, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function WordPressHostingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    { title: 'Isolated Container Sandbox', desc: 'Separate Apache/PHP and MariaDB container runners ensure high security and memory boundaries.', icon: ShieldCheck },
    { title: 'NVMe SSD Storage', desc: 'NVMe-backed disk storage speeds up database read/writes and dashboard operations.', icon: HardDrive },
    { title: 'LiteSpeed Cache Engine', desc: 'Pre-configured caching speeds up static rendering for WordPress visitors.', icon: Zap },
    { title: 'Automated S3 Backups', desc: 'Hourly or daily database backups are compiled, encrypted, and saved to secure S3 storage.', icon: Database },
  ];

  const plans = [
    {
      name: 'WP Lite',
      desc: 'Blogs, portfolios & personal sites',
      monthlyPrice: 1500,
      yearlyPrice: 1200,
      specs: ['1 Managed WordPress site', 'Isolated MariaDB container', '1 GB RAM / container', '10 GB SSD space', 'Daily automated S3 backups'],
    },
    {
      name: 'WP Professional',
      desc: 'For production corporate WordPress sites',
      monthlyPrice: 4900,
      yearlyPrice: 3920,
      specs: ['5 WordPress websites', 'Isolated MariaDB instances', '2 GB RAM & 30 GB SSD / site', 'Hourly automated S3 backups', 'Priority support channels'],
      popular: true,
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
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Managed WordPress</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Fully Isolated WordPress Containers
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Experience the security of dedicated sandboxed environments combined with the speed of LiteSpeed caching. Build and scale your WordPress sites stress-free.
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

        {/* Key Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto mb-14">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
                  <IconComponent className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Pricing Cards */}
        <div className="mb-14">
          <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
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
                      Best Value
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
                    Deploy Container
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Isolation Details */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="space-y-3">
              <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Container Sandboxing</span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Why Isolated Docker Environments Matter
              </h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Traditional shared hosting places hundreds of sites on a single server config. If one site has a memory leak or security vulnerability, neighboring sites can suffer. 
              </p>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                At ITBengal, your Apache/PHP and MariaDB servers run in custom sandboxed containers, protecting database files and memory resources.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Sandboxing Checklist</h4>
              <ul className="space-y-2 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Dedicated virtual memory boundaries</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Independent php.ini resource limits</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Isolated database port routing</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Secure daily offsite S3 archives</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
