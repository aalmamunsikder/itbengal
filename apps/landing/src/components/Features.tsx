'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Server, Database } from 'lucide-react';
import Link from 'next/link';

export default function Features() {
  const [activeTab, setActiveTab] = useState<'app' | 'db'>('app');

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
    <div className="w-full bg-white py-16 text-slate-800 space-y-24" id="features">
      
      {/* 1. Moving From Another Host? */}
      <section className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-12 items-center">
        {/* Node diagram illustration on left */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="absolute inset-0 bg-blue-50/50 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/80 p-8 w-full max-w-sm shadow-xs flex flex-col items-center select-none">
            {/* Center Node */}
            <div className="h-16 w-16 rounded-full bg-[#0066ff] flex items-center justify-center text-white shadow-md text-base font-black tracking-wider transition-all duration-300">
              ITB
            </div>
            {/* Surrounding floating nodes */}
            <div className="grid grid-cols-3 gap-3.5 mt-8 w-full">
              {['Git Repo', 'ZIP Uploader', 'PHP Server', 'Apache', 'MySQL DB', 'Nginx'].map((label, idx) => (
                <div key={idx} className="border border-slate-200/80 rounded-xl p-2 bg-white text-center text-[10px] font-bold text-slate-550 shadow-2xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text content on right */}
        <div className="lg:col-span-7 space-y-6">
          <span className="text-[#0066ff] text-xs font-bold uppercase tracking-widest block">
            Zero Downtime Migration
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Moving From Another Host?
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Switch to ITBengal stress-free. Our automated systems and manual operators migrate your static files, databases, and SSL configs in minutes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {migrations.map((item, idx) => (
              <div key={idx} className="space-y-1 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs md:text-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-1.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs md:text-sm transition-all shadow-md hover:shadow-blue-500/10 active:scale-[0.98]"
            >
              Start Free Migration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Lightning Fast Loading Speed */}
      <section className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-12 items-center">
        {/* Text content on left */}
        <div className="lg:col-span-7 space-y-6 lg:order-2">
          <span className="text-[#0066ff] text-xs font-bold uppercase tracking-widest block">
            Optimized Speed Engine
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Local Uptime & Low Latency
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Our servers are optimized for South Asian network routing. Your applications load with minimal latency for local audiences in Bangladesh.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {['Superfast SSD Disks', 'LiteSpeed Cache Engine', 'South Asian BDIX Routing', 'Alpine runner isolation'].map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-650 text-slate-700">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-1.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs md:text-sm transition-all shadow-md hover:shadow-blue-500/10 active:scale-[0.98]"
            >
              Deploy Your Website <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Floating badge circles on right */}
        <div className="lg:col-span-5 relative flex justify-center lg:order-1">
          <div className="absolute inset-0 bg-blue-100/30 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/80 p-8 w-full max-w-sm shadow-xs flex flex-col items-center select-none">
            {/* Center Node */}
            <div className="h-16 w-16 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-xs text-2xl font-extrabold mb-6 animate-bounce-slow">
              🚀
            </div>
            {/* Round Badge Grid */}
            <div className="grid grid-cols-2 gap-3.5 w-full">
              {tools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-2 border border-slate-200/80 rounded-xl p-2.5 bg-white shadow-2xs font-bold text-xs text-slate-600 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                  <span className="text-lg">{tool.icon}</span>
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. User-Friendly Control Panel */}
      <section className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-12 items-center">
        {/* Text details on left */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[#0066ff] text-xs font-bold uppercase tracking-widest block">
            Dashboard Portal
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Isolated Container Stack
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Each WordPress site runs in a dedicated container stack, guaranteeing memory boundaries and solid security out of the box.
          </p>

          <div className="space-y-4">
            {[
              { title: 'Manage With Ease', desc: 'Perform container restarts, backups, and deletes in one click.' },
              { title: 'Instant WordPress Installer', desc: 'Deploy Php-Apache & MariaDB isolated environments in seconds.' },
              { title: 'Auto Let\'s Encrypt SSL', desc: 'Bind custom domains with automated wildcard certificates.' },
            ].map((item, idx) => (
              <div key={idx} className="border-l-2 border-[#0066ff] pl-4 space-y-1">
                <h4 className="font-extrabold text-slate-800 text-xs md:text-sm">{item.title}</h4>
                <p className="text-slate-450 text-[11px] md:text-xs text-slate-450">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup Laptop Panel on right */}
        <div className="lg:col-span-6 relative flex justify-center">
          <div className="absolute inset-0 bg-blue-50/50 blur-3xl rounded-full pointer-events-none" />
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-slate-50/80 p-2 shadow-md overflow-hidden">
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 p-4 text-left shadow-lg">
              {/* Header circles */}
              <div className="flex items-center justify-between mb-4 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[9px] text-slate-500 ml-2 font-mono">dashboard.itbengal.xyz/wordpress</span>
                </div>

                {/* Clickable Mockup Tabs */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 font-mono text-[9px] font-bold text-slate-400">
                  <button
                    onClick={() => setActiveTab('app')}
                    className={`px-3 py-1 rounded transition-all duration-200 ${
                      activeTab === 'app' ? 'bg-[#0066ff] text-white shadow' : 'hover:text-white'
                    }`}
                  >
                    App Stack
                  </button>
                  <button
                    onClick={() => setActiveTab('db')}
                    className={`px-3 py-1 rounded transition-all duration-200 ${
                      activeTab === 'db' ? 'bg-[#0066ff] text-white shadow' : 'hover:text-white'
                    }`}
                  >
                    Database
                  </button>
                </div>
              </div>

              {/* Tab: App Stack */}
              {activeTab === 'app' ? (
                <div className="space-y-3 font-mono text-[11px] text-slate-400 animate-fade-in">
                  <p className="text-slate-650">// Managed WordPress Container State</p>
                  <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-900/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white text-xs">wp-myblog-prod</span>
                      <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Server className="h-3 w-3" />
                        itbengal-wp-stack:v1
                      </p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">RUNNING</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">CPU Usage</p>
                      <span className="font-bold text-white text-xs">1.2%</span>
                    </div>
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">RAM Limit</p>
                      <span className="font-bold text-white text-xs">256MB</span>
                    </div>
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">Uptime</p>
                      <span className="font-bold text-white text-xs">24d 12h</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab: Database */
                <div className="space-y-3 font-mono text-[11px] text-slate-400 animate-fade-in">
                  <p className="text-slate-650">// Isolated MariaDB Database Instance</p>
                  <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-900/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white text-xs">mariadb-myblog-prod</span>
                      <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Database className="h-3 w-3" />
                        port-3306-isolated
                      </p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">ONLINE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">Size</p>
                      <span className="font-bold text-white text-xs">12.5 MB</span>
                    </div>
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">Active Conn</p>
                      <span className="font-bold text-white text-xs">3 / 100</span>
                    </div>
                    <div className="border border-slate-800/80 rounded-xl p-2 text-center bg-slate-900/40">
                      <p className="text-[9px] text-slate-500">Backup S3</p>
                      <span className="font-bold text-emerald-400 text-xs">SECURE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
