'use client';

import { ShieldCheck, Server, Database, Zap, Activity } from 'lucide-react';

export default function Features() {
  const bulletPoints = [
    { title: 'Secure Server Isolation', desc: 'Separate sandboxed PHP & MariaDB containers' },
    { title: 'Free Wildcard SSL certificates', desc: 'Auto-renewing HTTPS paths via Traefik edge routing' },
    { title: 'Automated S3 Backups', desc: 'Daily database snapshots and file-system archives' },
    { title: 'Real-time WebSocket Console Logs', desc: 'Direct stream monitoring for quick debugging' },
  ];

  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
      <div className="grid gap-16 lg:grid-cols-2 items-center">
        {/* Left Side: Text and bullets */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-950/30 text-xs font-semibold text-primary-300">
            <Zap className="h-3 w-3 text-primary-400 fill-primary-400" />
            Premium Capabilities
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Hosting with <span className="text-primary-400">advanced</span> <br />
            features and <span className="bg-gradient-to-r from-fuchsia-400 via-primary-500 to-accent-400 bg-clip-text text-transparent">quality</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Deploy your websites on high-performance cloud hardware. No server configuration required. Get automatic load balancing, DNS security, and daily S3-encrypted backups.
          </p>

          <div className="space-y-6 pt-4">
            {bulletPoints.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="h-6 w-6 rounded-md bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mt-1 flex-shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base md:text-lg">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Showcase Illustration with styling */}
        <div className="relative flex justify-center">
          {/* Neon back glow circles */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/10 via-fuchsia-600/5 to-transparent blur-3xl rounded-full" />
          
          <div className="relative max-w-lg w-full rounded-3xl p-1 bg-gradient-to-br from-primary-500/20 via-white/5 to-accent-500/20 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-[#05021a]/80 backdrop-blur-2xl rounded-2xl" />
            <img
              src="/hosting_features_mockup.png"
              alt="Premium Hosting Features Illustration"
              className="relative w-full rounded-2xl object-cover hover:scale-[1.02] transition-all duration-500 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 3-Column Features Highlights below */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-32 pt-16 border-t border-white/5">
        <div className="glass-panel glass-panel-hover rounded-2xl p-8">
          <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-6 shadow-glow-primary">
            <Server className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Isolated Containers</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Every WordPress deployment receives a dedicated Apache/PHP and MariaDB process layer. Zero resource pollution.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-8">
          <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Automated Backups</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            One-click recovery from daily automated archive backups. Encrypted using AES-256 standard protocols.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-8">
          <div className="h-12 w-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 mb-6 shadow-glow-accent">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">Load Balancing</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Traefik dynamic edge load-balancers optimize network routing on the fly, keeping load times under 300ms.
          </p>
        </div>
      </div>
    </section>
  );
}
