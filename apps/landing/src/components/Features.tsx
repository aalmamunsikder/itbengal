'use client';

import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Features() {
  const migrations = [
    { title: 'Free Website Migration', desc: 'Our technical experts migrate your sites with zero downtime.' },
    { title: 'Database Export & Import', desc: 'Automated transfers for WordPress PHP & MariaDB configurations.' },
    { title: 'Files & Assets Transfer', desc: 'Secure compression and extraction for all media archives.' },
    { title: 'DNS Settings Redirect', desc: 'Wildcard domain configurations matched to new nameservers.' },
  ];

  const tools = [
    { name: 'WordPress', icon: '📝' },
    { name: 'Cloudflare', icon: '☁️' },
    { name: 'LiteSpeed', icon: '⚡' },
    { name: 'PHP 8.2', icon: '🐘' },
    { name: 'MariaDB', icon: '💾' },
    { name: 'NodeJS', icon: '🟢' },
  ];

  return (
    <div className="w-full bg-white py-12 text-slate-800 space-y-16">
      {/* 1. Moving From Another Host? */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 lg:grid-cols-2 items-center">
        {/* Node diagram illustration on left */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-blue-50/50 blur-2xl rounded-full pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 w-full max-w-sm shadow-sm flex flex-col items-center">
            {/* Center Node */}
            <div className="h-14 w-14 rounded-full bg-[#0052cc] flex items-center justify-center text-white shadow-md text-xl font-extrabold select-none animate-pulse-soft">
              H
            </div>
            {/* Surrounding floating nodes */}
            <div className="grid grid-cols-3 gap-4 mt-6 w-full">
              {['Git Repo', 'ZIP Uploader', 'PHP Server', 'Apache', 'MySQL DB', 'Nginx'].map((label, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-1.5 bg-white text-center text-[10px] font-bold text-slate-500 shadow-sm">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text content on right */}
        <div className="space-y-4">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Zero Downtime Migration</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Moving From Another Host?
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Switch to HOSTNIN stress-free. Our automated systems and manual operators migrate your static files, databases, and SSL configs in minutes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {migrations.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs md:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-1.5 bg-[#0052cc] hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm"
            >
              Start Free Migration <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Lightning Fast Loading Speed */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 lg:grid-cols-2 items-center">
        {/* Text content on left */}
        <div className="space-y-4 lg:order-1">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Optimized Speed Engine</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Lightning Fast Loading Speed
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Our container stack leverages SSD storage, Cloudflare edge caching, and lightweight Alpine images to achieve up to 10x faster execution than traditional servers.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {['Superfast SSD Disks', 'LiteSpeed Cache Engine', 'PHP SHORTINIT optimization', 'Alpine runner isolation'].map((label, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-1.5 bg-[#0052cc] hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm"
            >
              Deploy Your Website <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Floating badge circles on right */}
        <div className="relative flex justify-center lg:order-2">
          <div className="absolute inset-0 bg-blue-50/50 blur-2xl rounded-full pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 w-full max-w-sm shadow-sm flex flex-col items-center">
            {/* Center Node */}
            <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm text-2xl font-extrabold select-none mb-4">
              ⚙️
            </div>
            {/* Round Badge Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {tools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-2 bg-white shadow-sm font-bold text-xs text-slate-600">
                  <span className="text-lg">{tool.icon}</span>
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. User-Friendly Control Panel */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 lg:grid-cols-2 items-center">
        {/* Text details on left */}
        <div className="space-y-4">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Dashboard Portal</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            User-Friendly Control Panel
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Manage your websites, domains, S3 database backups, container restarts, and real-time logs in one clean dashboard without opening terminal command lines.
          </p>

          <div className="space-y-3">
            {[
              { title: 'Manage With Ease', desc: 'Perform container restarts, backups, and deletes in one click.' },
              { title: 'Instant WordPress Installer', desc: 'Deploy Php-Apache & MariaDB isolated environments in seconds.' },
              { title: 'Auto Let\'s Encrypt SSL', desc: 'Bind custom domains with automated wildcard certificates.' },
            ].map((item, idx) => (
              <div key={idx} className="border-l-2 border-[#0052cc] pl-3 space-y-0.5">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">{item.title}</h4>
                <p className="text-slate-400 text-[11px] md:text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup Laptop Panel on right */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-blue-50/50 blur-2xl rounded-full pointer-events-none" />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-md overflow-hidden group">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-955 p-3.5 text-left bg-slate-950">
              {/* Header circles */}
              <div className="flex items-center gap-1.5 mb-3 select-none">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[9px] text-slate-500 ml-2 font-mono">dashboard.itbengal.xyz/wordpress</span>
              </div>
              {/* Mockup layout */}
              <div className="space-y-2.5 font-mono text-[11px] text-slate-400">
                <p className="text-slate-500">// Managed WordPress Container State</p>
                <div className="border border-slate-850 rounded-lg p-2.5 bg-slate-900 flex justify-between items-center border-slate-800">
                  <div>
                    <span className="font-bold text-white text-xs">wp-myblog-prod</span>
                    <p className="text-[9px] text-slate-500">itbengal-wp-stack:v1</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">RUNNING</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-800 rounded p-1.5 text-center bg-slate-900">
                    <p className="text-[9px] text-slate-500">CPU Usage</p>
                    <span className="font-bold text-white text-xs">1.2%</span>
                  </div>
                  <div className="border border-slate-800 rounded p-1.5 text-center bg-slate-900">
                    <p className="text-[9px] text-slate-500">RAM Limit</p>
                    <span className="font-bold text-white text-xs">256MB</span>
                  </div>
                  <div className="border border-slate-800 rounded p-1.5 text-center bg-slate-900">
                    <p className="text-[9px] text-slate-500">Uptime</p>
                    <span className="font-bold text-white text-xs">24d 12h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
