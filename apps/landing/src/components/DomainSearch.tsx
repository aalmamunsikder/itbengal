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
    <section id="domains" className="py-10 px-6 max-w-7xl mx-auto border border-slate-100 bg-white text-slate-800 rounded-2xl shadow-md mt-6 mb-8 relative">
      <div className="text-center mb-6">
        <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Domain Registration</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 mb-2 tracking-tight">
          Search your Domain Name
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm leading-relaxed">
          Bind your brand to premium domain extensions instantly with automated wildcard routing.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="mx-auto max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center shadow-sm mb-6">
        <div className="flex items-center pl-2 text-slate-400">
          <Globe className="h-4.5 w-4.5" />
        </div>
        <input
          type="text"
          placeholder="Type your ideal domain name (e.g. mycompany)..."
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 px-3 py-2 text-xs md:text-sm focus:ring-0"
        />
        <Link
          href={`https://dashboard.itbengal.xyz/domains`}
          className="bg-[#0052cc] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs md:text-sm transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </Link>
      </div>

      {/* Domain extensions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl mx-auto">
        {badges.map((item, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-xl p-3.5 bg-slate-55 text-center flex flex-col justify-between hover:border-[#0052cc]/30 hover:bg-slate-50 transition-all cursor-pointer relative"
          >
            {item.badge && (
              <span className="absolute top-1.5 right-1.5 text-[8px] font-bold uppercase tracking-wider text-[#0052cc] bg-blue-50 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <div>
              <span className="text-xl font-extrabold text-slate-800">{item.ext}</span>
              <p className="text-slate-400 text-[10px] mt-0.5">Starting price</p>
            </div>
            <div className="mt-2 font-bold text-slate-900 text-sm">{item.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
