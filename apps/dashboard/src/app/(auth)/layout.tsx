import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication | ITBengal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-white selection:bg-[#0066ff]/10 selection:text-[#0066ff] font-sans antialiased">
      
      {/* Left Column: Form Wrapper */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 md:p-16 min-h-screen">
        
        {/* Top Header Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <svg viewBox="0 0 100 100" className="h-8 w-8 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
              {/* Isometric Server Blades */}
              <path d="M50 20 L75 30 L50 40 L25 30 Z" fill="#0066ff" />
              <path d="M25 30 L50 40 L50 48 L25 38 Z" fill="#0052cc" />
              <path d="M50 40 L75 30 L75 38 L50 48 Z" fill="#003d99" />
              
              <path d="M25 44 L50 54 L50 62 L25 52 Z" fill="#0052cc" />
              <path d="M50 54 L75 44 L75 52 L50 62 Z" fill="#003d99" />
              
              <path d="M25 58 L50 68 L50 76 L25 66 Z" fill="#0052cc" />
              <path d="M50 68 L75 58 L75 66 L50 76 Z" fill="#003d99" />
            </svg>
            <span className="text-base font-black tracking-tight uppercase">
              <span className="text-primaryBlue">IT</span>
              <span className="text-slate-800">Bengal</span>
            </span>
          </Link>

          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-[#0066ff] transition-colors">
            Back to home
          </Link>
        </div>

        {/* Center Auth Form Container (Clean standalone card) */}
        <div className="flex-grow flex items-center justify-center py-10">
          <div className="w-full max-w-[440px] px-2">
            {children}
          </div>
        </div>

        {/* Bottom Footer Links */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>© {new Date().getFullYear()} ITBengal. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#0066ff]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#0066ff]">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Premium Dashboard Preview (Adapted from SaasAble AuthLayout) */}
      <div className="lg:col-span-5 hidden lg:flex flex-col justify-between bg-slate-50 border-l border-slate-200/60 p-12 relative overflow-hidden select-none">
        
        {/* Top Text specifications */}
        <div className="space-y-3.5 mt-4">
          <span className="text-[#0066ff] text-xs font-extrabold uppercase tracking-widest block">
            Enterprise Cloud Console
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight max-w-sm">
            High-Performance Container Cloud Platform
          </h3>
          <p className="text-slate-450 text-xs leading-relaxed max-w-xs">
            Join thousands of developers and agencies hosting their React apps, APIs, and WordPress projects on ITBengal.
          </p>
        </div>

        {/* Floating Mockup Card with shadow (Stretches to the bottom and wraps simulated containers) */}
        <div className="absolute bottom-0 left-12 right-0 top-56 rounded-tl-3xl border-t-[5px] border-l-[5px] border-slate-200 bg-white shadow-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[9px] text-slate-400 ml-2 font-mono">dashboard.itbengal.xyz/containers</span>
            </div>
            <span className="bg-blue-50 text-[#0066ff] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
              PROD-1
            </span>
          </div>

          <div className="space-y-3.5 mt-2">
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-800 text-xs">wp-main-blog</span>
                <p className="text-[9px] text-slate-450 mt-0.5 font-mono">PHP 8.2 • isolated stack</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold">RUNNING</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                <span className="text-[9px] text-slate-450 block">Resource limits</span>
                <span className="font-extrabold text-slate-800 text-xs">2 Dedicated Cores</span>
              </div>
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                <span className="text-[9px] text-slate-450 block">RAM allocation</span>
                <span className="font-extrabold text-slate-800 text-xs">512 MB Limits</span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/30 flex justify-between items-center">
              <span className="font-bold text-slate-700 text-[10px]">Auto-Backup Snapshots</span>
              <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider">✔ Enabled (S3)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
