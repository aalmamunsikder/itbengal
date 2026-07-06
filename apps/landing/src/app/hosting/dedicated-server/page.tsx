'use client';

import Link from 'next/link';
import { CheckCircle2, Server, Cpu, HardDrive } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DedicatedServerPage() {
  const plans = [
    {
      name: 'Starter Ryzen',
      cpu: 'AMD Ryzen™ 5 3600',
      price: '৳11,999',
      specs: ['6 Cores / 12 Threads', '32 GB DDR4 RAM', '1 TB NVMe Storage', '1 Gbps BDIX Network Port', 'Free Hardware Setup'],
    },
    {
      name: 'Pro Ryzen',
      cpu: 'AMD Ryzen™ 7 8700GE',
      price: '৳16,650',
      specs: ['8 Cores / 16 Threads', '64 GB DDR5 ECC RAM', '2 TB NVMe Storage', '1 Gbps BDIX Network Port', 'Free Hardware Setup'],
      popular: true,
    },
    {
      name: 'Enterprise Xeon',
      cpu: 'Intel® Xeon® Gold 5412U',
      price: '৳33,525',
      specs: ['24 Cores / 48 Threads', '128 GB DDR5 ECC RAM', '3.75 TB NVMe Storage', '1 Gbps BDIX Network Port', 'Dedicated Support Hotline'],
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      <Header />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Segment */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Bare Metal Infrastructure</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Bare Metal Dedicated Servers in Bangladesh
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Gain full hardware isolation, root access levels, and peak local processing speeds with dedicated AMD Ryzen™ and Intel® Xeon® host configurations.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto mb-14">
          {plans.map((plan, idx) => (
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
                <p className="text-[#0052cc] text-[10px] font-bold mt-0.5">{plan.cpu}</p>
                <div className="my-4">
                  <span className="text-2xl font-extrabold text-[#0052cc]">{plan.price}</span>
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
                Configure Server
              </Link>
            </div>
          ))}
        </div>

        {/* Technical Features */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto border-t border-slate-200 pt-10">
          <div className="space-y-2">
            <Server className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">100% Unshared Resources</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              No virtualization layers or neighboring site resource locks. The CPU, memory channels, and NVMe controller are 100% yours.
            </p>
          </div>
          <div className="space-y-2">
            <Cpu className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">BDIX 1Gbps Network Port</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Unmatched network routing optimized for Bangladeshi visitors with high-speed BDIX local exchange connectivity ports.
            </p>
          </div>
          <div className="space-y-2">
            <HardDrive className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">Enterprise Anti-DDoS</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Always-on hardware mitigation filters malicious web traffic spikes at our data center edges before hitting your server.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
