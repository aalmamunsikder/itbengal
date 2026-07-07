'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Globe, Shield, Lock, Shuffle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface SearchResult {
  domain: string;
  isAvailable: boolean;
  priceBdt: number;
  currency: string;
  tld: string;
}

export default function DomainPage() {
  const [domain, setDomain] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pricingList = [
    { ext: '.com.bd', type: 'Local BD', regPrice: '৳1,500', renPrice: '৳1,700', transPrice: '৳1,500' },
    { ext: '.com', type: 'Popular Global', regPrice: '৳1,250', renPrice: '৳1,400', transPrice: '৳1,250' },
    { ext: '.org', type: 'Nonprofit', regPrice: '৳1,550', renPrice: '৳1,750', transPrice: '৳1,550' },
    { ext: '.net', type: 'Network / IT', regPrice: '৳1,400', renPrice: '৳1,600', transPrice: '৳1,400' },
    { ext: '.xyz', type: 'Developer Standard', regPrice: '৳290', renPrice: '৳1,150', transPrice: '৳1,150' },
  ];

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!);
    return null;
  };

  const setCookie = (name: string, value: string, days = 7) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    
    let domainScope = '';
    if (window.location.hostname.includes('itbengal.xyz')) {
      domainScope = '; domain=.itbengal.xyz';
    }
    
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/${domainScope}`;
  };

  // Sync client cart count
  useEffect(() => {
    const rawCart = getCookie('itbengal_cart');
    if (rawCart) {
      try {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch (e) {}
    }
  }, []);

  // Parse query params and trigger auto-search on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('query') || params.get('search');
      if (query) {
        setDomain(query);
        const autoSearch = async () => {
          setSearching(true);
          setError(null);
          setSuccess(null);
          try {
            const apiUrl = window.location.hostname.includes('itbengal.xyz')
              ? 'https://api.itbengal.xyz/api/v1'
              : 'http://localhost:4000/api/v1';

            const res = await fetch(`${apiUrl}/domains/search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ domainName: query }),
            });

            if (!res.ok) throw new Error('Failed to query domain search service');
            const json = await res.json();
            if (json.success) {
              setSearchResults(json.data);
            }
          } catch (err: any) {
            setError(err.message || 'Domain check failed');
          } finally {
            setSearching(false);
          }
        };
        autoSearch();
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    setSearching(true);
    setError(null);
    setSuccess(null);
    setSearchResults([]);

    try {
      const apiUrl = window.location.hostname.includes('itbengal.xyz')
        ? 'https://api.itbengal.xyz/api/v1'
        : 'http://localhost:4000/api/v1';

      const res = await fetch(`${apiUrl}/domains/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName: domain }),
      });

      if (!res.ok) {
        throw new Error('Failed to query domain search service');
      }

      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Domain check failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCart = (domainName: string, tld: string, priceBdt: number) => {
    const newItem = {
      id: `domain:${domainName}`,
      type: 'DOMAIN',
      name: domainName,
      priceBdt,
      metadata: { tld },
    };

    const updated = [...cartItems.filter((i) => i.id !== newItem.id), newItem];
    setCartItems(updated);
    setCookie('itbengal_cart', JSON.stringify(updated));
    setSuccess(`Added ${domainName} to your cart successfully!`);
    
    // Dispatch event to update navbar cart count if present
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-primaryBlue/20 selection:text-[#0052cc]">
      {/* Navigation */}
      <Header />

      {/* Main body */}
      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Title & Domain Search */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="text-[#0052cc] text-xs font-bold uppercase tracking-wider">Domain Registry</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-1 mb-3 tracking-tight">
            Find the Perfect Name for Your Brand
          </h1>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">
            Instantly check domain availability and secure your local `.com.bd` or international domain with DNS controls.
          </p>

          {/* Big Search Input */}
          <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center shadow-sm mb-6">
            <div className="flex items-center pl-2 text-slate-400">
              <Globe className="h-5 w-5" />
            </div>
            <input
              type="text"
              required
              placeholder="Search your ideal domain name (e.g. mycompany)..."
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 px-3 py-2 text-xs md:text-sm focus:ring-0"
            />
            <button
              type="submit"
              disabled={searching}
              className="bg-[#0052cc] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs md:text-sm transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {searching ? 'Checking...' : 'Check Domain'}
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Live Search Results Display */}
        {searchResults.length > 0 && (
          <div className="max-w-2xl mx-auto mb-14 border border-slate-200 bg-white rounded-xl p-6 space-y-4 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Registry Availability Search</h3>
              <Link
                href="https://dashboard.itbengal.xyz/cart"
                className="text-xs text-[#0052cc] font-bold hover:underline"
              >
                Go to Cart ({cartItems.length}) →
              </Link>
            </div>
            <div className="divide-y divide-slate-150">
              {searchResults.map((result, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{result.domain}</span>
                    <span className={`text-[10px] font-bold ${result.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {result.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {result.isAvailable ? (
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-xs text-slate-900">৳{result.priceBdt}/yr</span>
                      {cartItems.some((i) => i.id === `domain:${result.domain}`) ? (
                        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100">
                          Added to Cart
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(result.domain, result.tld, result.priceBdt)}
                          className="px-3.5 py-1.5 bg-[#0052cc] text-white hover:bg-blue-700 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Taken</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extension Pricing Table */}
        <div className="mb-14">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Domain Extension Pricing
            </h2>
            <p className="text-slate-500 text-xs">
              Registration, renewal, and transfer rates for popular extensions in BDT.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] md:text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-4">Extension</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Registration (1 Yr)</th>
                    <th className="p-4">Renewal (1 Yr)</th>
                    <th className="p-4">Transfer Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {pricingList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{item.ext}</td>
                      <td className="p-4"><span className="text-[10px] bg-blue-50 text-[#0052cc] px-2 py-0.5 rounded-full font-bold">{item.type}</span></td>
                      <td className="p-4 font-bold text-slate-900">{item.regPrice}</td>
                      <td className="p-4">{item.renPrice}</td>
                      <td className="p-4">{item.transPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Domain Management Benefits */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto mb-14">
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">DNS Zone Management</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Configure A, CNAME, MX, and TXT records with wildcard routing setups instantly.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">WHOIS ID Protection</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Protect your personal registration contacts from public databases and email spammers.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">EPP Theft Protection</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Keep domains locked against unauthorized or accidental transfer requests.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-primaryBlue">
              <Shuffle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Easy Redirection</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Redirect your web traffic to custom subdomains or external application environments.
            </p>
          </div>
        </div>

        {/* How to Transfer Walkthrough */}
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm max-w-4xl mx-auto mb-10">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Transferring Your Domain to ITBengal?
            </h2>
            <p className="text-slate-500 text-xs">
              Follow these simple steps to move your domains to our registry with zero downtime.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2 border-l-2 border-[#0052cc] pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-[#0052cc]/10 text-[#0052cc] h-5 w-5 rounded-full flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-slate-800">Request Auth (EPP) Code</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Obtain the unique EPP transfer authorization key from your current registrar's dashboard.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#0052cc] pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-[#0052cc]/10 text-[#0052cc] h-5 w-5 rounded-full flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-slate-800">Unlock the Domain</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Ensure that domain lock state is turned off at your current provider to allow the transfer route.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#0052cc] pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-[#0052cc]/10 text-[#0052cc] h-5 w-5 rounded-full flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-slate-800">Initiate Transfer</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Input your domain in the dashboard client portal, enter the EPP key, and complete BDT checkout.
              </p>
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <Link
              href="https://dashboard.itbengal.xyz/register"
              className="inline-flex items-center gap-1 bg-[#0052cc] hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow active:scale-[0.98]"
            >
              Start Transfer Now
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
