'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030014] text-slate-100 selection:bg-primary-500/30 selection:text-white">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-fuchsia-950/10 blur-[180px] pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Hero Banner */}
      <Hero />

      {/* Feature Grid */}
      <Features />

      {/* Pricing Tables */}
      <Pricing />

      {/* FAQs */}
      <Faq />

      {/* Final Call to Action */}
      <section className="py-24 md:py-36 px-6 text-center max-w-7xl mx-auto border-t border-white/5 relative">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Ready To Launch <br/>Your Next Project?</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm">Deploy React code or managed WordPress apps instantly. Experience zero config hosting now.</p>
        <a
          href="https://dashboard.itbengal.xyz/register"
          className="inline-flex px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          Create Free Account
        </a>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
