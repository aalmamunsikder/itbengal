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
    <div className="relative min-h-screen bg-slate-50 text-slate-800 selection:bg-primaryBlue/20 selection:text-[#0052cc]">
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
