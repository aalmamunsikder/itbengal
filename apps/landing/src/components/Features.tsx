'use client';

import {
  GitBranch,
  FolderArchive,
  Database,
  ShieldCheck,
  Globe,
  Terminal
} from 'lucide-react';

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-36 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything You Need To <span className="gradient-text">Go Live</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">No configuration files, no server updates, and no routing headaches. Just push your code, we handle the rest.</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-6 shadow-glow-primary">
            <GitBranch className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Git-Driven Deployments</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Simply connect your GitHub repository. The platform automatically triggers a production build on every git push to your main branch.</p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 mb-6 shadow-glow-accent">
            <FolderArchive className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">ZIP File Upload Wizard</h3>
          <p className="text-slate-400 text-sm leading-relaxed">No Git? No problem. Upload your compiled static HTML or React project as a `.zip` file, and we will package, spin up, and route it instantly.</p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Managed WordPress</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Deploy robust WordPress sites in a two-container isolated setup (MariaDB + PHP/Apache) with file explorers and backup orchestration built in.</p>
        </div>

        {/* Card 4 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Automatic SSL/TLS</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Every site deployed automatically receives a Let's Encrypt SSL/TLS certificate. Traefik handles certificate renewals automatically.</p>
        </div>

        {/* Card 5 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Custom Domains</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Bind your own brand's custom domains (`yourdomain.com`) in seconds with automatic wildcard routing configurations.</p>
        </div>

        {/* Card 6 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 mb-6">
            <Terminal className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Realtime logs</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Inspect compile logs and server runtime outputs in real-time straight from your browser console via WebSockets.</p>
        </div>
      </div>
    </section>
  );
}
