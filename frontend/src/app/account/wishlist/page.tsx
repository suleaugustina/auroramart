'use client';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeft, Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { convexUserId } = useAuthStore();
  const items = useQuery(
    api.functions.getWishlist,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const toggle = useMutation(api.functions.toggleWishlist);

  const handleRemove = async (productId: string) => {
    if (!convexUserId) return;
    await toggle({ userId: convexUserId as any, productId: productId as any });
    toast.success('Removed from wishlist');
  };

  return (
    <div className="container py-10 max-w-4xl">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-ink transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        My Account
      </Link>
      <h1 className="font-display text-3xl text-ink mb-8">Wishlist</h1>

      {items === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] skeleton rounded-md" />
              <div className="h-4 skeleton rounded" />
              <div className="h-4 skeleton w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" strokeWidth={1} />
          <p className="font-medium text-ink mb-1">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mb-6">Save products you love for later</p>
          <Link href="/shop/products" className="btn-primary btn-sm">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item: any) => item.product && (
            <ProductCard key={item._id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
