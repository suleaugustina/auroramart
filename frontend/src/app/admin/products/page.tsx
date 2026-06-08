'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Search, Trash2, Eye, Plus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatNaira, getProductImage, cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
  active:       'badge-success',
  draft:        'badge-gray',
  out_of_stock: 'badge-danger',
  discontinued: 'badge-gray',
};

export default function AdminProductsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const data     = useQuery(api.products.list, { page, limit: 20, status: undefined as any });
  const deleteFn = useMutation(api.products.remove);

  const products = data?.items?.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? null;
  const meta = data?.meta;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Products</h1>
          <p className="text-sm text-gray-400 mt-1">{meta?.total ?? 0} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-orange btn-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Product
        </Link>
      </div>

      <div className="card p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name…"
            className="input pl-9 text-sm" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-paper">
            <tr>
              {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 uppercase tracking-widest font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products === null ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 skeleton rounded" />
                      <div className="space-y-1.5"><div className="h-3.5 skeleton w-32 rounded" /><div className="h-2.5 skeleton w-20 rounded" /></div>
                    </div>
                  </td>
                  {[0,1,2,3,4].map((j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded w-20" /></td>)}
                </tr>
              ))
            ) : products.map((p: any) => (
              <tr key={p._id} className="hover:bg-paper transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      <Image src={getProductImage(p)} alt={p.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate max-w-[200px]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku ?? 'No SKU'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{p.brand || '—'}</td>
                <td className="px-4 py-3.5 text-sm font-semibold text-ink">{formatNaira(p.price)}</td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-sm font-medium', p.stockQuantity <= p.lowStockThreshold ? 'text-danger' : 'text-gray-700')}>
                    {p.stockQuantity}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`badge text-[10px] capitalize ${STATUS_COLOR[p.status] ?? 'badge-gray'}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <Link href={`/shop/products/${p.slug}`} target="_blank"
                      className="p-1.5 text-gray-400 hover:text-ink rounded hover:bg-paper-dark transition-all">
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                    <button onClick={() => confirm('Delete this product?') && deleteFn({ id: p._id }).catch((e: any) => toast.error(e.message))}
                      className="p-1.5 text-gray-400 hover:text-danger rounded hover:bg-red-50 transition-all">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {((page-1)*20)+1}–{Math.min(page*20, meta.total)} of {meta.total}</p>
            <div className="flex gap-1.5">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <button disabled={page===meta.totalPages} onClick={() => setPage(p=>p+1)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
