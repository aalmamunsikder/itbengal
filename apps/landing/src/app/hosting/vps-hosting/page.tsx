'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function VpsHostingPage() {
  const [location, setLocation] = useState<'bd' | 'sg' | 'de'>('bd');

  const getPlans = () => {
    switch (location) {
      case 'bd':
        return [
          { name: 'VPS Starter (BD)', price: '৳1,990', specs: ['2 vCPU AMD', '4 GB ECC RAM', '80 GB NVMe Storage', '1 Dedicated IPv4', 'BDIX Low Latency Routing'] },
          { name: 'VPS Professional (BD)', price: '৳3,990', specs: ['4 vCPU AMD', '8 GB ECC RAM', '160 GB NVMe Storage', '1 Dedicated IPv4', 'BDIX Low Latency Routing'], popular: true },
          { name: 'VPS Enterprise (BD)', price: '৳7,990', specs: ['8 vCPU AMD', '16 GB ECC RAM', '320 GB NVMe Storage', '1 Dedicated IPv4', 'BDIX Low Latency Routing'] },
        ];
      case 'sg':
        return [
          { name: 'VPS Starter (SG)', price: '৳1,490', specs: ['2 vCPU AMD', '4 GB ECC RAM', '80 GB NVMe Storage', '1 Dedicated IPv4', 'Singapore Exchange Route'] },
          { name: 'VPS Professional (SG)', price: '৳2,990', specs: ['4 vCPU AMD', '8 GB ECC RAM', '160 GB NVMe Storage', '1 Dedicated IPv4', 'Singapore Exchange Route'], popular: true },
          { name: 'VPS Enterprise (SG)', price: '৳6,490', specs: ['8 vCPU AMD', '16 GB ECC RAM', '320 GB NVMe Storage', '1 Dedicated IPv4', 'Singapore Exchange Route'] },
        ];
      case 'de':
      default:
        return [
          { name: 'VPS Starter (DE)', price: '৳1,490', specs: ['2 vCPU AMD', '4 GB ECC RAM', '80 GB NVMe Storage', '1 Dedicated IPv4', 'Europe Gateway Route'] },
          { name: 'VPS Professional (DE)', price: '৳2,990', specs: ['4 vCPU AMD', '8 GB ECC RAM', '160 GB NVMe Storage', '1 Dedicated IPv4', 'Europe Gateway Route'], popular: true },
          { name: 'VPS Enterprise (DE)', price: '৳6,490', specs: ['8 vCPU AMD', '16 GB ECC RAM', '320 GB NVMe Storage', '1 Dedicated IPv4', 'Europe Gateway Route'] },
        ];
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      <Header />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Segment */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Cloud Server</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            High-Performance Cloud VPS Hosting
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Eradicate IO bottlenecks with 100% NVMe storage, isolated vCPU/RAM allocation, and optional BDIX low-latency routing in Bangladesh.
          </p>

          {/* Location Tab Selector */}
          <div className="inline-flex rounded-xl bg-slate-200/60 p-0.5 mt-6 border border-slate-200">
            <button
              onClick={() => setLocation('bd')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                location === 'bd' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-850'
              }`}
            >
              Bangladesh (BDIX)
            </button>
            <button
              onClick={() => setLocation('sg')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                location === 'sg' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-850'
              }`}
            >
              Singapore
            </button>
            <button
              onClick={() => setLocation('de')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                location === 'de' ? 'bg-[#0052cc] text-white shadow-sm' : 'text-slate-550 hover:text-slate-850'
              }`}
            >
              Germany
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mb-14 max-w-5xl mx-auto grid gap-5 sm:grid-cols-3">
          {getPlans().map((plan, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-5 flex flex-col justify-between hover:shadow transition-all relative ${
                plan.popular ? 'border-[#0052cc] bg-white shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-4 -translate-y-1/2 bg-[#facc15] text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Best Seller
                </span>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
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
                Order VPS Server
              </Link>
            </div>
          ))}
        </div>

        {/* Technical Specs Summary */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto border-t border-slate-200 pt-10">
          <div className="space-y-2">
            <Cpu className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">AMD EPYC™ Performance</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Equipped with enterprise AMD Epyc processors, ensuring high-speed instruction cycles and solid multi-threading output.
            </p>
          </div>
          <div className="space-y-2">
            <HardDrive className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">Gen4 NVMe SSD Disks</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Read/write bottleneck prevention using fully redundant NVMe setups with over 3,000MB/s execution throughput speeds.
            </p>
          </div>
          <div className="space-y-2">
            <ShieldCheck className="h-6 w-6 text-[#0052cc]" />
            <h3 className="text-sm font-bold text-slate-800">SLA 99.9% Uptime</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Guaranteed redundant power routes and node configurations backing your business workloads around the clock.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
