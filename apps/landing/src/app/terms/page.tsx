'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-24 bg-white shadow-sm border border-slate-100 rounded-3xl my-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: July 5, 2026</p>

        <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the HOSTNIN hosting platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not access or use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">2. Description of Service</h2>
            <p>
              HOSTNIN provides managed hosting services for React applications and WordPress sites, including build pipelines, database management, file exploration, custom domain mapping, and SSL certificate provisioning. We reserve the right to modify, suspend, or terminate the Service at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service to host, distribute, or transmit any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable. Hostile code, malware, spamming, and crypto-mining are strictly prohibited. Violating this clause will result in immediate account termination.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, HOSTNIN shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or related to your use of the Service.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
