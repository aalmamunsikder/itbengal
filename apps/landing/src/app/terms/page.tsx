'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-[#030014] text-slate-100 selection:bg-primary-500/30 selection:text-white">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-950/20 blur-[150px] pointer-events-none" />

      <Header />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: July 5, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ITBengal hosting platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not access or use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
            <p>
              ITBengal provides managed hosting services for React applications and WordPress sites, including build pipelines, database management, file exploration, custom domain mapping, and SSL certificate provisioning. We reserve the right to modify, suspend, or terminate the Service at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service to host, distribute, or transmit any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable. Hostile code, malware, spamming, and crypto-mining are strictly prohibited. Violating this clause will result in immediate account termination.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ITBengal shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or related to your use of the Service.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
