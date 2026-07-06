'use client';

import { useState } from 'react';
import { ChevronDown, MessageSquare, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Faq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section id="faq" className="py-14 px-6 max-w-3xl mx-auto border-t border-slate-200">
      <div className="text-center mb-10">
        <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Support Hub</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 mb-2 tracking-tight">
          FAQ's
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Quick answers to common questions about domains, billing, and isolated hosting environments.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 mb-10 text-slate-700">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-slate-800 text-xs md:text-sm">{faq.question}</span>
              <ChevronDown
                className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${
                  activeFaq === index ? 'rotate-180 text-primaryBlue' : ''
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 overflow-hidden ${
                activeFaq === index ? 'max-h-32 border-t border-slate-100' : 'max-h-0'
              }`}
            >
              <p className="px-5 py-4 text-[11px] md:text-xs text-slate-500 leading-relaxed bg-slate-50/50">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Local Support profile card (Adapted from Hostnin founder support) */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col md:flex-row items-center gap-5 mb-10">
        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full bg-blue-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
          {/* Avatar representation or cloud engineer icon */}
          <CloudIconRepresent />
          <span className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
        </div>
        <div className="text-left space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">Al-Mamun Sikder</span>
            <span className="text-[9px] font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50 flex items-center gap-0.5">
              <Heart className="h-2 w-2 fill-current" />
              Founder Support
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-650 text-slate-600">ITBengal Infrastructure Architect</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            The founder who still answers support tickets and monitors container clusters. We guarantee direct engineer access with no automated call centers or template responses.
          </p>
        </div>
      </div>

      {/* Blue Banner: Have Questions About Hosting or Domains? */}
      <div className="w-full rounded-xl bg-gradient-to-r from-[#002e8c] to-[#04081c] p-6 text-center text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-extrabold">Have Questions About Hosting or Domains?</h3>
          <p className="text-blue-100/70 text-[11px] md:text-xs">
            Our local support team is active 24/7. Connect right now to clarify plan choices.
          </p>
        </div>
        <Link
          href="https://dashboard.itbengal.xyz/support"
          className="bg-[#0052cc] hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-lg text-xs transition-all shadow active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Talk to Support
        </Link>
      </div>
    </section>
  );
}

function CloudIconRepresent() {
  return (
    <div className="h-10 w-10 rounded-xl bg-[#0052cc] flex items-center justify-center shadow-md">
      <ShieldCheck className="h-5 w-5 text-white" />
    </div>
  );
}

const faqData = [
  {
    question: 'How fast is your SSD hosting infrastructure?',
    answer: 'We leverage enterprise NVMe SSD disks configured in high-speed clusters. Combined with lightweight Alpine container environments and LiteSpeed caching, page loads are up to 10x faster than traditional shared hosting.',
  },
  {
    question: 'How do you handle isolated WordPress environments?',
    answer: 'Every WordPress deployment is structured as a separate, fully sandboxed two-container setup (one container runs Apache/PHP, the other runs MariaDB). This completely blocks memory leaks or security exploits from affecting neighboring accounts.',
  },
  {
    question: 'Can I pay with local methods like bKash or Nagad?',
    answer: 'Yes! We support local BDT payment options including bKash, Nagad, and local Bangladeshi credit cards directly inside your Client Portal for invoice renewals.',
  },
  {
    question: 'What happens to database backups?',
    answer: 'For all WordPress and database-enabled sites, automated backups are packaged daily, encrypted via AES-256 standards, and transferred to secure, external cloud S3 buckets.',
  },
];
