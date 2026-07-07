'use client';

import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 px-6">
      {/* 1. Dotted grid rounded background wrapper */}
      <div className="absolute top-0 inset-x-0 block bg-neutral-100/70 dark:bg-neutral-900/40 h-[550px] sm:h-[650px] lg:h-[750px] overflow-hidden rounded-b-[32px] sm:rounded-b-[48px] lg:rounded-b-[64px] z-10 pointer-events-none">
        <div className="relative h-full bg-[length:32px_32px] bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2050%2060%22><text%20x=%220%22%20y=%2225%22%20fill=%22%23E2E8F0%22%20font-size=%2280px%22>.</text></svg>')] dark:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2050%2060%22><text%20x=%220%22%20y=%2225%22%20fill=%22%23334155%22%20font-size=%2280px%22>.</text></svg>')] opacity-60" />
      </div>

      {/* 2. Main content container */}
      <div className="mx-auto max-w-7xl relative z-20 flex flex-col items-center">
        <div className="pb-10 sm:pb-14 flex flex-col items-center">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center p-1 rounded-full border border-slate-200/80 bg-white/95 dark:bg-gray-800/90 backdrop-blur-sm shadow-xs mb-5">
            <span className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">
              Litespeed SSD Containers
            </span>
            <div className="bg-blue-50 dark:bg-blue-950/40 inline-flex items-center py-1 px-3 rounded-full gap-1">
              <Zap className="w-3 h-3 text-[#0066ff] fill-[#0066ff]" />
              <span className="text-[#0066ff] dark:text-blue-400 font-extrabold text-[9px] uppercase tracking-wider leading-none">
                BDT Billing
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] max-w-[850px] text-center">
            The Developer Cloud <br /> for Bangladesh.
          </h1>

          {/* SVG Wave graphic */}
          <div className="text-[#0066ff] opacity-80 pt-2 pb-3 select-none">
            <svg viewBox="0 0 122 10" className="w-[92px] md:w-[122px] h-2.5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                opacity="0.4"
                d="M1.46484 6.83613L4.45387 3.7103C7.74598 0.267505 13.38 0.760513 16.0241 4.72277L16.5428 5.50001C19.2423 9.54539 25.1877 9.54539 27.8873 5.5V5.5C30.5869 1.45461 36.5322 1.45461 39.2318 5.5V5.5C41.9314 9.54539 47.8768 9.54539 50.5764 5.5V5.5C53.2759 1.45461 59.2213 1.45461 61.9209 5.5V5.5C64.6205 9.54539 70.5658 9.54539 73.2654 5.5V5.5C75.965 1.45461 81.9104 1.45461 84.61 5.5V5.5C87.3096 9.54539 93.2549 9.54539 95.9545 5.5V5.5C98.6541 1.45461 104.599 1.45461 107.299 5.5V5.5C109.999 9.54539 115.944 9.54539 118.644 5.5L120.534 2.66667"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Subtitle */}
          <p className="max-w-[650px] text-center text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Deploy React static apps and container-isolated WordPress environments in seconds. High-speed local servers starting at ৳0/mo.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="px-6 py-3.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-blue-500/10 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              Deploy Your First App
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="px-6 py-3.5 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-600 dark:text-slate-300 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center cursor-pointer"
            >
              View Pricing Plans
            </a>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-row gap-2.5 justify-center flex-wrap mt-8">
            {['React 19', 'Next.js 15', 'WordPress', 'Node.js', 'Docker', 'MariaDB'].map((tech, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-gray-800/90 shadow-2xs select-none"
              >
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Center Showcase Video */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-250/50 shadow-lg h-auto w-full max-w-4xl bg-slate-950">
          <video autoPlay muted playsInline loop width="100%" height="100%" className="flex object-cover w-full h-full">
            <source src="https://d2elhhoq00m1pj.cloudfront.net/saasable-intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
