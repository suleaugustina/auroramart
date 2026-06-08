'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ChevronDown } from 'lucide-react';
import { formatNaira, ORDER_STATUS_LABELS, cn, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

const ALL_STATUSES = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded'];

export default function AdminOrdersPage() {
  const [page, setPage]   = useState(1);
  const [filter, setFilter] = useState('');

  const data         = useQuery(api.orders.adminList, { page, limit: 20, status: filter || undefined });
  const updateStatus = useMutation(api.orders.updateStatus);

  const orders = data?.items ?? null;
  const meta   = data?.meta;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">{meta?.total ?? 0} total orders</p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-all capitalize',
              filter === s ? 'bg-ink text-paper' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-paper">
            <tr>
              {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Action'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 uppercase tracking-widest font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders === null
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              : orders.map((order: any) => {
                  const sm = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
                  return (
                    <tr key={order._id} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono font-medium text-ink">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
                        <p className="text-xs text-gray-400">{order.shippingAddress?.city}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-ink">{formatNaira(order.total)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`badge border text-[10px] ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(order._creationTime)}</td>
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <select
                            defaultValue={order.status}
                            onChange={(e) => {
                              updateStatus({ id: order._id, status: e.target.value })
                                .then(() => toast.success('Status updated'))
                                .catch((err: any) => toast.error(err.message));
                            }}
                            className="appearance-none text-xs border border-gray-200 rounded px-2 py-1.5 bg-white pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" strokeWidth={2} />
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {meta.totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
