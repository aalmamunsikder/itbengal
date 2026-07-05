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
    <section id="domains" className="py-20 px-6 max-w-7xl mx-auto border border-slate-200 bg-white text-slate-800 rounded-3xl shadow-xl mt-12 mb-16 relative">
      <div className="text-center mb-12">
        <span className="text-[#0052cc] text-sm font-bold uppercase tracking-wider">Domain Registration</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
          Search your Domain Name
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Bind your brand to premium domain extensions instantly with automated wildcard routing.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="mx-auto max-w-3xl bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center shadow-md mb-8">
        <div className="flex items-center pl-3 text-slate-400">
          <Globe className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Type your ideal domain name (e.g. mycompany)..."
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 px-3 py-3 text-sm md:text-base focus:ring-0"
        />
        <Link
          href={`https://dashboard.itbengal.xyz/domains`}
          className="bg-[#0052cc] hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm md:text-base transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>

      {/* Domain extensions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
        {badges.map((item, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-center flex flex-col justify-between hover:border-[#0052cc]/30 hover:bg-slate-100/50 transition-all cursor-pointer relative"
          >
            {item.badge && (
              <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <div>
              <span className="text-2xl font-extrabold text-slate-800">{item.ext}</span>
              <p className="text-slate-500 text-xs mt-1">Starting price</p>
            </div>
            <div className="mt-4 font-bold text-slate-900 text-base">{item.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
