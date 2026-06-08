import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { HeroSection } from '@/components/ui/HeroSection';
import { CategoryBar, ProductRow, BannerStrip, TrustBar, FeaturedCategories, NewsletterSignup } from '@/components/ui';

export const metadata: Metadata = {
  title: 'AuroraMart — Premium Goods Delivered',
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main>
        <HeroSection />
        <CategoryBar />
        <div className="container mt-16 space-y-20">
          <FeaturedCategories />
          <ProductRow title="Featured Products" subtitle="Handpicked by our team" queryKey="featured" />
          <BannerStrip />
          <ProductRow 
            title="New Arrivals" 
            subtitle="Just landed this week" 
            queryKey="new-arrivals" 
            sideImage="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=2000&auto=format&fit=crop"
            sideText="Fresh Drops"
          />
          <ProductRow 
            title="Best Sellers" 
            subtitle="What everyone is buying" 
            queryKey="best-sellers" 
            sideImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            sideText="Top Picks"
          />
          <NewsletterSignup />
        </div>
        <TrustBar />
      </main>
      <Footer />
    </>
  );
}
