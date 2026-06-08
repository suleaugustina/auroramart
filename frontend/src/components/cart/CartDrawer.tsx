'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatNaira, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';

export function CartDrawer() {
  const { cart, isOpen, close, subtotal, itemCount, setCart } = useCartStore();
  const { convexUserId } = useAuthStore();

  const updateItem  = useMutation(api.functions.updateCartItem);
  const removeItem  = useMutation(api.functions.removeFromCart);

  const shippingFee = subtotal >= 50000 ? 0 : 1500;
  const total = subtotal + shippingFee;

  const handleUpdate = async (itemId: string, quantity: number) => {
    try {
      await updateItem({ itemId: itemId as any, quantity });
      // Optimistic update handled by Convex reactive query
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem({ itemId: itemId as any });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
            onClick={close}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-paper flex flex-col shadow-float border-l border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="font-display text-lg text-ink">
                Cart
                {itemCount > 0 && (
                  <span className="font-sans text-sm text-gray-400 ml-2 font-normal">
                    ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h2>
              <button
                onClick={close}
                className="p-2 text-gray-500 hover:text-ink hover:bg-paper-dark rounded transition-colors"
              >
                <X className="w-4.5 h-4.5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {!cart?.items?.length ? (
                <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                  <div className="w-16 h-16 bg-paper-dark rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-600 mb-1 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mb-6">Add items to get started</p>
                  <button
                    onClick={close}
                    className="btn-outline btn-sm"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex gap-4 px-6 py-4 border-b border-gray-100 hover:bg-paper/50 transition-colors">
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        <Image
                          src={getProductImage(item.product)}
                          alt={item.product?.name ?? ''}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/shop/products/${item.product?.slug ?? ''}`}
                          onClick={close}
                          className="text-sm text-gray-800 hover:text-ink font-medium line-clamp-2 leading-tight"
                        >
                          {item.product?.name}
                        </Link>
                        <p className="text-sm font-semibold text-ink mt-1.5">
                          {formatNaira(item.product?.price ?? item.priceAtAdd)}
                        </p>

                        <div className="flex items-center justify-between mt-2.5">
                          {/* Qty controls */}
                          <div className="flex items-center gap-0 border border-gray-200 rounded overflow-hidden">
                            <button
                              onClick={() => handleUpdate(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-ink border-x border-gray-200 h-7 flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdate(item._id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item._id)}
                            className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart?.items?.length ? (
              <div className="border-t border-gray-200 px-6 py-5 bg-white space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatNaira(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                      {shippingFee === 0 ? 'Free' : formatNaira(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base text-ink pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatNaira(total)}</span>
                  </div>
                </div>

                <Link
                  href="/shop/checkout"
                  onClick={close}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-ink hover:bg-ink-soft text-paper rounded text-sm font-medium tracking-wide transition-colors"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>

                <button
                  onClick={close}
                  className="w-full text-center text-sm text-gray-500 hover:text-ink transition-colors py-1"
                >
                  Continue shopping
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
