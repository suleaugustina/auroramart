'use client';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('salesCount');
  const [sortOrder, setSortOrder] = useState('desc');

  const category = useQuery(api.functions.getCategoryBySlug, { slug: params.slug });
  const results  = useQuery(
    api.products.list,
    category ? { categoryId: category._id, page, limit: 24, sortBy, sortOrder } : 'skip'
  );

  if (category === null) notFound();

  const products   = results?.items ?? null;
  const meta       = results?.meta;

  const bannerImage = 
    params.slug === 'electronics-gadgets' ? 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop' :
    params.slug === 'fashion-clothing' ? 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' :
    params.slug === 'home-living' ? 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074&auto=format&fit=crop' :
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';

  return (
    <>
      {/* Category Hero Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] mb-8">
        <Image
          src={bannerImage}
          alt={category?.name ?? 'Category'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-display font-medium mb-4 drop-shadow-md">
              {category?.name ?? 'Category'}
            </h1>
            {category?.description ? (
              <p className="text-white/80 max-w-xl mx-auto drop-shadow-sm px-4">
                {category.description}
              </p>
            ) : (
              <p className="text-white/80 max-w-xl mx-auto drop-shadow-sm px-4">
                Discover our exclusive collection. Curated just for you.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container pb-10">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Products</h2>
            {meta && (
              <p className="text-sm text-gray-500 mt-1">{meta.total.toLocaleString()} products found</p>
            )}
          </div>
        <div className="relative shrink-0">
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => { const [s,o] = e.target.value.split(':'); setSortBy(s); setSortOrder(o); }}
            className="input text-sm pr-8 appearance-none cursor-pointer"
          >
            <option value="salesCount:desc">Best Sellers</option>
            <option value="_creationTime:desc">Newest</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="averageRating:desc">Top Rated</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={2} />
        </div>
      </div>

      {products === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] skeleton rounded-md" />
              <div className="h-3 skeleton w-20 rounded" />
              <div className="h-4 skeleton rounded" />
              <div className="h-4 skeleton w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {products.map((p: any) => <ProductCard key={p._id} product={p} />)}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-12">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <span className="btn-outline btn-sm pointer-events-none">{page} / {meta.totalPages}</span>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
