'use client';

import { useEffect, useState } from 'react';
import { Check, AlertCircle, RefreshCw, Layers, CheckCircle2, User } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  gatewayTransactionId: string;
  gatewayResponse: any;
}

interface InvoiceItem {
  id: string;
  description: string;
  total: number;
  type: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string;
  paidAt: string | null;
  organization: {
    name: string;
    slug: string;
  };
  payments: Payment[];
  items: InvoiceItem[];
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'PENDING_CLAIMS' | 'ALL'>('PENDING_CLAIMS');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Invoice[] }>('/admin/invoices');
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch platform invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleApprove = async (paymentId: string) => {
    setApprovingId(paymentId);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean }>('/billing/approve-bkash', {
        paymentId,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'bKash payment claim successfully approved!' });
        fetchInvoices();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Payment approval failed' });
    } finally {
      setApprovingId(null);
    }
  };

  // Filter invoices based on selection
  const filteredInvoices = invoices.filter((inv) => {
    if (filterType === 'PENDING_CLAIMS') {
      return (
        inv.status === 'PENDING' &&
        inv.payments.some((p) => p.status === 'PENDING' && p.paymentMethod === 'BKASH')
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Billing & Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review billing logs, invoice list, and approve manual bKash transaction claims.
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
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
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setFilterType('PENDING_CLAIMS')}
          className={cn(
            'py-3 px-6 font-semibold text-sm border-b-2 -mb-[2px] transition-all',
            filterType === 'PENDING_CLAIMS'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          Pending Claims (
          {invoices.filter((inv) =>
            inv.status === 'PENDING' &&
            inv.payments.some((p) => p.status === 'PENDING' && p.paymentMethod === 'BKASH')
          ).length}
          )
        </button>
        <button
          onClick={() => setFilterType('ALL')}
          className={cn(
            'py-3 px-6 font-semibold text-sm border-b-2 -mb-[2px] transition-all',
            filterType === 'ALL'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          All Invoices
        </button>
      </div>

      {/* Invoices grid/table */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl shimmer" />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterType === 'PENDING_CLAIMS'
              ? 'No bKash transaction claims are awaiting verification.'
              : 'No billing invoice logs exist on the system yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice / Organization</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4">Payment Info (TrxID)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
              {filteredInvoices.map((inv) => {
                const pendingPayment = inv.payments.find(
                  (p) => p.status === 'PENDING' && p.paymentMethod === 'BKASH'
                );

                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-gray-900 dark:text-white">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" /> {inv.organization?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-xs text-gray-500 dark:text-gray-400">
                        {inv.items.map((it) => it.description).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      ৳{inv.total}
                    </td>
                    <td className="px-6 py-4">
                      {pendingPayment ? (
                        <div className="text-xs space-y-0.5">
                          <span className="block font-semibold text-primary-600 dark:text-primary-400">
                            bKash: {pendingPayment.gatewayTransactionId}
                          </span>
                          <span className="block text-gray-400">
                            From: {pendingPayment.gatewayResponse?.senderNumber || 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset',
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                            : inv.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20'
                              : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/20'
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pendingPayment ? (
                        <button
                          onClick={() => handleApprove(pendingPayment.id)}
                          disabled={approvingId === pendingPayment.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-500 transition-all disabled:opacity-50"
                        >
                          {approvingId === pendingPayment.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          {approvingId === pendingPayment.id ? 'Approving...' : 'Approve Claim'}
                        </button>
                      ) : inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                          <CheckCircle2 className="h-4 w-4" /> Approved
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No Claim</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
