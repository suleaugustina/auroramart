'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { cn, formatNaira, calcDiscount, getProductImage } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority }: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const { open } = useCartStore();
  const { convexUserId } = useAuthStore();

  const getOrCreate = useMutation(api.functions.getOrCreateCart);
  const addToCart   = useMutation(api.functions.addToCart);
  const incrView    = useMutation(api.products.incrementView);

  const discount = calcDiscount(product.price, product.compareAtPrice ?? 0);
  const inStock  = product.stockQuantity > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;

    setAdding(true);
    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('_session') ?? undefined : undefined;
      const cartId = await getOrCreate({ userId: convexUserId as any ?? undefined, sessionId });
      await addToCart({ cartId, productId: product._id as any, quantity: 1 });
      toast.success(`${product.name} added to cart`);
      open();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn('group', className)}
    >
      <Link href={`/shop/products/${product.slug}`} onClick={() => incrView({ id: product._id as any }).catch(() => {})}>
        {/* Image container */}
        <div className="relative aspect-[4/3] bg-gray-100 rounded-md overflow-hidden mb-3">
          <Image
            src={getProductImage(product)}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-all duration-500 group-hover:scale-[1.03]',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoadingComplete={() => setImgLoaded(true)}
          />
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}

          {/* Labels */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="badge-orange text-[10px] font-bold tracking-wide">
                &minus;{discount}%
              </span>
            )}
            {product.isNewArrival && !discount && (
              <span className="badge badge-ink text-[10px] tracking-wide">New</span>
            )}
            {product.isBestSeller && (
              <span className="badge badge-gray text-[10px] tracking-wide">Bestseller</span>
            )}
            {!inStock && (
              <span className="badge badge-gray text-[10px] tracking-wide">Sold out</span>
            )}
          </div>

          {/* Quick add — appears on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 p-2.5">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-medium tracking-wide transition-colors',
                inStock
                  ? 'bg-ink text-paper hover:bg-ink-soft'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {adding
                ? <span className="w-3.5 h-3.5 border border-paper/40 border-t-paper rounded-full animate-spin" />
                : <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
              }
              {inStock ? 'Add to cart' : 'Out of stock'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          {product.brand && (
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">{product.brand}</p>
          )}

          <h3 className="text-sm text-gray-700 line-clamp-2 group-hover:text-ink transition-colors leading-snug">
            {product.name}
          </h3>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={cn('w-3 h-3', s <= Math.round(product.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
                    strokeWidth={1}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-400">({product.reviewCount})</span>
            </div>
          )}

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="price-main text-sm">{formatNaira(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="price-was">{formatNaira(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
