'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import api from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, getCartTotal } = useCartStore();
  
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const discount = 0;
  const total = subtotal - discount;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    setError(null);
    setSuccess(null);

    try {
      // Map store items to expected API input format
      const checkoutItems = items.map((item) => ({
        type: item.type,
        name: item.name,
        priceBdt: item.priceBdt,
        metadata: item.metadata,
      }));

      const res = await api.post<{ success: boolean; data: { id: string } }>('/billing/checkout', {
        items: checkoutItems,
      });

      if (res.success) {
        setSuccess('Checkout complete! Redirecting you to billing to complete payment...');
        clearCart();
        setTimeout(() => {
          router.push('/billing');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-primary-500" />
          Shopping Cart
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review your items and proceed to generate a consolidated checkout invoice.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-sm font-medium flex items-center gap-2">
          <Trash2 className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            Find domain names or hosting plans in the portal and add them to your cart.
          </p>
          <div className="mt-6">
            <Link
              href="/domains"
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse Domains
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cart items list */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-5 flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)]"
              >
                <div>
                  <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                    {item.type}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-[10px] text-gray-400">
                    {item.type === 'DOMAIN'
                      ? `1 Year TLD (.${item.metadata.tld})`
                      : 'Monthly subscription plan'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                    ৳{item.priceBdt}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-50 hover:text-white transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary sidebar */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-5">
              <h3 className="font-bold text-lg text-gray-950 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Discounts</span>
                  <span className="font-semibold text-emerald-600">-৳{discount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">৳0</span>
                </div>

                <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 dark:text-white pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span>
                  <span>৳{total}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
              >
                {checkingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {checkingOut ? 'Checking out...' : 'Proceed to Checkout'}
                {!checkingOut && <ArrowRight className="h-4 w-4" />}
              </button>

              <Link
                href="/domains"
                className="block text-center text-xs font-semibold text-primary-600 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
