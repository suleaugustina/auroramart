import Link from 'next/link';

const LINKS = {
  Shop: [
    ['Electronics & Gadgets', '/shop/categories/electronics-gadgets'],
    ['Fashion & Clothing', '/shop/categories/fashion-clothing'],
    ['Food & Groceries', '/shop/categories/food-groceries'],
    ['Home & Living', '/shop/categories/home-living'],
    ['Software & Services', '/shop/categories/software-services'],
    ['All Products', '/shop/products'],
  ],
  Help: [
    ['How to Order', '/help/how-to-order'],
    ['Track My Order', '/account/orders'],
    ['Returns & Refunds', '/help/returns'],
    ['Payment Methods', '/help/payments'],
    ['Contact Us', '/contact'],
  ],
  Company: [
    ['About AuroraMart', '/about'],
    ['Careers', '/careers'],
    ['Sell on AuroraMart', '/sell'],
    ['Privacy Policy', '/legal/privacy'],
    ['Terms of Service', '/legal/terms'],
  ],
};

export function Footer() {
  return (
    <footer className="bg-ink text-paper/70 mt-24">
      <div className="container pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-6 h-6 bg-orange-500 block rounded-sm" />
              <span className="font-display text-xl text-paper">
                Aurora<span className="text-orange-400">Mart</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-paper/60">
              Premium goods, delivered across Nigeria. We bring the world's best products to your doorstep.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-paper/50">Secured by Paystack</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs text-paper/40 uppercase tracking-widest font-medium mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-paper/60 hover:text-paper transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-paper/40">
            &copy; {new Date().getFullYear()} AuroraMart Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-paper/30">NGN</span>
            <span className="text-xs text-paper/30">Nigeria</span>
            <Link href="/legal/privacy" className="text-xs text-paper/40 hover:text-paper/70 transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="text-xs text-paper/40 hover:text-paper/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
