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
    <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-white/5 relative z-10">
      <div className="text-center mb-16">
        <span className="text-primary-400 text-sm font-bold uppercase tracking-wider">Support Hub</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-2 mb-4">
          FAQ's
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          Quick answers to common questions about domains, billing, and isolated hosting environments.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4 mb-20 text-slate-300">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="border border-white/5 rounded-2xl overflow-hidden bg-[#060415]/60 shadow-lg transition-all duration-300 hover:border-primary-500/20"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-white text-sm md:text-base">{faq.question}</span>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                  activeFaq === index ? 'rotate-180 text-primary-400' : ''
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 overflow-hidden ${
                activeFaq === index ? 'max-h-40 border-t border-white/5' : 'max-h-0'
              }`}
            >
              <p className="px-6 py-5 text-xs md:text-sm text-slate-400 leading-relaxed bg-[#0b0825]/20">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Luxury banner: Have Questions About Hosting or Domains? */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#311042] to-[#1e1b4b] border border-white/10 p-8 text-center text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-primary-600/10 blur-[80px] pointer-events-none" />
        
        <div className="text-left space-y-2 relative z-10">
          <h3 className="text-xl md:text-2xl font-extrabold text-white">Have Questions About Hosting or Domains?</h3>
          <p className="text-blue-100/70 text-xs md:text-sm">
            Our local support team is active 24/7. Connect right now to clarify plan choices.
          </p>
        </div>
        <Link
          href="https://dashboard.itbengal.xyz/support"
          className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl active:scale-[0.98] flex items-center gap-2 whitespace-nowrap relative z-10"
        >
          <MessageSquare className="h-4 w-4 text-slate-900 fill-slate-900/10" />
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
