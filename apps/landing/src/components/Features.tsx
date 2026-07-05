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
    <div className="w-full bg-[#060415] py-24 text-white space-y-36">
      {/* 1. Moving From Another Host? */}
      <section className="max-w-7xl mx-auto px-6 grid gap-16 lg:grid-cols-2 items-center">
        {/* Node diagram illustration on left */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-primary-650/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl border border-white/5 bg-[#0b0825]/40 p-8 w-full max-w-md shadow-2xl flex flex-col items-center backdrop-blur-xl">
            {/* Center Node */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-xl text-3xl font-extrabold select-none animate-pulse-soft border border-white/10">
              H
            </div>
            {/* Surrounding floating nodes */}
            <div className="grid grid-cols-3 gap-6 mt-8 w-full">
              {['Git Repo', 'ZIP Uploader', 'PHP Server', 'Apache', 'MySQL DB', 'Nginx'].map((label, idx) => (
                <div key={idx} className="border border-white/5 rounded-xl p-3 bg-[#060415]/80 text-center text-xs font-bold text-slate-300 shadow-md">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text content on right */}
        <div className="space-y-8">
          <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Zero Downtime Migration</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Moving From <br />
            Another Host?
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Switch to HOSTNIN stress-free. Our automated systems and manual operators migrate your static files, databases, and SSL configs in minutes.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {migrations.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm md:text-base">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-glow-primary active:scale-[0.98]"
            >
              Start Free Migration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Lightning Fast Loading Speed */}
      <section className="max-w-7xl mx-auto px-6 grid gap-16 lg:grid-cols-2 items-center">
        {/* Text content on left */}
        <div className="space-y-8">
          <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Optimized Speed Engine</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Lightning Fast <br />
            Loading Speed
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Our container stack leverages SSD storage, Cloudflare edge caching, and lightweight Alpine images to achieve up to 10x faster execution than traditional servers.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {['Superfast SSD Disks', 'LiteSpeed Cache Engine', 'PHP SHORTINIT optimization', 'Alpine runner isolation'].map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-glow-primary active:scale-[0.98]"
            >
              Deploy Your Website <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Floating badge circles on right */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-[#0066ff]/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl border border-white/5 bg-[#0b0825]/40 p-8 w-full max-w-md shadow-2xl flex flex-col items-center backdrop-blur-xl">
            {/* Center Node */}
            <div className="h-20 w-20 rounded-full bg-[#060415] border border-white/10 flex items-center justify-center text-slate-300 shadow-md text-3xl font-extrabold select-none mb-6">
              ⚙️
            </div>
            {/* Round Badge Grid */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {tools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-2 border border-white/5 rounded-xl p-3 bg-[#060415]/80 shadow-md font-bold text-sm text-slate-200">
                  <span className="text-xl">{tool.icon}</span>
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. User-Friendly Control Panel */}
      <section className="max-w-7xl mx-auto px-6 grid gap-16 lg:grid-cols-2 items-center">
        {/* Text details on left */}
        <div className="space-y-8">
          <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Dashboard Portal</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            User-Friendly <br />
            Control Panel
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Manage your websites, domains, S3 database backups, container restarts, and real-time logs in one clean dashboard without opening terminal command lines.
          </p>

          <div className="space-y-4">
            {[
              { title: 'Manage With Ease', desc: 'Perform container restarts, backups, and deletes in one click.' },
              { title: 'Instant WordPress Installer', desc: 'Deploy Php-Apache & MariaDB isolated environments in seconds.' },
              { title: 'Auto Let\'s Encrypt SSL', desc: 'Bind custom domains with automated wildcard certificates.' },
            ].map((item, idx) => (
              <div key={idx} className="border-l-4 border-primary-500 pl-4 space-y-1">
                <h4 className="font-bold text-white text-sm md:text-base">{item.title}</h4>
                <p className="text-slate-400 text-xs md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup Laptop Panel on right */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-primary-600/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/5 bg-[#0b0825]/40 p-2 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-950 p-4 text-left">
              {/* Header circles */}
              <div className="flex items-center gap-1.5 mb-4 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-500 ml-2 font-mono">dashboard.itbengal.xyz/wordpress</span>
              </div>
              {/* Mockup layout */}
              <div className="space-y-3 font-mono text-xs text-slate-400">
                <p className="text-slate-500">// Managed WordPress Container State</p>
                <div className="border border-white/5 rounded-lg p-2.5 bg-[#060415]/80 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">wp-myblog-prod</span>
                    <p className="text-[10px] text-slate-500">itbengal-wp-stack:v1</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">RUNNING</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-white/5 rounded p-2 text-center bg-[#060415]/80">
                    <p className="text-[10px] text-slate-500">CPU Usage</p>
                    <span className="font-bold text-white text-xs">1.2%</span>
                  </div>
                  <div className="border border-white/5 rounded p-2 text-center bg-[#060415]/80">
                    <p className="text-[10px] text-slate-500">RAM Limit</p>
                    <span className="font-bold text-white text-xs">256MB</span>
                  </div>
                  <div className="border border-white/5 rounded p-2 text-center bg-[#060415]/80">
                    <p className="text-[10px] text-slate-500">Uptime</p>
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
