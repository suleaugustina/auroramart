'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatNaira, ORDER_STATUS_LABELS, timeAgo } from '@/lib/utils';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { convexUserId } = useAuthStore();

  const data = useQuery(
    api.orders.getByUser,
    convexUserId ? { userId: convexUserId as any, page, limit: 10 } : 'skip'
  );

  const orders = data?.items ?? null;
  const meta   = data?.meta;

  return (
    <div className="container py-10 max-w-2xl">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-ink transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        My Account
      </Link>
      <h1 className="font-display text-3xl text-ink mb-8">Orders</h1>

      {orders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 skeleton rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-36 rounded" />
                <div className="h-3 skeleton w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 bg-paper-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="font-medium text-ink mb-1">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6">Your orders will appear here once you shop</p>
          <Link href="/shop/products" className="btn-primary btn-sm">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order: any) => {
              const sm = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
              return (
                <Link
                  key={order._id}
                  href={`/account/orders/${order._id}`}
                  className="card flex items-center gap-4 p-5 hover:shadow-lifted transition-all group"
                >
                  <div className="w-10 h-10 bg-paper-dark rounded flex items-center justify-center shrink-0">
                    <Package className="w-4.5 h-4.5 text-gray-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-ink font-mono">{order.orderNumber}</p>
                      <span className={`badge border text-[10px] ${sm.color}`}>{sm.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {timeAgo(order._creationTime)} &middot; {order.items?.length ?? 0} items &middot; {formatNaira(order.total)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" strokeWidth={1.75} />
                </Link>
              );
            })}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm disabled:opacity-40">Previous</button>
              <span className="btn-outline btn-sm pointer-events-none">{page} / {meta.totalPages}</span>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
