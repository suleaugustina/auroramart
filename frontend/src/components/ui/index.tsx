'use client';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ProductCard } from '@/components/product/ProductCard';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

// ── Category Bar ─────────────────────────────────────────────
export function CategoryBar() {
  const categories = useQuery(api.functions.listCategories, { withChildren: false }) ?? [];
  const topLevel = categories.filter((c: any) => !c.parentId).slice(0, 5);

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container">
        <div className="flex overflow-x-auto scrollbar-hide gap-0 -mb-px">
          {topLevel.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/shop/categories/${cat.slug}`}
              className="shrink-0 px-5 py-4 text-sm text-gray-600 hover:text-ink border-b-2 border-transparent hover:border-orange-500 transition-all whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/shop/products"
            className="shrink-0 px-5 py-4 text-sm text-gray-600 hover:text-ink border-b-2 border-transparent hover:border-orange-500 transition-all whitespace-nowrap"
          >
            All Products
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Product Row ───────────────────────────────────────────────
interface ProductRowProps {
  title: string;
  subtitle?: string;
  queryKey: 'featured' | 'new-arrivals' | 'best-sellers';
  sideImage?: string;
  sideText?: string;
}

export function ProductRow({ title, subtitle, queryKey, sideImage, sideText }: ProductRowProps) {
  const queryMap = {
    'featured':     api.products.getFeatured,
    'new-arrivals': api.products.getNewArrivals,
    'best-sellers': api.products.getBestSellers,
  };

  const hrefMap = {
    'featured':     '/shop/products?isFeatured=true',
    'new-arrivals': '/shop/products?isNewArrival=true',
    'best-sellers': '/shop/products?isBestSeller=true',
  };

  const products = useQuery(queryMap[queryKey], { limit: sideImage ? 4 : 5 }) ?? null;

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Link
          href={hrefMap[queryKey]}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-ink transition-colors group"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
        </Link>
      </div>

      <div className={`grid gap-5 ${sideImage ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
        {sideImage && (
          <div className="hidden lg:flex relative rounded-xl overflow-hidden col-span-1 group">
            <Image src={sideImage} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <h3 className="text-white text-xl font-display font-medium leading-tight">{sideText || title}</h3>
              <Link href={hrefMap[queryKey]} className="mt-3 text-white/80 text-sm flex items-center gap-2 hover:text-white transition-colors">
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {products === null ? (
          <div className={`grid gap-5 ${sideImage ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 col-span-1 lg:col-span-4' : 'contents'}`}>
            {Array.from({ length: sideImage ? 4 : 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/3] skeleton rounded-md" />
                <div className="h-3 skeleton w-24 rounded" />
                <div className="h-4 skeleton w-full rounded" />
                <div className="h-4 skeleton w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-5 ${sideImage ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 col-span-1 lg:col-span-4' : 'contents'}`}>
            {products.map((product: any, i: number) => (
              <ProductCard key={product._id} product={product} priority={i < 2} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Banner Strip ──────────────────────────────────────────────
import Image from 'next/image';

export function BannerStrip() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {[
        {
          image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop',
          label: 'Flash Deals',
          title: 'Up to 60% off electronics',
          href: '/shop/categories/electronics-gadgets',
        },
        {
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
          label: 'New Season',
          title: 'Ankara & fashion arrivals',
          href: '/shop/categories/fashion-clothing',
        },
      ].map((b) => (
        <Link
          key={b.href}
          href={b.href}
          className="rounded-xl flex flex-col justify-between min-h-[220px] group overflow-hidden relative"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src={b.image}
              alt={b.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors duration-500" />
          </div>
          
          <div className="relative z-10 px-8 py-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 drop-shadow-sm">{b.label}</p>
              <p className="font-display text-3xl text-white leading-tight drop-shadow-md">{b.title}</p>
            </div>
            <span className="flex items-center gap-2 text-white/90 font-medium text-sm mt-6 group-hover:gap-3 transition-all">
              Shop now <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Trust Bar ─────────────────────────────────────────────────
export function TrustBar() {
  const ITEMS = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Lagos same day, nationwide 1–3 days' },
    { icon: ShieldCheck, title: 'Secure Payments', desc: '100% secured via Paystack' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy, no questions' },
    { icon: Headphones, title: 'Customer Support', desc: 'Available 9am–9pm, 7 days a week' },
  ];

  return (
    <div className="border-t border-gray-200 bg-white mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-paper-dark flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4.5 h-4.5 text-ink" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink mb-0.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Featured Categories ───────────────────────────────────────
export function FeaturedCategories() {
  const categories = [
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop', link: '/shop/categories/electronics-gadgets' },
    { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop', link: '/shop/categories/fashion-clothing' },
    { name: 'Home & Living', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074&auto=format&fit=crop', link: '/shop/categories/home-living' },
  ];

  return (
    <section className="py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="section-title">Shop by Category</h2>
          <p className="text-sm text-gray-500 mt-1">Explore our premium collections</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <Link key={idx} href={cat.link} className="group block relative h-64 rounded-xl overflow-hidden">
            <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-2xl font-display font-medium drop-shadow-md">{cat.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Newsletter Signup ─────────────────────────────────────────
export function NewsletterSignup() {
  return (
    <section className="relative py-20 bg-ink overflow-hidden rounded-2xl mt-16">
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
      <div className="relative z-10 container flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-display text-white mb-4">Join the Aurora Club</h2>
        <p className="text-white/80 max-w-md mb-8">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
        <form className="flex w-full max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-1 px-4 py-3 rounded-md bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-colors"
          />
          <button type="submit" className="px-6 py-3 bg-white text-ink font-medium rounded-md hover:bg-white/90 transition-colors">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
