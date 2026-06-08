'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Minus, Plus, Check, Star, ArrowLeft, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { cn, formatNaira, calcDiscount, getProductImage, getOrCreateSessionId } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product  = useQuery(api.products.getBySlug, { slug: params.slug });
  const related  = useQuery(api.products.getRelated,
    product ? { productId: product._id, limit: 5 } : 'skip'
  );
  const reviews  = useQuery(api.functions.getProductReviews,
    product ? { productId: product._id } : 'skip'
  ) ?? [];

  const [activeImg, setActiveImg]   = useState(0);
  const [qty, setQty]               = useState(1);
  const [variant, setVariant]       = useState<string | null>(null);
  const [added, setAdded]           = useState(false);
  const [adding, setAdding]         = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab]   = useState<'description' | 'specs' | 'reviews'>('description');

  const { open: openCart } = useCartStore();
  const { convexUserId }   = useAuthStore();

  const getOrCreate = useMutation(api.functions.getOrCreateCart);
  const addToCart   = useMutation(api.functions.addToCart);
  const incrView    = useMutation(api.products.incrementView);

  // Loading state
  if (product === undefined) return <ProductDetailSkeleton />;
  // Not found
  if (product === null) notFound();

  const images   = product.images?.length ? product.images : ['/placeholder.jpg'];
  const discount = calcDiscount(product.price, product.compareAtPrice ?? 0);
  const inStock  = product.stockQuantity > 0;

  const handleAddToCart = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    try {
      const sessionId = getOrCreateSessionId();
      const cartId = await getOrCreate({
        userId: convexUserId as any ?? undefined,
        sessionId,
      });
      await addToCart({ cartId, productId: product._id, quantity: qty, variantId: variant ?? undefined });
      setAdded(true);
      openCart();
      setTimeout(() => setAdded(false), 2500);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop/products" className="hover:text-ink transition-colors">Products</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 mb-20">

        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[activeImg]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge-orange text-xs font-bold">
                &minus;{discount}%
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'relative w-20 h-20 shrink-0 rounded border-2 overflow-hidden transition-all',
                    i === activeImg ? 'border-ink' : 'border-gray-200 hover:border-gray-400'
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{product.brand}</p>
          )}

          <h1 className="font-display text-3xl lg:text-4xl text-ink mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={cn('w-4 h-4', s <= Math.round(product.averageRating)
                      ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                    )}
                    strokeWidth={1}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-sm text-gray-500 hover:text-ink transition-colors"
              >
                {product.averageRating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </button>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
            <span className="font-display text-3xl text-ink">{formatNaira(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="price-was text-base">{formatNaira(product.compareAtPrice)}</span>
                <span className="price-save">Save {formatNaira(product.compareAtPrice - product.price)}</span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-gray-600 leading-relaxed mb-6 text-sm">{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.hasVariants && product.variants?.length && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Select option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    className={cn(
                      'px-4 py-2 rounded border text-sm transition-all',
                      variant === v.id
                        ? 'border-ink bg-ink text-paper'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add */}
          <div className="flex items-center gap-3 mb-6">
            {/* Qty */}
            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-paper-dark transition-colors"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <span className="w-12 text-center text-sm font-medium text-ink border-x border-gray-200 h-11 flex items-center justify-center">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                disabled={qty >= product.stockQuantity}
                className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-paper-dark disabled:opacity-30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Stock status */}
            <span className={cn(
              'text-xs font-medium',
              inStock
                ? product.stockQuantity <= product.lowStockThreshold
                  ? 'text-amber-600'
                  : 'text-green-600'
                : 'text-red-600'
            )}>
              {inStock
                ? product.stockQuantity <= product.lowStockThreshold
                  ? `Only ${product.stockQuantity} left`
                  : 'In stock'
                : 'Out of stock'
              }
            </span>
          </div>

          {/* CTA */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 py-4 rounded text-sm font-medium tracking-wide transition-all',
                inStock
                  ? added
                    ? 'bg-green-600 text-white'
                    : 'bg-ink hover:bg-ink-soft text-paper'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {adding ? (
                <span className="w-4 h-4 border border-paper/40 border-t-paper rounded-full animate-spin" />
              ) : added ? (
                <><Check className="w-4 h-4" strokeWidth={2.5} /> Added to cart</>
              ) : (
                <><ShoppingBag className="w-4 h-4" strokeWidth={1.75} /> Add to cart</>
              )}
            </button>

            <button
              onClick={() => setWishlisted(!wishlisted)}
              className={cn(
                'w-12 h-12 flex items-center justify-center rounded border transition-all',
                wishlisted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              )}
            >
              <Heart className={cn('w-4.5 h-4.5', wishlisted && 'fill-red-500')} strokeWidth={1.75} />
            </button>
          </div>

          {/* Trust signals */}
          <div className="space-y-2.5 border-t border-gray-100 pt-6">
            {[
              { icon: Truck,        text: product.freeShipping ? 'Free delivery on this item' : 'Free delivery on orders over ₦50,000' },
              { icon: ShieldCheck,  text: 'Secure payment via Paystack' },
              { icon: RotateCcw,    text: '7-day return policy' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-500">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="border-b border-gray-200 mb-8 flex gap-0">
          {(['description', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-ink text-ink'
                  : 'border-transparent text-gray-500 hover:text-ink'
              )}
            >
              {tab}{tab === 'reviews' ? ` (${reviews.length})` : ''}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && (
              <div className="max-w-2xl prose prose-gray text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-xl">
                {product.attributes && Object.keys(product.attributes).length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(product.attributes).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-3 pr-6 text-gray-500 w-40">{k}</td>
                          <td className="py-3 font-medium text-ink">{v as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-sm">No specifications listed.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-2xl">
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product.</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((r: any) => (
                      <div key={r._id} className="border-b border-gray-100 pb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {r.user?.firstName} {r.user?.lastName}
                            </p>
                            {r.isVerifiedPurchase && (
                              <span className="text-xs text-green-600">Verified purchase</span>
                            )}
                          </div>
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={cn('w-3.5 h-3.5', s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} strokeWidth={1} />
                            ))}
                          </div>
                        </div>
                        {r.title && <p className="text-sm font-medium text-ink mb-1">{r.title}</p>}
                        {r.body && <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-ink mb-8">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {related.map((p: any) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container py-10">
      <div className="h-3 skeleton w-56 mb-8 rounded" />
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-3">
          <div className="aspect-square skeleton rounded-lg" />
          <div className="flex gap-2">
            {[0,1,2,3].map((i) => <div key={i} className="w-20 h-20 skeleton rounded" />)}
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="h-3 skeleton w-20 rounded" />
          <div className="h-10 skeleton w-3/4 rounded" />
          <div className="h-4 skeleton w-32 rounded" />
          <div className="h-8 skeleton w-40 rounded" />
          <div className="h-16 skeleton rounded" />
          <div className="h-12 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}
