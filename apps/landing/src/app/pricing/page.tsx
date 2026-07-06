'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Cloud, Server, HelpCircle, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // React & Static Hosting prices
  const reactPlans = [
    {
      name: 'Developer',
      desc: 'Hobby & personal projects',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['1 Active project', '512 MB RAM limit', 'Git & ZIP Deployments', 'ITBengal subdomain'],
      cta: 'Start Free',
    },
    {
      name: 'Startup',
      desc: 'Launch production React applications',
      monthlyPrice: 990,
      yearlyPrice: 790,
      features: ['5 Active websites', '1 GB RAM / container', 'Custom domain mapping', 'Auto Let\'s Encrypt SSL', '24/7 Priority support'],
      cta: 'Upgrade to Startup',
      popular: true,
    },
    {
      name: 'VPS Hosting',
      desc: 'Ideal for expanding scaling apps',
      monthlyPrice: 1990,
      yearlyPrice: 1590,
      features: ['15 Active websites', '1.5 GB RAM / container', 'Fast build priority', 'Auto Let\'s Encrypt SSL', '24/7 Priority support'],
      cta: 'Get VPS Hosting',
    },
    {
      name: 'Dedicated',
      desc: 'SaaS enterprise infrastructure',
      monthlyPrice: 2990,
      yearlyPrice: 2390,
      features: ['25 Active websites', '2 GB RAM / container', 'Priority queue + Support', 'Custom nameservers', 'Dedicated IPv4 address'],
      cta: 'Get Dedicated',
    },
  ];

  // WordPress plans
  const wordpressPlans = [
    {
      name: 'WP Lite',
      desc: 'Blogs, personal sites, & portfolios',
      monthlyPrice: 1500,
      yearlyPrice: 1200,
      features: ['1 Managed WordPress site', 'Isolated MariaDB container', '1 GB RAM & 10 GB SSD', 'Daily automated S3 backups', 'Let\'s Encrypt SSL config'],
      cta: 'Deploy WP Lite',
    },
    {
      name: 'WP Professional',
      desc: 'For production corporate WordPress sites',
      monthlyPrice: 4900,
      yearlyPrice: 3920,
      features: ['5 WordPress websites', 'Isolated MariaDB instances', '2 GB RAM & 30 GB SSD / site', 'Hourly automated S3 backups', 'Free migration assistance'],
      cta: 'Deploy WP Pro',
      popular: true,
    },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return '৳0';
    return `৳${price.toLocaleString()}`;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      {/* Navigation */}
      <Header />

      {/* Main content body */}
      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Title Header */}
        <div className="text-center mb-10">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Pricing Plans</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Simple, Transparent Developer Cloud Pricing
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Choose a developer-centric layout that fits your scaling needs. Switch plans or billing cycles at any time.
          </p>

          {/* Monthly / Yearly Toggle */}
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

        {/* 1. React & Static Hosting Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
            <Server className="h-5 w-5 text-primaryBlue" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              React & Static App Hosting
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reactPlans.map((plan, idx) => {
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
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="https://dashboard.itbengal.xyz/register"
                    className={`w-full py-2.5 rounded-lg text-center text-xs font-bold transition-all ${
                      plan.popular
                        ? 'bg-[#0052cc] text-white hover:bg-blue-700'
                        : 'border border-slate-200 hover:bg-slate-50 text-[#0052cc]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Managed WordPress Section */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
            <Cloud className="h-5 w-5 text-primaryBlue" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Managed WordPress Container Stacks
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
            {wordpressPlans.map((plan, idx) => {
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
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="https://dashboard.itbengal.xyz/register"
                    className={`w-full py-2.5 rounded-lg text-center text-xs font-bold transition-all ${
                      plan.popular
                        ? 'bg-[#0052cc] text-white hover:bg-blue-700'
                        : 'border border-slate-200 hover:bg-slate-50 text-[#0052cc]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Detailed Comparison Matrix */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Compare Plan Features
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              Deep dive into resources and platform limits.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] md:text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-4">Resource Features</th>
                    <th className="p-4">Developer</th>
                    <th className="p-4">Startup</th>
                    <th className="p-4">VPS Hosting</th>
                    <th className="p-4">Dedicated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 text-slate-600">
                  <tr>
                    <td className="p-4 font-bold text-slate-800">Active Websites</td>
                    <td className="p-4">1</td>
                    <td className="p-4">5</td>
                    <td className="p-4">15</td>
                    <td className="p-4">25</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-800">Memory Allocation</td>
                    <td className="p-4">512 MB</td>
                    <td className="p-4">1 GB</td>
                    <td className="p-4">1.5 GB</td>
                    <td className="p-4">2 GB</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-800">Let's Encrypt SSL</td>
                    <td className="p-4">✗</td>
                    <td className="p-4">Auto-renew</td>
                    <td className="p-4">Auto-renew</td>
                    <td className="p-4">Auto-renew</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-800">Custom Domains</td>
                    <td className="p-4">✗</td>
                    <td className="p-4">Unlimited</td>
                    <td className="p-4">Unlimited</td>
                    <td className="p-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-800">Support Priority</td>
                    <td className="p-4">Standard</td>
                    <td className="p-4">High</td>
                    <td className="p-4">24/7 Priority</td>
                    <td className="p-4">Dedicated Slack/WhatsApp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales & Support Banner */}
        <div className="w-full rounded-xl bg-gradient-to-r from-[#002e8c] to-[#04081c] p-6 text-center text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="text-left space-y-1">
            <h3 className="text-lg font-extrabold flex items-center gap-1.5">
              <HelpCircle className="h-5 w-5 text-primaryBlue" />
              Not sure which plan matches your project?
            </h3>
            <p className="text-blue-100/70 text-[11px] md:text-xs">
              Chat directly with our support engineers. We will analyze your site database and size metrics for free.
            </p>
          </div>
          <a
            href="https://api.whatsapp.com/send/?phone=8801325875955"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0052cc] hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-lg text-xs transition-all shadow active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat on WhatsApp
          </a>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
