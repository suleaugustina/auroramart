'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatNaira } from '@/lib/utils';
import axios from 'axios';

type State = 'loading' | 'success' | 'failed';

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('loading');
  const [order, setOrder] = useState<any>(null);
  const { setCart } = useCartStore();

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (!ref) { setState('failed'); return; }

    axios.get(`/api/payments/verify/${ref}`)
      .then((res) => {
        setOrder(res.data.order ?? res.data);
        setState('success');
        setCart(null);
      })
      .catch(() => setState('failed'));
  }, [searchParams, setCart]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {state === 'loading' && (
          <div className="card p-12 text-center">
            <Loader2 className="w-12 h-12 text-ink animate-spin mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-display text-2xl text-ink mb-2">Verifying payment</h1>
            <p className="text-sm text-gray-400">Please wait. Do not refresh this page.</p>
          </div>
        )}

        {state === 'success' && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-green-500" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-2xl text-ink mb-2">Payment successful</h1>
            {order && (
              <>
                <p className="text-sm text-gray-500 mb-1">
                  Order <span className="font-mono font-medium text-ink">{order.orderNumber}</span>
                </p>
                <p className="font-display text-2xl text-ink mb-6">{formatNaira(order.total)}</p>
              </>
            )}
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              A confirmation has been sent to your email. Your order is being processed.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={order?._id ? `/account/orders/${order._id}` : '/account/orders'}
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                Track Your Order
              </Link>
              <Link href="/shop/products" className="btn-outline w-full justify-center py-3 text-sm">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {state === 'failed' && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-danger" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-2xl text-ink mb-2">Payment failed</h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Something went wrong. Your cart has not been cleared — you can try again.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/shop/checkout" className="btn-primary w-full justify-center py-3 text-sm">
                Try Again
              </Link>
              <Link href="/shop/products" className="btn-outline w-full justify-center py-3 text-sm">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
