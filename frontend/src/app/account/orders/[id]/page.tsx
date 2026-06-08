'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatNaira, ORDER_STATUS_LABELS, getProductImage } from '@/lib/utils';
import { ArrowLeft, MapPin, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';

const PROGRESS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { convexUserId } = useAuthStore();
  const order = useQuery(api.orders.getById, { id: params.id as any });
  const cancelOrder = useMutation(api.orders.cancel);

  if (order === undefined) return <div className="container py-16 text-center text-gray-400 text-sm">Loading order…</div>;
  if (!order) return <div className="container py-16 text-center text-gray-400 text-sm">Order not found.</div>;

  const sm = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  const stepIndex = PROGRESS.indexOf(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  const handleCancel = async () => {
    if (!convexUserId || !confirm('Cancel this order?')) return;
    try {
      await cancelOrder({ id: order._id as any, userId: convexUserId as any });
      toast.success('Order cancelled');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-ink transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        All Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Placed {new Date(order._creationTime).toLocaleDateString('en-NG', { dateStyle: 'long' })}
          </p>
        </div>
        <span className={`badge border text-xs ${sm.color}`}>{sm.label}</span>
      </div>

      {/* Progress bar */}
      {!['cancelled', 'refunded', 'refund_requested'].includes(order.status) && (
        <div className="card p-5 mb-5">
          <div className="flex items-center">
            {PROGRESS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${i <= stepIndex ? 'bg-ink text-paper' : 'bg-gray-100 text-gray-400'}`}>
                  {i < stepIndex ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : i + 1}
                </div>
                {i < PROGRESS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < stepIndex ? 'bg-ink' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2.5">
            {PROGRESS.map((s) => (
              <span key={s} className="text-[10px] text-gray-400 capitalize text-center" style={{ flex: 1 }}>
                {s === 'out_for_delivery' ? 'Delivery' : s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="card p-5 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-4">Items</h2>
        <div className="divide-y divide-gray-100">
          {(order.items ?? []).map((item: any) => (
            <div key={item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative w-16 h-16 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                <Image src={item.productImage ?? '/placeholder.jpg'} alt={item.productName} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink line-clamp-2">{item.productName}</p>
                {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-ink">{formatNaira(item.totalPrice)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Shipping */}
        <div className="card p-5">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} /> Delivery Address
          </h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" strokeWidth={1.75} /> Payment
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{formatNaira(order.shippingFee)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(order.discount)}</span></div>}
            <div className="flex justify-between font-semibold text-ink pt-2 border-t border-gray-100 text-base">
              <span>Total</span><span>{formatNaira(order.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Payment status</span>
              <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {canCancel && (
        <button onClick={handleCancel} className="btn-outline w-full justify-center text-sm text-danger border-red-200 hover:bg-red-50 hover:border-red-300">
          Cancel Order
        </button>
      )}
    </div>
  );
}
