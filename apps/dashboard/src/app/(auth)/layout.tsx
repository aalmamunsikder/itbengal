import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, Cpu, HardDrive, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication | ITBengal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const benefits = [
    {
      title: 'Isolated Container Sandboxing',
      desc: 'Separate Apache/PHP and MariaDB container boundaries ensure isolated resource allocations.',
      icon: ShieldCheck,
    },
    {
      title: 'Gen4 NVMe SSD Storage',
      desc: 'Over 3,000MB/s execution throughput speeds to eradicate disk read/write bottlenecks.',
      icon: HardDrive,
    },
    {
      title: 'Git-Triggered Auto Deployments',
      desc: 'Push code changes to GitHub or GitLab to automatically rebuild and launch your updates.',
      icon: Cpu,
    },
    {
      title: 'bKash BDT Local Billing',
      desc: 'Convenient local billing channels with automated payment verification and invoice records.',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-primary/20 selection:text-primary-600">
      <Header />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full flex items-center justify-center">
        <div className="grid gap-12 lg:grid-cols-12 w-full items-stretch">
          {/* Left Column: Form Wrapper */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              {children}
            </div>
          </div>

          {/* Right Column: Premium Brand Benefits */}
          <div className="lg:col-span-6 hidden lg:flex flex-col justify-center space-y-6 pl-8 border-l border-slate-200">
            <div className="space-y-2">
              <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Enterprise Hosting</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                High-Performance Compute Platform
              </h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Join thousands of developers and agencies hosting their React apps, APIs, and WordPress projects on ITBengal.
              </p>
            </div>

            <div className="grid gap-4">
              {benefits.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary-600 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
