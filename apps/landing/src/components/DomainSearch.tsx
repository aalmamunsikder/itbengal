'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Globe } from 'lucide-react';

export default function DomainSearch() {
  const [domain, setDomain] = useState('');

  const badges = [
    { ext: '.com', price: '৳1,250/yr', badge: 'Popular' },
    { ext: '.org', price: '৳1,550/yr', badge: 'Nonprofit' },
    { ext: '.xyz', price: '৳290/yr', badge: 'Tech' },
    { ext: '.net', price: '৳1,450/yr', badge: 'Network' },
  ];

  return (
    <section id="domains" className="py-24 px-6 max-w-7xl mx-auto border border-white/5 bg-[#0b0825]/40 text-white rounded-3xl mt-12 mb-16 relative overflow-hidden backdrop-blur-xl">
      {/* Background neon blur shapes */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#0066ff]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary-600/5 blur-[100px] pointer-events-none" />

      <div className="text-center mb-12 relative z-10">
        <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Domain Registration</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-2 mb-4">
          Search your Domain Name
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Secure your brand identity instantly. Map domains, edit DNS zones, and auto-provision wildcard SSL certificates directly.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative mx-auto max-w-3xl bg-slate-950/60 border border-white/10 rounded-2xl p-2.5 flex items-center shadow-2xl mb-12 z-10 backdrop-blur-md focus-within:border-primary-500/50 transition-colors">
        <div className="flex items-center pl-3 text-slate-500">
          <Globe className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Type your ideal domain name (e.g. mycompany)..."
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-white placeholder-slate-500 px-3 py-3 text-sm md:text-base focus:ring-0"
        />
        <Link
          href={`https://dashboard.itbengal.xyz/domains`}
          className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold px-8 py-3.5 rounded-xl text-sm md:text-base transition-all shadow-glow-primary active:scale-[0.98] flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>

      {/* Domain extensions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto relative z-10">
        {badges.map((item, idx) => (
          <div
            key={idx}
            className="border border-white/5 rounded-2xl p-5 bg-[#060415]/60 text-center flex flex-col justify-between hover:border-primary-500/20 hover:bg-[#060415]/80 transition-all cursor-pointer relative group"
          >
            {item.badge && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-primary-300 bg-primary-950/50 px-2 py-0.5 rounded-full border border-primary-500/20">
                {item.badge}
              </span>
            )}
            <div>
              <span className="text-2xl font-extrabold text-white group-hover:text-primary-400 transition-colors">{item.ext}</span>
              <p className="text-slate-500 text-xs mt-1">Starting price</p>
            </div>
            <div className="mt-5 font-bold text-slate-200 text-base">{item.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
