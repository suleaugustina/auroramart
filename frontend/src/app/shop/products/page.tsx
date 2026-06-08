'use client';
import { useState, useDeferredValue } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const SORT_OPTIONS = [
  { label: 'Newest',             value: '_creationTime:desc' },
  { label: 'Price: Low to High', value: 'price:asc' },
  { label: 'Price: High to Low', value: 'price:desc' },
  { label: 'Best Sellers',       value: 'salesCount:desc' },
  { label: 'Top Rated',          value: 'averageRating:desc' },
];

const PRICE_RANGES = [
  { label: 'Under ₦5,000',          min: 0,      max: 5000 },
  { label: '₦5,000 – ₦20,000',      min: 5000,   max: 20000 },
  { label: '₦20,000 – ₦100,000',    min: 20000,  max: 100000 },
  { label: '₦100,000 – ₦500,000',   min: 100000, max: 500000 },
  { label: 'Over ₦500,000',         min: 500000, max: undefined },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [page, setPage]             = useState(1);
  const [sidebarOpen, setSidebar]   = useState(false);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});

  const q             = searchParams.get('q') || '';
  const categorySlug  = searchParams.get('category') || '';
  const sortRaw       = searchParams.get('sort') || '_creationTime:desc';
  const [sortBy, sortOrder] = sortRaw.split(':');

  const categories   = useQuery(api.functions.listCategories, { withChildren: false }) ?? [];
  const categoryObj  = categories.find((c: any) => c.slug === categorySlug);

  const results = useQuery(api.products.list, {
    page,
    limit: 24,
    categoryId: categoryObj?._id,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    sortBy,
    sortOrder,
  });

  const products   = results?.items ?? null;
  const meta       = results?.meta;

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`/shop/products?${p}`);
    setPage(1);
  };

  return (
    <>
      {/* Category Hero Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] mb-8">
        <Image
          src={
            categorySlug === 'electronics-gadgets' ? 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop' :
            categorySlug === 'fashion-clothing' ? 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' :
            categorySlug === 'home-living' ? 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074&auto=format&fit=crop' :
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop' // Default / All Products
          }
          alt={categoryObj?.name ?? 'Shop'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-display font-medium mb-4 drop-shadow-md">
              {categoryObj?.name ?? 'All Products'}
            </h1>
            <p className="text-white/80 max-w-xl mx-auto drop-shadow-sm">
              Discover our exclusive collection of {categoryObj?.name?.toLowerCase() ?? 'premium goods'}. Curated just for you.
            </p>
          </div>
        </div>
      </div>

      <div className="container pb-10">
        {/* Page header (Filters/Sort) */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">
            {categorySlug ? categories.find((c: any) => c.slug === categorySlug)?.name ?? 'Products' : 'All Products'}
          </h1>
          {meta && (
            <p className="text-sm text-gray-500 mt-1">
              {meta.total.toLocaleString()} {meta.total === 1 ? 'product' : 'products'}
              {q ? ` for "${q}"` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortRaw}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input pr-8 text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={2} />
          </div>

          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="btn-outline btn-sm flex items-center gap-1.5 lg:hidden"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className={cn(
          'w-60 shrink-0',
          'hidden lg:block',
          sidebarOpen && '!block fixed inset-y-0 left-0 z-40 w-72 bg-paper overflow-y-auto p-6 shadow-float lg:static lg:shadow-none lg:p-0 lg:w-60'
        )}>
          {/* Mobile close */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <span className="text-sm font-medium text-ink">Filters</span>
            <button onClick={() => setSidebar(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => setParam('category', '')}
                className={cn(
                  'w-full text-left text-sm px-3 py-2 rounded transition-colors',
                  !categorySlug ? 'bg-ink text-paper' : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
                )}
              >
                All Categories
              </button>
              {categories.filter((c: any) => !c.parentId).map((cat: any) => (
                <button
                  key={cat._id}
                  onClick={() => setParam('category', cat.slug)}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded transition-colors',
                    categorySlug === cat.slug ? 'bg-ink text-paper' : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-8">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Price Range</h3>
            <div className="space-y-1">
              <button
                onClick={() => setPriceRange({})}
                className={cn(
                  'w-full text-left text-sm px-3 py-2 rounded transition-colors',
                  !priceRange.min && !priceRange.max ? 'bg-ink text-paper' : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
                )}
              >
                Any price
              </button>
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setPriceRange({ min: r.min, max: r.max })}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded transition-colors',
                    priceRange.min === r.min && priceRange.max === r.max
                      ? 'bg-ink text-paper'
                      : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick filters */}
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Filter by</h3>
            <div className="space-y-1">
              {[
                { label: 'New Arrivals', key: 'isNewArrival' },
                { label: 'Best Sellers', key: 'isBestSeller' },
                { label: 'Featured',     key: 'isFeatured' },
                { label: 'Free Shipping',key: 'freeShipping' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setParam(f.key, searchParams.get(f.key) ? '' : 'true')}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded transition-colors',
                    searchParams.get(f.key) === 'true' ? 'bg-ink text-paper' : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setSidebar(false)} />
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {products === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[4/3] skeleton rounded-md" />
                  <div className="h-3 skeleton w-20 rounded" />
                  <div className="h-4 skeleton rounded" />
                  <div className="h-4 skeleton w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="font-display text-2xl text-ink mb-2">No products found</p>
              <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={() => { router.push('/shop/products'); setPriceRange({}); }}
                className="btn-outline btn-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-12">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-outline btn-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                    const p = Math.max(1, page - 3) + i;
                    if (p > meta.totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          'w-9 h-9 text-sm rounded transition-colors',
                          p === page
                            ? 'bg-ink text-paper'
                            : 'border border-gray-200 text-gray-600 hover:bg-paper-dark hover:text-ink'
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page === meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-outline btn-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
