'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Globe, Key, Clock, ShieldAlert, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface WordPressSite {
  id: string;
  siteTitle: string;
}

interface Application {
  id: string;
  domain: string;
  customDomain: string | null;
  sslStatus: string;
  wordpressSite: WordPressSite | null;
  project?: {
    name: string;
  } | null;
}

interface SSLCertificate {
  id: string;
  domainName: string;
  type: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  certificatePath: string | null;
}

interface DnsCheckResult {
  isValid: boolean;
  resolvedIps: string[];
  platformIp: string;
  message: string;
}

export default function SslPage() {
  const [sites, setSites] = useState<Application[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [certificates, setCertificates] = useState<SSLCertificate[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [runningAction, setRunningAction] = useState(false);

  // DNS pre-check states
  const [checkingDns, setCheckingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<DnsCheckResult | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSites = async () => {
    setLoadingSites(true);
    try {
      const res = await api.get<{ success: boolean; data: Application[] }>('/ssl');
      if (res.success) {
        setSites(res.data);
        const firstSite = res.data[0];
        if (firstSite) {
          setSelectedSiteId(firstSite.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sites for SSL:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchCertificates = async (appId: string) => {
    if (!appId) return;
    setLoadingCerts(true);
    setDnsResult(null);
    try {
      const res = await api.get<{ success: boolean; data: SSLCertificate[] }>(`/ssl/${appId}`);
      if (res.success) {
        setCertificates(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      fetchCertificates(selectedSiteId);
    } else {
      setCertificates([]);
    }
  }, [selectedSiteId]);

  const selectedSite = sites.find(s => s.id === selectedSiteId);

  const handleDnsCheck = async (domain: string) => {
    setCheckingDns(true);
    setDnsResult(null);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; data: DnsCheckResult }>('/ssl/check-dns', { domainName: domain });
      if (res.success) {
        setDnsResult(res.data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'DNS check failed' });
    } finally {
      setCheckingDns(false);
    }
  };

  const handleProvision = async (domain: string) => {
    if (!selectedSiteId) return;
    setRunningAction(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; data: SSLCertificate }>('/ssl/provision', {
        applicationId: selectedSiteId,
        domainName: domain
      });
      if (res.success) {
        setMessage({ type: 'success', text: `SSL certificate successfully provisioned for ${domain}` });
        fetchCertificates(selectedSiteId);
        // Refresh site status in local array
        setSites(prev => prev.map(s => s.id === selectedSiteId ? { ...s, sslStatus: 'ACTIVE' } : s));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'SSL provisioning failed' });
    } finally {
      setRunningAction(false);
    }
  };

  const handleRenew = async (certId: string) => {
    setRunningAction(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean }>(`/ssl/renew/${certId}`);
      if (res.success) {
        setMessage({ type: 'success', text: 'Certificate renewal succeeded!' });
        fetchCertificates(selectedSiteId);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Certificate renewal failed' });
    } finally {
      setRunningAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          SSL Certificate Manager
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Provision automatic Let's Encrypt TLS certificates and configure custom domains.
        </p>
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

      {loadingSites ? (
        <div className="h-48 rounded-2xl bg-white dark:bg-gray-900/30 border border-slate-100 dark:border-gray-800 shimmer" />
      ) : sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-100 dark:border-gray-800 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No active instances</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a WordPress site first to configure SSL.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Sidebar selector */}
          <div className="md:col-span-1 rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Select site</h3>
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSiteId(site.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all text-sm font-medium flex items-center justify-between',
                  selectedSiteId === site.id
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
              >
                <div className="truncate max-w-[140px]">
                  <span className="block font-bold">{site.wordpressSite?.siteTitle || site.project?.name || 'General Application'}</span>
                  <span className={cn('text-xs block', selectedSiteId === site.id ? 'text-primary-200' : 'text-gray-400')}>
                    {site.domain}
                  </span>
                </div>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    site.sslStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Main workspace */}
          <div className="md:col-span-2 space-y-6">
            {selectedSite && (
              <>
                {/* Domain & Certificate Status card */}
                <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">SSL Configuration</h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                        selectedSite.sslStatus === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20'
                      )}
                    >
                      {selectedSite.sslStatus === 'ACTIVE' ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                      {selectedSite.sslStatus}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Primary domain */}
                    <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase">Primary Domain</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{selectedSite.domain}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDnsCheck(selectedSite.domain)}
                          disabled={checkingDns || runningAction}
                          className="px-3 py-1.5 border border-slate-100 dark:border-gray-800 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-1"
                        >
                          <RefreshCw className={cn('h-3 w-3', checkingDns && 'animate-spin')} /> DNS Check
                        </button>
                        <button
                          onClick={() => handleProvision(selectedSite.domain)}
                          disabled={runningAction || checkingDns || selectedSite.sslStatus === 'ACTIVE'}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-500 transition-all"
                        >
                          Provision SSL
                        </button>
                      </div>
                    </div>

                    {/* Custom domain if exists */}
                    {selectedSite.customDomain && (
                      <div className="border-t border-gray-100 dark:border-gray-800/50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <span className="block text-xs font-semibold text-gray-400 uppercase">Custom Domain</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{selectedSite.customDomain}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDnsCheck(selectedSite.customDomain!)}
                            disabled={checkingDns || runningAction}
                            className="px-3 py-1.5 border border-slate-100 dark:border-gray-800 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-1"
                          >
                            <RefreshCw className={cn('h-3 w-3', checkingDns && 'animate-spin')} /> DNS Check
                          </button>
                          <button
                            onClick={() => handleProvision(selectedSite.customDomain!)}
                            disabled={runningAction || checkingDns}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-500 transition-all"
                          >
                            Provision SSL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DNS Check response panel */}
                {dnsResult && (
                  <div
                    className={cn(
                      'rounded-2xl border p-6 space-y-2',
                      dnsResult.isValid
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400'
                    )}
                  >
                    <h4 className="font-bold flex items-center gap-1.5 text-sm">
                      {dnsResult.isValid ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                      )}
                      DNS check results
                    </h4>
                    <p className="text-xs">{dnsResult.message}</p>
                    {dnsResult.resolvedIps.length > 0 && (
                      <span className="block text-[10px] uppercase text-gray-400">
                        Resolved IP: {dnsResult.resolvedIps.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Existing Certificates Detail */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Certificates History</h3>
                  {loadingCerts ? (
                    <div className="h-24 rounded-2xl bg-white dark:bg-gray-900/30 border border-slate-100 dark:border-gray-800 shimmer" />
                  ) : certificates.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-6 text-center text-sm text-gray-400">
                      No active certificates registered for this installation yet.
                    </div>
                  ) : (
                    certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-4"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-semibold text-primary-500 flex items-center gap-1">
                              <Key className="h-3.5 w-3.5" /> Let's Encrypt (RSA-2048)
                            </span>
                            <h4 className="font-bold text-gray-800 dark:text-white mt-1">{cert.domainName}</h4>
                          </div>
                          <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-xs font-semibold">
                            {cert.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-gray-800/40 py-3 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="block text-[10px] uppercase text-gray-400">Issued At</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-gray-400 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> Expires At
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] font-mono text-gray-400 truncate max-w-[240px]">
                            {cert.certificatePath}
                          </span>
                          <button
                            onClick={() => handleRenew(cert.id)}
                            disabled={runningAction || checkingDns}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold rounded-lg transition-all"
                          >
                            Force Renew
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
