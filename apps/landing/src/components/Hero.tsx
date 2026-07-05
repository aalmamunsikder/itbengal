'use client';

import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-12 pb-24 md:pt-20 md:pb-36 flex flex-col items-center text-center px-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-950/30 text-xs font-semibold text-primary-300 mb-8 animate-pulse-soft">
        <Zap className="h-3 w-3 text-primary-400 fill-primary-400" />
        Next-Gen Platform Hosting is Here
      </div>

      {/* Title */}
      <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-8">
        The Developer-First <br/>
        <span className="gradient-text">App Hosting Platform</span>
      </h1>

      {/* Description */}
      <p className="max-w-2xl text-lg md:text-xl text-slate-400 font-medium mb-12">
        Deploy your static React web apps and fully managed WordPress containers in seconds. Fast global routing, free Let's Encrypt SSL, and real-time logs out of the box.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <Link
          href="https://dashboard.itbengal.xyz/register"
          className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
        >
          Deploy For Free
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="#features"
          className="px-8 py-4 rounded-xl text-base font-semibold text-slate-300 border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center"
        >
          Explore Features
        </a>
      </div>

      {/* Mockup Showcase */}
      <div className="relative max-w-5xl w-full rounded-2xl p-1 bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-primary-500/20 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-[#030014]/60 backdrop-blur-3xl rounded-[15px]" />
        <div className="relative rounded-[15px] border border-white/5 overflow-hidden bg-slate-950/70 p-4 sm:p-6 text-left">
          {/* Header circles */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="text-xs text-slate-500 ml-4 font-mono select-none">itbengal-build-pipeline --verbose</span>
          </div>
          {/* Mock code block */}
          <div className="font-mono text-sm space-y-2 text-slate-400">
            <p className="text-slate-500 select-none">// Initiating platform container deployment</p>
            <p><span className="text-primary-400">root@itbengal:~#</span> git push origin main</p>
            <p className="text-emerald-400">✓ Detected Project Framework: REACT / VITE</p>
            <p className="text-indigo-400">ℹ Running Docker compilation build stack...</p>
            <p className="text-slate-500 select-none">  [+] Building image [164.9s] FINISHED</p>
            <p className="text-cyan-400">✓ Nginx static server compiled successfully.</p>
            <p className="text-indigo-400">ℹ Registering Traefik loadbalancer endpoints...</p>
            <p className="text-emerald-400">✓ Let's Encrypt SSL certificate auto-provisioned securely.</p>
            <p className="text-primary-300 font-bold">🎉 Deployment successfully LIVE at https://your-site.itbengal.xyz</p>
          </div>
        </div>
      </div>
    </section>
  );
}
