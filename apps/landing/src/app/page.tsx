'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import DomainSearch from '@/components/DomainSearch';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#060415] text-slate-200 selection:bg-primary-500/20 selection:text-white">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-950/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-fuchsia-950/5 blur-[180px] pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Hero Banner */}
      <Hero />

      {/* Domain Registry Search */}
      <DomainSearch />

      {/* Feature Showcases (Migration, Fast Speeds, Control Panel) */}
      <Features />

      {/* Pricing Tables */}
      <Pricing />

      {/* Success Stories Testimonials */}
      <Testimonials />

      {/* FAQs */}
      <Faq />

      {/* Footer */}
      <Footer />
    </div>
  );
}
