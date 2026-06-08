'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, CreditCard, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatNaira, getProductImage, NIGERIAN_STATES } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

const schema = z.object({
  fullName: z.string().min(3, 'Full name required'),
  phone:    z.string().min(10, 'Valid phone number required'),
  street:   z.string().min(5, 'Street address required'),
  city:     z.string().min(2, 'City required'),
  state:    z.string().min(2, 'State required'),
  landmark: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router  = useRouter();
  const { cart, subtotal, reset } = useCartStore();
  const { convexUserId, user }    = useAuthStore();
  const [step, setStep]           = useState(1);
  const [address, setAddress]     = useState<FormData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [orderId, setOrderId]     = useState<string | null>(null);

  const createOrder = useMutation(api.orders.create);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!cart?.items?.length) {
    return (
      <div className="container py-32 text-center">
        <p className="font-display text-2xl text-ink mb-4">Your cart is empty</p>
        <Link href="/shop/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const shippingFee = subtotal >= 50000 ? 0 : 1500;
  const total = subtotal + shippingFee;

  const onAddressSubmit = async (data: FormData) => {
    if (!convexUserId) { router.push('/auth/login?next=/shop/checkout'); return; }
    setLoading(true);
    try {
      const result = await createOrder({
        userId: convexUserId as any,
        items: cart.items.map((i) => ({ productId: i.productId as any, quantity: i.quantity, variantId: i.variantId })),
        shippingAddress: { ...data, country: 'Nigeria' },
      });
      setAddress(data);
      setOrderId(result.orderId);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystack = async () => {
    if (!orderId || !user) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/payments/initialize', { orderId, email: user.email });
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast.error(err.message ?? 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-5xl">
      <Link href="/shop/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-ink transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        Back to cart
      </Link>

      <h1 className="font-display text-3xl text-ink mb-8">Checkout</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-10">
        {[
          { n: 1, label: 'Shipping', icon: MapPin },
          { n: 2, label: 'Payment',  icon: CreditCard },
        ].map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center gap-3">
            <div className={cn_step(step, n)}>
              {step > n ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
              <span className="text-xs font-medium">{label}</span>
            </div>
            {i === 0 && <div className={`h-px w-12 transition-colors duration-300 ${step > 1 ? 'bg-ink' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div className="card p-6">
                  <h2 className="font-display text-xl text-ink mb-6">Delivery Address</h2>
                  <form id="addr" onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Full Name</label>
                        <input {...register('fullName')} className={`input ${errors.fullName ? 'input-error' : ''}`} placeholder="Emeka Okonkwo" />
                        {errors.fullName && <p className="text-danger text-xs mt-1">{errors.fullName.message}</p>}
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="08012345678" />
                        {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label">Street Address</label>
                      <input {...register('street')} className={`input ${errors.street ? 'input-error' : ''}`} placeholder="12 Adekunle Street, Victoria Island" />
                      {errors.street && <p className="text-danger text-xs mt-1">{errors.street.message}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">City</label>
                        <input {...register('city')} className={`input ${errors.city ? 'input-error' : ''}`} placeholder="Lagos" />
                        {errors.city && <p className="text-danger text-xs mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <label className="label">State</label>
                        <select {...register('state')} className={`input ${errors.state ? 'input-error' : ''}`}>
                          <option value="">Select state</option>
                          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <p className="text-danger text-xs mt-1">{errors.state.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label">Landmark <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                      <input {...register('landmark')} className="input" placeholder="Near First Bank, opposite blue gate" />
                    </div>
                  </form>
                </div>
                <button form="addr" type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-4 justify-center">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><span>Continue to Payment</span><ArrowRight className="w-4 h-4" strokeWidth={1.75} /></>
                  }
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div className="card p-6 mb-4">
                  <h2 className="font-display text-xl text-ink mb-2">Payment</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    You will be redirected to Paystack to complete payment. We accept debit/credit cards, bank transfer, USSD, and mobile money.
                  </p>

                  {/* Address summary */}
                  {address && (
                    <div className="bg-paper rounded border border-gray-200 p-4 text-sm text-gray-600">
                      <p className="font-medium text-ink mb-1">{address.fullName}</p>
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state}, Nigeria</p>
                      <p>{address.phone}</p>
                      <button onClick={() => setStep(1)} className="text-xs text-orange-600 hover:text-orange-700 mt-2 transition-colors">
                        Change address
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={handlePaystack} disabled={loading} className="btn-primary btn-lg w-full justify-center">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : `Pay ${formatNaira(total)} with Paystack`
                  }
                </button>
                <button onClick={() => setStep(1)} className="btn-ghost w-full mt-2 justify-center text-sm">
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Back to shipping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-6">
            <h3 className="text-sm font-medium text-ink mb-4 uppercase tracking-wide">Order Summary</h3>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item._id} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-gray-100 rounded border border-gray-200 shrink-0 overflow-hidden">
                    <Image src={getProductImage(item.product)} alt={item.product?.name ?? ''} fill className="object-cover" sizes="56px" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-ink text-paper text-[10px] rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{item.product?.name}</p>
                    <p className="text-xs font-semibold text-ink mt-1">
                      {formatNaira((item.product?.price ?? item.priceAtAdd) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? 'Free' : formatNaira(shippingFee)}
                </span>
              </div>
              {shippingFee === 0 && (
                <p className="text-xs text-green-600">Free shipping on orders over ₦50,000</p>
              )}
              <div className="flex justify-between font-semibold text-base text-ink border-t border-gray-100 pt-2 mt-2">
                <span>Total</span><span>{formatNaira(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn_step(current: number, n: number): string {
  const base = 'flex items-center gap-2 px-4 py-2 rounded text-sm transition-all';
  if (current >= n) return `${base} bg-ink text-paper`;
  return `${base} bg-gray-100 text-gray-400`;
}
