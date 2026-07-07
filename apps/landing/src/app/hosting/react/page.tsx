'use client';

import Link from 'next/link';
import { CheckCircle2, Zap, GitBranch, Globe, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReactHostingPage() {
  const features = [
    { title: 'Git Push Deployment', desc: 'Connect your GitHub repository and trigger automatic production builds on git push.', icon: GitBranch },
    { title: 'Global Edge CDN', desc: 'Your static assets are cached globally at low-latency edge nodes for instant rendering.', icon: Globe },
    { title: 'Turborepo Fast Builds', desc: 'Optimized workspace pipeline execution saves build minutes on every commit.', icon: Zap },
    { title: 'Let\'s Encrypt TLS', desc: 'Free wildcard SSL certificates automatically provisioned and renewed.', icon: Lock },
  ];

  const plans = [
    { name: 'Developer', desc: 'Hobby & personal projects', price: '৳0', features: ['1 Active project', '512 MB RAM limit', 'Git push integration', 'ITBengal subdomain'] },
    { name: 'Startup', desc: 'Production React apps', price: '৳990', features: ['5 Active websites', '1 GB RAM / container', 'Custom domain mapping', 'Auto-renew Let\'s Encrypt SSL'], popular: true },
    { name: 'VPS Hosting', desc: 'Expanding scaling apps', price: '৳1,990', features: ['15 Active websites', '1.5 GB RAM / container', 'Priority build queues', 'Auto Let\'s Encrypt SSL'] },
    { name: 'Dedicated', desc: 'SaaS enterprise networks', price: '৳2,990', features: ['25 Active websites', '2 GB RAM / container', 'Priority queue + Support', 'Custom nameservers'] },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      <Header />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Segment */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">React Static Cloud</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Ultra-Fast Hosting for React & Static Apps
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Deploy your React, Next.js, Vite, and static HTML projects instantly from your Git repository. Start free and scale as your traffic grows.
          </p>
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
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Select Your React Plan
            </h2>
            <p className="text-slate-500 text-xs">
              Flexible prices and scaling limits built for modern frontend developers.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
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
                    <span className="text-2xl font-extrabold text-[#0052cc]">{plan.price}</span>
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
                      : 'border border-slate-200 hover:bg-slate-55 text-[#0052cc]'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Showcase */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm max-w-4xl mx-auto text-center">
          <span className="text-primaryBlue text-[10px] font-bold uppercase tracking-wider">Development Pipeline</span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mt-1 mb-4">
            Push code, we handle the rest
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="h-4.5 w-4.5 rounded-full bg-blue-50 text-[#0052cc] text-[10px] font-bold flex items-center justify-center">1</span>
                Git Commit & Push
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Work locally and push commits to your repository as you normally do.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="h-4.5 w-4.5 rounded-full bg-blue-50 text-[#0052cc] text-[10px] font-bold flex items-center justify-center">2</span>
                Automated Edge Build
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Our Turborepo runner detects the push, builds assets, and runs optimization scripts.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="h-4.5 w-4.5 rounded-full bg-blue-50 text-[#0052cc] text-[10px] font-bold flex items-center justify-center">3</span>
                Instant Edge Live
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Your static files are updated with zero downtime, secured by auto Let's Encrypt SSL.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
