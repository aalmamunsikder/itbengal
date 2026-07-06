'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Cpu } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NodejsHostingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    { title: 'Multiple Node.js Versions', desc: 'Choose between Node.js 16 LTS, 18 LTS, 20 LTS, or 22 LTS dynamically in your panel.' },
    { title: 'PM2 Process Manager', desc: 'Auto-restart processes and keep your services online with built-in PM2 daemon controllers.' },
    { title: 'NPM & Yarn Packages', desc: 'Full package management workflow support including scoped packages and lockfiles.' },
    { title: 'Git Auto Deployments', desc: 'Bind your repository webhooks to automatically trigger rebuilds upon pushing code.' },
  ];

  const plans = [
    {
      name: 'Starter',
      desc: 'For small projects & web APIs',
      monthlyPrice: 290,
      yearlyPrice: 232,
      specs: ['2 CPU Cores', '1 GB RAM Allocation', '10 GB NVMe SSD Storage', '1 Node.js Application', 'NPM Package Support'],
    },
    {
      name: 'Pro',
      desc: 'For growing applications',
      monthlyPrice: 490,
      yearlyPrice: 392,
      specs: ['3 CPU Cores', '2 GB RAM Allocation', '20 GB NVMe SSD Storage', '2 Node.js Applications', 'Git Hook Deployments'],
      popular: true,
    },
    {
      name: 'Developer',
      desc: 'For multiple server systems',
      monthlyPrice: 790,
      yearlyPrice: 632,
      specs: ['4 CPU Cores', '3 GB RAM Allocation', '30 GB NVMe SSD Storage', '3 Node.js Applications', 'Automated Daily Backups'],
    },
    {
      name: 'Business',
      desc: 'For production microservices',
      monthlyPrice: 990,
      yearlyPrice: 792,
      specs: ['6 CPU Cores', '4 GB RAM Allocation', '80 GB NVMe SSD Storage', '10 Node.js Applications', 'Dedicated support channels'],
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
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Application Cloud</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            High-Performance Node.js Hosting
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Run your Node.js APIs, web sockets, and Express applications with fully isolated system memory, auto-restarts, and Git integrations.
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
          {features.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="mb-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
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
                      Most Popular
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
                    Deploy Node App
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Setup Walkthrough */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              One-Click Node.js App Setup
            </h2>
            <p className="text-slate-500 text-xs">
              Configure and launch your applications using our visual control panel in under 60 seconds.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] text-slate-400 text-left">
              <div className="flex items-center gap-1.5 mb-3 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-500 ml-2">NodeJS Setup</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-500">// Setup NodeJS Application</p>
                <p><span className="text-white">App Version:</span> Node.js 20.17.0 LTS</p>
                <p><span className="text-white">App Mode:</span> Production</p>
                <p><span className="text-white">App Root:</span> /home/itbengal/nodeapp</p>
                <p><span className="text-white">Start File:</span> app.js</p>
                <p className="text-slate-500">// Virtualenv activation code</p>
                <p className="text-emerald-450 text-emerald-450">source /home/itbengal/nodevenv/20/bin/activate</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#0052cc] font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Select Version & Mode</h4>
                  <p className="text-slate-500 text-[11px]">Choose between Node.js 16, 18, 20, or 22 and set environment variables dynamically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#0052cc] font-bold shrink-0">2</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">PM2 Process control</h4>
                  <p className="text-slate-550 text-slate-500 text-[11px]">Manage start, stop, restart, and monitoring metrics through PM2 commands instantly.</p>
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
