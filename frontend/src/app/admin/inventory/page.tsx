'use client';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { formatNaira, getProductImage, cn } from '@/lib/utils';

export default function AdminInventoryPage() {
  const allProducts = useQuery(api.products.list, { page: 1, limit: 200, status: 'active' as any }) ?? null;
  const outOfStock  = useQuery(api.products.list, { page: 1, limit: 100, status: 'out_of_stock' as any }) ?? null;

  const lowStock = (allProducts?.items ?? []).filter(
    (p: any) => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
  );
  const oos = outOfStock?.items ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink">Inventory</h1>
        <p className="text-sm text-gray-400 mt-1">Monitor stock levels and reorder alerts</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingDown, label: 'Low Stock',      value: lowStock.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: AlertTriangle, label: 'Out of Stock',  value: oos.length,      color: 'text-danger',   bg: 'bg-red-50' },
          { icon: Package,       label: 'Tracked SKUs',  value: allProducts?.meta?.total ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="font-display text-2xl text-ink">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div className="card overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-ink">Low Stock Alert ({lowStock.length})</h2>
          </div>
          <StockTable products={lowStock} warn />
        </div>
      )}

      {/* Out of stock table */}
      {oos.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-ink">Out of Stock ({oos.length})</h2>
          </div>
          <StockTable products={oos} />
        </div>
      )}

      {!lowStock.length && !oos.length && allProducts !== null && (
        <div className="card p-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-gray-500">All products are well stocked</p>
        </div>
      )}
    </div>
  );
}

function StockTable({ products, warn = false }: { products: any[]; warn?: boolean }) {
  return (
    <table className="w-full">
      <thead className="bg-paper border-b border-gray-100">
        <tr>
          {['Product', 'SKU', 'In Stock', 'Min Threshold', 'Sales'].map((h) => (
            <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 uppercase tracking-widest font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {products.map((p: any) => (
          <tr key={p._id} className="hover:bg-paper transition-colors">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                  <Image src={getProductImage(p)} alt={p.name} fill className="object-cover" sizes="36px" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.brand}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3.5 font-mono text-xs text-gray-400">{p.sku ?? '—'}</td>
            <td className="px-4 py-3.5">
              <span className={cn('text-sm font-bold', warn ? 'text-amber-600' : 'text-danger')}>
                {p.stockQuantity}
              </span>
            </td>
            <td className="px-4 py-3.5 text-sm text-gray-500">{p.lowStockThreshold}</td>
            <td className="px-4 py-3.5 text-sm text-gray-700">{p.salesCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
