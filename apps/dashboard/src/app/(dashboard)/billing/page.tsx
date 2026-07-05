'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Check, AlertCircle, Send, RefreshCw, Layers } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  cpu: number;
  memoryMb: number;
  storageMb: number;
  maxProjects: number;
  maxDomains: number;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: Plan;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  gatewayTransactionId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string;
  paidAt: string | null;
  payments: Payment[];
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // bKash Form fields
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [bkashSender, setBkashSender] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bkashAmount, setBkashAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansRes = await api.get<{ success: boolean; data: Plan[] }>('/billing/plans');
      if (plansRes.success) {
        setPlans(plansRes.data);
      }

      const subRes = await api.get<{ success: boolean; data: Subscription | null }>('/billing/subscription');
      if (subRes.success) {
        setSubscription(subRes.data);
      }

      const invoicesRes = await api.get<{ success: boolean; data: Invoice[] }>('/billing/invoices');
      if (invoicesRes.success) {
        setInvoices(invoicesRes.data);
        // Set first unpaid/pending invoice as active for payment
        const pending = invoicesRes.data.find(inv => inv.status === 'PENDING');
        if (pending) {
          setActiveInvoiceId(pending.id);
          setBkashAmount(String(pending.total));
        } else {
          setActiveInvoiceId(null);
          setBkashAmount('');
        }
      }
    } catch (err) {
      console.error('Failed to load billing details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; data: { invoice: Invoice } }>('/billing/subscribe', { planId });
      if (res.success) {
        setMessage({ type: 'success', text: 'Plan selected! Please complete the bKash payment below.' });
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to request subscription.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBkash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean }>('/billing/pay-bkash', {
        invoiceId: activeInvoiceId,
        senderNumber: bkashSender,
        trxId: bkashTrxId,
        amount: Number(bkashAmount),
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'bKash payment claim submitted! Wait for admin approval.' });
        setBkashSender('');
        setBkashTrxId('');
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit bKash payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Mock Admin bypass to approve PENDING payments instantly
  const handleApprovePayment = async (paymentId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean }>('/billing/approve-bkash', { paymentId });
      if (res.success) {
        setMessage({ type: 'success', text: 'Payment approved! Subscription activated.' });
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your hosting plans, make manual bKash payments, and view billing history.
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

      {loading ? (
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 shimmer" />
          <div className="h-64 rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 shimmer" />
        </div>
      ) : (
        <>
          {/* Active Subscription Summary */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {subscription ? `Current Plan: ${subscription.plan.name}` : 'No Active Plan'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription
                      ? `Billing Period: ${new Date(subscription.currentPeriodStart).toLocaleDateString()} to ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : 'Subscribe to a tier below to host and provision WordPress sites.'}
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={cn(
                    'inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ring-inset',
                    subscription?.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20'
                  )}
                >
                  {subscription ? subscription.status.replace('_', ' ') : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" /> Choose WordPress Tier
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans
                .filter((p) => p.slug.startsWith('wp-'))
                .map((plan) => {
                  const isCurrent = subscription?.planId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'relative rounded-2xl border bg-white dark:bg-gray-900/40 p-6 flex flex-col justify-between transition-all hover:border-indigo-500/40',
                        isCurrent
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 dark:border-gray-800'
                      )}
                    >
                      {isCurrent && (
                        <span className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                          Current Plan
                        </span>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                          <span className="text-3xl font-extrabold tracking-tight">৳{plan.priceMonthly}</span>
                          <span className="ml-1 text-sm font-semibold text-gray-500">/mo</span>
                        </div>
                        <ul className="mt-6 space-y-3.5 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2.5">
                            <Check className="h-4.5 w-4.5 text-indigo-500" />
                            <span>{plan.cpu} vCPU Core</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <Check className="h-4.5 w-4.5 text-indigo-500" />
                            <span>{plan.memoryMb / 1024} GB RAM</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <Check className="h-4.5 w-4.5 text-indigo-500" />
                            <span>{plan.storageMb / 1024} GB SSD Storage</span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <Check className="h-4.5 w-4.5 text-indigo-500" />
                            <span>Up to {plan.maxProjects} WP Installations</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={submitting || isCurrent}
                        className={cn(
                          'mt-8 w-full rounded-xl py-3 text-sm font-bold transition-all',
                          isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        )}
                      >
                        {isCurrent ? 'Active Plan' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* bKash Payment Form */}
          {activeInvoiceId && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 max-w-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-500" /> bKash Manual Payment
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please cash-in/send-money of <strong>৳{bkashAmount}</strong> to our merchant bKash number: 
                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded ml-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  +880 1700 000000
                </span>. Enter payment claims details below to activate.
              </p>

              <form onSubmit={handlePayBkash} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Your bKash Number (11 digits)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678"
                    value={bkashSender}
                    onChange={(e) => setBkashSender(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK8910A2CD"
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Amount Paid (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    disabled
                    value={bkashAmount}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment Claim'}
                </button>
              </form>
            </div>
          )}

          {/* Invoices List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-500" /> Invoice & Payment History
            </h2>
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions / Bypass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No billing logs or invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-4 font-mono font-medium">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 font-semibold">৳{inv.total}</td>
                        <td className="px-6 py-4">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : inv.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {/* Demo verification panel */}
                          {inv.status === 'PENDING' && inv.payments && inv.payments.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {inv.payments
                                .filter((p) => p.status === 'PENDING')
                                .map((payment) => (
                                  <button
                                    key={payment.id}
                                    onClick={() => handleApprovePayment(payment.id)}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-500 text-xs font-bold rounded-lg transition-all"
                                  >
                                    Demo Approve Claim ({payment.gatewayTransactionId})
                                  </button>
                                ))}
                            </div>
                          )}
                          {inv.status === 'PENDING' && (!inv.payments || inv.payments.length === 0) && (
                            <span className="text-xs text-gray-400 italic">Awaiting bKash submission</span>
                          )}
                          {inv.status === 'PAID' && (
                            <span className="text-xs text-emerald-500 font-medium">Payment Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
