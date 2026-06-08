'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';

const NAV_CATEGORIES = [
  { label: 'Electronics', slug: 'electronics-gadgets' },
  { label: 'Fashion', slug: 'fashion-clothing' },
  { label: 'Food & Groceries', slug: 'food-groceries' },
  { label: 'Home & Living', slug: 'home-living' },
  { label: 'Software', slug: 'software-services' },
];

export function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const [query, setQuery]             = useState('');
  const inputRef  = useRef<HTMLInputElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, open: openCart } = useCartStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop/products?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-paper/80 text-xs text-center py-2 font-sans tracking-wide">
        Free delivery on orders over ₦50,000 &nbsp;&mdash;&nbsp; Secure checkout via Paystack
      </div>

      <header className={cn(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled ? 'bg-paper/95 backdrop-blur border-b border-gray-200 shadow-subtle' : 'bg-paper border-b border-gray-200'
      )}>
        <div className="container">
          <div className="flex items-center justify-between h-16 gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="w-7 h-7 bg-orange-500 block rounded-sm" />
              <span className="font-display text-xl text-ink tracking-tight">
                Aurora<span className="text-orange-500">Mart</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop/categories/${cat.slug}`}
                  className={cn(
                    'nav-link px-3 py-1.5 text-sm rounded-sm',
                    pathname.includes(cat.slug) && 'active'
                  )}
                >
                  {cat.label}
                </Link>
              ))}
              <Link href="/shop/products" className="nav-link px-3 py-1.5 text-sm rounded-sm">
                All Products
              </Link>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-gray-600 hover:text-ink hover:bg-paper-dark rounded transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  href="/account/wishlist"
                  className="p-2.5 text-gray-600 hover:text-ink hover:bg-paper-dark rounded transition-colors hidden sm:flex"
                  aria-label="Wishlist"
                >
                  <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </Link>
              )}

              {/* Account */}
              <div ref={userRef} className="relative">
                <button
                  onClick={() => isAuthenticated ? setUserOpen(!userOpen) : router.push('/auth/login')}
                  className="p-2.5 text-gray-600 hover:text-ink hover:bg-paper-dark rounded transition-colors flex items-center gap-1.5"
                  aria-label="Account"
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {isAuthenticated && (
                    <span className="hidden sm:block text-sm text-ink max-w-[80px] truncate">
                      {user?.firstName}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isAuthenticated && userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-float py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-ink">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      {[
                        { label: 'My Account', href: '/account' },
                        { label: 'Orders', href: '/account/orders' },
                        { label: 'Wishlist', href: '/account/wishlist' },
                        { label: 'Addresses', href: '/account/addresses' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-paper hover:text-ink transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <Link
                            href="/admin"
                            onClick={() => setUserOpen(false)}
                            className="block px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium"
                          >
                            Admin Dashboard
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { logout(); setUserOpen(false); router.push('/'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-paper hover:text-ink transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2.5 text-gray-600 hover:text-ink hover:bg-paper-dark rounded transition-colors"
                aria-label={`Cart — ${itemCount} items`}
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 text-gray-600 hover:text-ink hover:bg-paper-dark rounded transition-colors"
              >
                {mobileOpen ? <X className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Menu className="w-[18px] h-[18px]" strokeWidth={1.75} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-gray-200 bg-white"
            >
              <nav className="container py-4 space-y-1">
                {NAV_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/shop/categories/${cat.slug}`}
                    className="block px-3 py-2.5 text-sm text-gray-700 hover:text-ink hover:bg-paper rounded transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
                <Link href="/shop/products" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-ink hover:bg-paper rounded transition-colors">
                  All Products
                </Link>
                {!isAuthenticated && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <Link href="/auth/login" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-ink hover:bg-paper rounded">Sign In</Link>
                    <Link href="/auth/register" className="block px-3 py-2.5 text-sm text-orange-600 font-medium hover:bg-orange-50 rounded">Create Account</Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="w-full max-w-2xl bg-white rounded-lg shadow-float overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.75} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, brands, categories…"
                  className="flex-1 text-base text-ink placeholder:text-gray-400 outline-none bg-transparent"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
              <div className="px-5 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Popular</p>
                <div className="flex flex-wrap gap-2">
                  {['iPhone 15', 'Ankara dress', 'Laptop', 'Rice 50kg', 'Smart TV', 'Sneakers'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setQuery(t); }}
                      className="px-3 py-1.5 bg-paper text-gray-600 text-sm rounded hover:bg-paper-dark hover:text-ink transition-colors border border-gray-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
