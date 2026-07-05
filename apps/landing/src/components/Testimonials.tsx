'use client';

import { Play, Star } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      quote: 'ITBengal has completely transformed our agency workflow. Deploying isolated staging environments for clients happens in under 30 seconds.',
      author: 'Amirul Islam',
      role: 'Agency Director',
      rating: 5,
    },
    {
      quote: 'Uptime has been 100% since migration. The custom control panel is highly intuitive and database S3 backups are fully automated.',
      author: 'Taskeen Ahmed',
      role: 'SaaS Founder',
      rating: 5,
    },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-100 bg-white text-slate-800 rounded-3xl mt-12 mb-16 relative shadow-xl">
      <div className="text-center mb-16">
        <span className="text-[#0052cc] text-sm font-bold uppercase tracking-wider">Testimonials</span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
          Success Stories
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
          Read reviews and video stories from customers running high-performance projects on our platform.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-12 items-center max-w-6xl mx-auto">
        {/* Left Column: Big Testimonial Video Feature (8 columns on large) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 aspect-video group cursor-pointer">
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-[#001f5e]/30 group-hover:bg-[#001f5e]/40 transition-all flex items-center justify-center z-10">
              <div className="h-16 w-16 rounded-full bg-[#0052cc] text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <Play className="h-6 w-6 fill-white ml-1" />
              </div>
            </div>
            {/* Testimonial label overlay */}
            <div className="absolute bottom-6 left-6 right-6 z-20 text-white select-none">
              <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded uppercase">Featured</span>
              <h3 className="text-xl md:text-3xl font-extrabold mt-2 drop-shadow-md">
                "Best Web Hosting Company I have ever seen in BD"
              </h3>
              <p className="text-sm text-slate-200 mt-1 opacity-90">— Md. Al-Mamun, IT Architect</p>
            </div>
            {/* Thumbnail Image */}
            <img
              src="/customer_testimonial_thumbnail.png"
              alt="Video Testimonial Thumbnail"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Right Column: Quotes and details (4 columns on large) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border-l-4 border-[#0052cc] pl-4 space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900">Trusted by 4,000+ Happy Customers</h3>
            <p className="text-slate-500 text-sm">
              From personal developers to fast-growing digital agencies in Bangladesh, our speed and local BDT support are highly praised.
            </p>
          </div>

          <div className="space-y-6">
            {reviews.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed italic">
                  "{item.quote}"
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span>{item.author}</span>
                  <span className="text-[#0052cc]">{item.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
