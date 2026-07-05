'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[#030014] text-slate-100 selection:bg-primary-500/30 selection:text-white">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-950/20 blur-[150px] pointer-events-none" />

      <Header />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: July 5, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating an account, such as your name, email address, password, and billing details. We also collect metadata about your deployments and connected GitHub repositories to orchestrate the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2>
            <p>
              We use the collected information to operate, maintain, and improve our services, process transactions, communicate with you, and ensure security. We do not sell or lease your personal information to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Cookies and Tracking</h2>
            <p>
              We use essential cookies to manage user sessions and keep you authenticated. We do not run third-party tracking scripts or advertising cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information and application data, including password hashing, TLS encryption for all traffic, and secure database credential management.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
