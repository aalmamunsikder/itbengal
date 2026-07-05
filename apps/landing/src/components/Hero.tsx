'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Globe } from 'lucide-react';

export default function Hero() {
  const [domainQuery, setDomainQuery] = useState('');

  const extensions = [
    { ext: '.com', price: '৳1,250/yr' },
    { ext: '.net', price: '৳1,450/yr' },
    { ext: '.org', price: '৳1,550/yr' },
    { ext: '.xyz', price: '৳290/yr' },
    { ext: '.info', price: '৳1,650/yr' },
  ];

  const partners = [
    { name: 'stripe' },
    { name: 'PHILIPS' },
    { name: 'adidas' },
    { name: 'w.monday' },
    { name: 'gusto' },
    { name: 'upwork' },
    { name: 'Figma' }
  ];

  return (
    <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 flex flex-col items-center text-center px-6 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />

      {/* Main Tagline */}
      <h1 className="relative max-w-5xl text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8 text-white">
        Protect Your <span className="text-primary-400">Brand</span> with <br />
        Trusted Domain <span className="bg-gradient-to-r from-fuchsia-400 via-primary-500 to-accent-400 bg-clip-text text-transparent">Security</span>
      </h1>

      {/* Subdescription */}
      <p className="relative max-w-2xl text-slate-400 font-medium md:text-lg mb-10 leading-relaxed">
        Secure your brand instantly. Register domains, check DNS availability, and host with isolated containers, automated backups, and free wildcard SSL.
      </p>

      {/* Domain Search Bar */}
      <div className="relative w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl backdrop-blur-xl mb-6">
        <div className="flex items-center pl-4 text-slate-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search for your ideal domain (e.g. mybrand.com)..."
          value={domainQuery}
          onChange={(e) => setDomainQuery(e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-500 px-3 py-3 text-sm md:text-base focus:ring-0"
        />
        <Link
          href={`https://dashboard.itbengal.xyz/domains`}
          className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-3 rounded-xl text-sm md:text-base transition-all duration-300 shadow-glow-primary active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
        >
          Check DNS
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Domain Extensions Row */}
      <div className="relative flex flex-wrap justify-center gap-4 mb-20 text-xs md:text-sm">
        {extensions.map((item, idx) => (
          <span
            key={idx}
            className="px-3.5 py-1.5 rounded-full border border-white/5 bg-white/[0.01] text-slate-400 flex items-center gap-1.5 font-medium hover:border-primary-500/20 hover:text-white transition-all cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-primary-400" />
            <span className="font-bold text-slate-300">{item.ext}</span>
            <span className="text-slate-500">{item.price}</span>
          </span>
        ))}
      </div>

      {/* Faded Partner Logos Row */}
      <div className="relative w-full max-w-6xl border-t border-b border-white/5 py-8 flex flex-wrap items-center justify-around gap-8 mb-20 select-none pointer-events-none opacity-40">
        {partners.map((partner, idx) => (
          <span
            key={idx}
            className="text-lg md:text-2xl font-bold tracking-widest uppercase font-mono text-slate-500"
          >
            {partner.name}
          </span>
        ))}
      </div>
    </section>
  );
}
