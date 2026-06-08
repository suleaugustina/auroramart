'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    tag: 'New Season',
    headline: 'The latest\ntechnology,\ndelivered.',
    sub: 'Smartphones, laptops, audio and accessories from the world\'s leading brands.',
    cta: 'Shop Electronics',
    href: '/shop/categories/electronics-gadgets',
    bg: 'bg-ink',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
    accent: 'text-orange-400',
  },
  {
    tag: 'Fashion',
    headline: 'Dress for\nevery\nmoment.',
    sub: 'Men\'s, women\'s, and children\'s fashion — from everyday to special occasions.',
    cta: 'Shop Fashion',
    href: '/shop/categories/fashion-clothing',
    bg: 'bg-[#2a1f14]',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
    accent: 'text-amber-400',
  },
  {
    tag: 'Home',
    headline: 'Your home,\nbetter\nlived.',
    sub: 'Furniture, kitchen goods, decor and everything that makes a house a home.',
    cta: 'Shop Home',
    href: '/shop/categories/home-living',
    bg: 'bg-[#1a2020]',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074&auto=format&fit=crop',
    accent: 'text-green-400',
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className={`relative ${slide.bg} overflow-hidden transition-colors duration-700 min-h-[600px] flex items-center`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current + '-bg'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={SLIDES[current].image}
            alt={SLIDES[current].headline}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="container relative z-10 py-24 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className={`text-xs font-medium tracking-widest uppercase mb-6 drop-shadow-md ${slide.accent}`}>
                {slide.tag}
              </p>

              <h1
                className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-6 drop-shadow-lg"
                style={{ whiteSpace: 'pre-line' }}
              >
                {slide.headline}
              </h1>

              <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-10 max-w-md drop-shadow-md">
                {slide.sub}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-black rounded text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/shop/products"
                  className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-md"
                >
                  Browse all products
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-0.5 transition-all duration-300 rounded-full ${i === current ? 'w-8 bg-white' : 'w-3 bg-white/30'}`}
          />
        ))}
      </div>
    </section>
  );
}
