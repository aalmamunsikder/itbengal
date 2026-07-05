'use client';

import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      name: 'Ryan K.',
      role: 'Frontend Architect',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'Deploying static React bundles on ITBengal takes under 15 seconds. The ZIP upload wizard changed my deployment pipeline forever.',
      rating: 5,
    },
    {
      name: 'Amara D.',
      role: 'WordPress Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'The dual-container isolation for WordPress runs PHP and MariaDB cleanly without interference. Speed and security are outstanding.',
      rating: 5,
    },
    {
      name: 'Daniel P.',
      role: 'SaaS Founder',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'Let\'s Encrypt wildcard certificates are issued immediately. Adding our custom domains takes just a single click. Absolutely stellar.',
      rating: 5,
    },
    {
      name: 'Sarah J.',
      role: 'Agency Director',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'Automated database backups encrypted via AES-256 gave us complete peace of mind. ITBengal is now our primary hosting platform.',
      rating: 5,
    },
    {
      name: 'Devin M.',
      role: 'Fullstack Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'Streaming runtime logs via WebSockets is fantastic. I can debug compile issues immediately without digging through server shells.',
      rating: 5,
    },
    {
      name: 'Clara S.',
      role: 'Technical Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80',
      quote: 'The performance stats telemetries inside the dashboard are extremely accurate. Outstanding uptime, load times, and bandwidth usage.',
      rating: 5,
    },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          What our <span className="gradient-text">clients say</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-base md:text-lg">
          Read reviews from the developers, founders, and teams using ITBengal.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between"
          >
            <div>
              {/* Rating stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium italic">
                "{t.quote}"
              </p>
            </div>
            {/* User profile */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <img
                src={t.avatarUrl}
                alt={t.name}
                className="h-10 w-10 rounded-full object-cover border border-white/10"
              />
              <div>
                <h4 className="font-bold text-white text-sm">{t.name}</h4>
                <p className="text-slate-500 text-xs">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
