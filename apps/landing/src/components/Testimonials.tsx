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
    <section className="py-12 px-6 max-w-7xl mx-auto border border-slate-100 bg-white text-slate-800 rounded-2xl shadow-md mt-8 mb-8">
      <div className="text-center mb-8">
        <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Testimonials</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 mb-2 tracking-tight">
          Success Stories
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm leading-relaxed">
          Read reviews and video stories from customers running high-performance projects on our platform.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-center max-w-5xl mx-auto">
        {/* Left Column: Big Testimonial Video Feature */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-xl overflow-hidden shadow border border-slate-200 aspect-video group cursor-pointer">
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-[#001f5e]/35 group-hover:bg-[#001f5e]/45 transition-all flex items-center justify-center z-10">
              <div className="h-12 w-12 rounded-full bg-[#0052cc] text-white flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all duration-300">
                <Play className="h-5 w-5 fill-white ml-0.5" />
              </div>
            </div>
            {/* Testimonial label overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20 text-white select-none">
              <span className="bg-yellow-400 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Featured</span>
              <h3 className="text-base md:text-lg font-extrabold mt-1.5 drop-shadow">
                "Best Web Hosting Company I have ever seen in BD"
              </h3>
              <p className="text-[11px] text-slate-200 mt-0.5 opacity-90">— Md. Al-Mamun, IT Architect</p>
            </div>
            {/* Thumbnail Image */}
            <img
              src="/customer_testimonial_thumbnail.png"
              alt="Video Testimonial Thumbnail"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Right Column: Quotes and details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-l-2 border-[#0052cc] pl-3 space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Trusted by 4,000+ Happy Customers</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              From personal developers to fast-growing digital agencies in Bangladesh, our speed and local BDT support are highly praised.
            </p>
          </div>

          <div className="space-y-4">
            {reviews.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 relative">
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed italic">
                  "{item.quote}"
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-800">
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
