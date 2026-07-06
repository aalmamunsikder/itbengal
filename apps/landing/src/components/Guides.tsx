'use client';

import { ArrowRight, BookOpen, Key, Link2, ShieldAlert } from 'lucide-react';

export default function Guides() {
  const guides = [
    {
      title: 'Deploying React apps via Git Push',
      desc: 'Learn how to connect your GitHub repository, configure webhook triggers, and verify container build logs instantly.',
      icon: <Link2 className="h-5 w-5 text-primaryBlue" />,
      tag: 'Deployments',
    },
    {
      title: 'Binding domains with SSL wildcards',
      desc: 'Step-by-step setup guide for pointing A/CNAME records to nameservers and provisioning free Let\'s Encrypt certificates.',
      icon: <Key className="h-5 w-5 text-primaryBlue" />,
      tag: 'Domains & SSL',
    },
    {
      title: 'Configuring S3 database backups',
      desc: 'Secure your MariaDB data with daily automated S3 uploads, AES-256 backup encryption keys, and instant restoration options.',
      icon: <ShieldAlert className="h-5 w-5 text-primaryBlue" />,
      tag: 'Backup Recovery',
    },
  ];

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto border-t border-slate-100 bg-[#f8fafc] text-slate-800 rounded-2xl mb-8 shadow-sm">
      <div className="text-center mb-8">
        <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Knowledge Base
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 mb-2 tracking-tight">
          Comprehensive Guides
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm leading-relaxed">
          Step-by-step developer tutorials to build, secure, and recover your containerized projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {guides.map((guide, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow transition-all group"
          >
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {guide.tag}
              </span>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  {guide.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-primaryBlue transition-colors">
                  {guide.title}
                </h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                {guide.desc}
              </p>
            </div>
            <a
              href="https://dashboard.itbengal.xyz/support"
              className="text-xs font-bold text-primaryBlue hover:underline flex items-center gap-1 mt-auto"
            >
              Read Guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
