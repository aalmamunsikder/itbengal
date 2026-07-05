'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Faq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-36 px-6 max-w-4xl mx-auto border-t border-white/5">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Frequently Asked <span className="gradient-text">Questions</span></h2>
        <p className="text-slate-400 text-lg">Clear answers to common questions about our platform and hosting engine.</p>
      </div>

      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="glass-panel rounded-2xl overflow-hidden border border-white/5 transition-all duration-300"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-semibold text-slate-200">{faq.question}</span>
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
              <p className="px-6 py-5 text-sm text-slate-400 leading-relaxed bg-white/[0.01]">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const faqData = [
  {
    question: 'How do Git-driven deployments work?',
    answer: 'Once you connect your GitHub account and select a repository, our platform listens to commit push events via webhooks. Every time you push code, the build engine automatically pulls the branch, compiles the build, creates a fresh Docker container, and updates the routing without downtime.',
  },
  {
    question: 'Can I map a custom domain?',
    answer: 'Yes. You can add your own custom domains (e.g. `example.com` or `app.example.com`). The platform automatically configures Traefik router rules and issues Let\'s Encrypt SSL certificates for your custom domains in seconds.',
  },
  {
    question: 'What is the container isolation structure for WordPress?',
    answer: 'Every WordPress site is deployed as a separate, fully isolated two-container stack (one container for the PHP-Apache WordPress app and one container for the MariaDB database). This guarantees data security, high stability, and makes database backups and file manipulation reliable.',
  },
  {
    question: 'Are backups automated?',
    answer: 'Yes! For all Managed WordPress sites, database SQL dumps and folder archive zips are automatically packaged and stored securely in cloud S3 storage buckets according to your plan\'s schedule.',
  },
];
