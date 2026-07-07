'use client';

import { useEffect, useState } from 'react';
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Search,
  Trash2,
  Edit2,
  RefreshCw,
  Server,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  priority: number | null;
}

interface Domain {
  id: string;
  name: string;
  status: string;
  registrationDate: string | null;
  expiryDate: string | null;
  autoRenew: boolean;
  whoisPrivacy: boolean;
  dnsRecords?: DnsRecord[];
}

interface SearchResult {
  domain: string;
  isAvailable: boolean;
  priceBdt: number;
  tld: string;
}

export default function DomainsPage() {
  const { addItem, items: cartItems } = useCartStore();

  const [activeTab, setActiveTab] = useState<'MY_DOMAINS' | 'SEARCH'>('MY_DOMAINS');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Detail / DNS Editor states
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  
  // DNS form states
  const [dnsName, setDnsName] = useState('');
  const [dnsType, setDnsType] = useState('A');
  const [dnsContent, setDnsContent] = useState('');
  const [dnsTtl, setDnsTtl] = useState('3600');
  const [dnsPriority, setDnsPriority] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Domain[] }>('/domains');
      if (res.success) {
        setDomains(res.data);
      }
    } catch (err) {
      console.error('Failed to load registered domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('query') || params.get('search');
      if (query) {
        setSearchQuery(query);
        setActiveTab('SEARCH');
        
        // Trigger auto-search
        const autoSearch = async () => {
          setSearching(true);
          setMessage(null);
          try {
            const res = await api.post<{ success: boolean; data: SearchResult[] }>('/domains/search', {
              domainName: query,
            });
            if (res.success) {
              setSearchResults(res.data);
            }
          } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Domain search failed' });
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
    if (!searchQuery) return;
    setSearching(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; data: SearchResult[] }>('/domains/search', {
        domainName: searchQuery,
      });
      if (res.success) {
        setSearchResults(res.data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Domain search failed' });
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCart = (domainName: string, tld: string, priceBdt: number) => {
    addItem({
      id: `domain:${domainName}`,
      type: 'DOMAIN',
      name: domainName,
      priceBdt,
      metadata: { tld },
    });
    setMessage({
      type: 'success',
      text: `Added ${domainName} to your shopping cart!`,
    });
  };



  const handleToggleWhois = async (domainId: string, currentVal: boolean) => {
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: Domain }>(`/domains/${domainId}/whois`, {
        enabled: !currentVal,
      });
      if (res.success) {
        setDomains(prev => prev.map(d => d.id === domainId ? { ...d, whoisPrivacy: !currentVal } : d));
        if (selectedDomain && selectedDomain.id === domainId) {
          setSelectedDomain(prev => prev ? { ...prev, whoisPrivacy: !currentVal } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle WHOIS privacy:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDnsRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    setActionLoading(true);
    try {
      const body = {
        name: dnsName,
        type: dnsType,
        content: dnsContent,
        ttl: Number(dnsTtl),
        priority: dnsPriority ? Number(dnsPriority) : undefined,
      };

      let res;
      if (editingRecordId) {
        res = await api.put<{ success: boolean; data: DnsRecord }>(
          `/domains/${selectedDomain.id}/dns/${editingRecordId}`,
          body
        );
      } else {
        res = await api.post<{ success: boolean; data: DnsRecord }>(
          `/domains/${selectedDomain.id}/dns`,
          body
        );
      }

      if (res.success) {
        // Reset form
        setDnsName('');
        setDnsContent('');
        setDnsPriority('');
        setEditingRecordId(null);
        
        // Refresh domain details
        const detailsRes = await api.get<{ success: boolean; data: Domain }>(`/domains/${selectedDomain.id}`);
        if (detailsRes.success) {
          setSelectedDomain(detailsRes.data);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save DNS record' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDnsRecord = async (recordId: string) => {
    if (!selectedDomain) return;
    if (!confirm('Are you sure you want to delete this DNS record?')) return;

    setActionLoading(true);
    try {
      const res = await api.delete<{ success: boolean }>(`/domains/${selectedDomain.id}/dns/${recordId}`);
      if (res.success) {
        const detailsRes = await api.get<{ success: boolean; data: Domain }>(`/domains/${selectedDomain.id}`);
        if (detailsRes.success) {
          setSelectedDomain(detailsRes.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete DNS record:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditDnsRecord = (record: DnsRecord) => {
    setEditingRecordId(record.id);
    setDnsName(record.name);
    setDnsType(record.type);
    setDnsContent(record.content);
    setDnsTtl(String(record.ttl));
    setDnsPriority(record.priority ? String(record.priority) : '');
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Domain Names & DNS
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search, purchase, and manage custom domain names and coordinate records inside your network.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-4 text-sm font-medium',
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          )}
        >
          <AlertCircle className="h-5 w-5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-gray-800">
        <button
          onClick={() => {
            setActiveTab('MY_DOMAINS');
            setSelectedDomain(null);
          }}
          className={cn(
            'py-3.5 px-6 font-semibold text-sm border-b-2 -mb-[2px] transition-all',
            activeTab === 'MY_DOMAINS' && !selectedDomain
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          My Domains
        </button>
        <button
          onClick={() => {
            setActiveTab('SEARCH');
            setSelectedDomain(null);
          }}
          className={cn(
            'py-3.5 px-6 font-semibold text-sm border-b-2 -mb-[2px] transition-all',
            activeTab === 'SEARCH'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          Register TLDs
        </button>
        {selectedDomain && (
          <span className="py-3.5 px-6 font-semibold text-sm border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 -mb-[2px]">
            Manage: {selectedDomain.name}
          </span>
        )}
      </div>

      {selectedDomain ? (
        /* Domain Details & DNS Editor view */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Domain parameters sidebar */}
          <div className="md:col-span-1 space-y-6">
            <button
              onClick={() => setSelectedDomain(null)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
            >
              <ChevronLeft className="h-4 w-4" /> Back to List
            </button>

            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-5">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Globe className="h-5 w-5" />
                <h3 className="font-bold text-lg">{selectedDomain.name}</h3>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-150 dark:border-gray-800 text-xs">
                <div>
                  <span className="block text-gray-400 uppercase tracking-wider mb-1">Status</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 font-bold',
                      selectedDomain.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {selectedDomain.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <span className="block text-gray-400 uppercase tracking-wider mb-1">Registered</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {selectedDomain.registrationDate
                      ? new Date(selectedDomain.registrationDate).toLocaleDateString()
                      : 'Pending Invoice Approval'}
                  </span>
                </div>

                <div>
                  <span className="block text-gray-400 uppercase tracking-wider mb-1">Expiry Date</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {selectedDomain.expiryDate
                      ? new Date(selectedDomain.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                {/* WHOIS Switch */}
                <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-800 pt-4">
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">WHOIS Privacy</span>
                    <span className="text-[10px] text-gray-400">Shield owner email and contacts</span>
                  </div>
                  <button
                    onClick={() => handleToggleWhois(selectedDomain.id, selectedDomain.whoisPrivacy)}
                    disabled={actionLoading}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none',
                      selectedDomain.whoisPrivacy ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-800'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                        selectedDomain.whoisPrivacy ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DNS Editor workspace */}
          <div className="md:col-span-2 space-y-6">
            {/* DNS list */}
            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Server className="h-5 w-5 text-primary-500" /> DNS Records & Zone File
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs divide-y divide-gray-150 dark:divide-gray-800">
                  <thead className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Host / Name</th>
                      <th className="py-3 px-2">Value / Target</th>
                      <th className="py-3 px-2">TTL</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                    {selectedDomain.dnsRecords && selectedDomain.dnsRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                          No custom DNS records found.
                        </td>
                      </tr>
                    ) : (
                      selectedDomain.dnsRecords?.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-2">
                            <span className="rounded bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 text-primary-600 dark:text-primary-400 font-bold">
                              {record.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-mono">{record.name}</td>
                          <td className="py-3.5 px-2 font-mono truncate max-w-[180px]" title={record.content}>
                            {record.priority ? `[${record.priority}] ` : ''}{record.content}
                          </td>
                          <td className="py-3.5 px-2 font-mono text-gray-400">{record.ttl}s</td>
                          <td className="py-3.5 px-2 text-right flex gap-1 justify-end">
                            <button
                              onClick={() => startEditDnsRecord(record)}
                              className="p-1 rounded bg-gray-100 hover:bg-primary-500 hover:text-white dark:bg-gray-800 text-gray-500 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDnsRecord(record.id)}
                              className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DNS Add/Edit Form */}
            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                {editingRecordId ? 'Edit DNS Record' : 'Add Custom DNS Record'}
              </h3>
              <form onSubmit={handleAddDnsRecord} className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Type</label>
                  <select
                    value={dnsType}
                    onChange={(e) => setDnsType(e.target.value)}
                    className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-primary-500"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                    <option value="MX">MX (Mail Exchange)</option>
                    <option value="TXT">TXT (Text)</option>
                    <option value="SRV">SRV (Service)</option>
                    <option value="NS">NS (Nameserver)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Host / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @ or www"
                    value={dnsName}
                    onChange={(e) => setDnsName(e.target.value)}
                    className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Value / Content</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.1.1"
                    value={dnsContent}
                    onChange={(e) => setDnsContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">TTL</label>
                  <input
                    type="number"
                    required
                    value={dnsTtl}
                    onChange={(e) => setDnsTtl(e.target.value)}
                    className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                {dnsType === 'MX' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Priority</label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      value={dnsPriority}
                      onChange={(e) => setDnsPriority(e.target.value)}
                      className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                )}

                <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/40">
                  {editingRecordId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecordId(null);
                        setDnsName('');
                        setDnsContent('');
                      }}
                      className="px-4 py-2 border border-slate-100 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-500"
                  >
                    {editingRecordId ? 'Update Record' : 'Add Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : activeTab === 'MY_DOMAINS' ? (
        /* Domains List */
        <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
          ) : domains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-3.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-500 mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No registered domains</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Get started by searching and purchasing a domain under the "Register TLDs" tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">WHOIS Guard</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                  {domains.map((dom) => (
                    <tr key={dom.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span>{dom.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                            dom.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20'
                          )}
                        >
                          {dom.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {dom.expiryDate ? new Date(dom.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-semibold',
                            dom.whoisPrivacy ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                          )}
                        >
                          {dom.whoisPrivacy ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                          {dom.whoisPrivacy ? 'Shielded' : 'Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-1">
                        <button
                          onClick={() => setSelectedDomain(dom)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                        >
                          DNS & Settings <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Availability Search View */
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Check Domain Availability</h3>
            <p className="text-xs text-gray-400 mb-6">Enter a domain name to check availability and purchase costs.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. mynewbrand (no extension needed)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-500 transition-all flex items-center gap-2"
              >
                {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                {searching ? 'Checking...' : 'Check Availability'}
              </button>
            </form>
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Search Results</h3>
              <div className="divide-y divide-gray-150 dark:divide-gray-800/80">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div>
                      <span className="font-bold text-sm text-gray-900 dark:text-white block">{result.domain}</span>
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          result.isAvailable ? 'text-emerald-500' : 'text-rose-500'
                        )}
                      >
                        {result.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    {result.isAvailable ? (
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white">৳{result.priceBdt}/yr</span>
                        {cartItems.some((item) => item.id === `domain:${result.domain}`) ? (
                          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-500/20">
                            Added to Cart
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(result.domain, result.tld, result.priceBdt)}
                            className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-500 rounded-xl text-xs font-bold transition-all"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Taken</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
