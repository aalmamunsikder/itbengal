'use client';

import { useState } from 'react';
import { ChevronDown, MessageSquare } from 'lucide-react';
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
      <div className="space-y-3 mb-12 text-slate-700">
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
    question: 'Can I migrate my website from another provider?',
    answer: 'Yes! We offer 100% free website migration. Simply submit a ticket from your Client Portal, and our migration operators will migrate your static files, assets, databases, and SSL parameters with zero downtime.',
  },
  {
    question: 'What happens to database backups?',
    answer: 'For all WordPress and database-enabled sites, automated backups are packaged daily, encrypted via AES-256 standards, and transferred to secure, external cloud S3 buckets.',
  },
];
