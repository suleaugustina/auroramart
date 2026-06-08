'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  BarChart2, Tag, Warehouse, LogOut, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const NAV = [
  { href: '/admin',             label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics',   label: 'Analytics',  icon: BarChart2 },
  { href: '/admin/products',    label: 'Products',   icon: Package },
  { href: '/admin/orders',      label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/users',       label: 'Users',      icon: Users },
  { href: '/admin/categories',  label: 'Categories', icon: Tag },
  { href: '/admin/inventory',   label: 'Inventory',  icon: Warehouse },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const { logout } = useAuthStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const content = (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 bg-orange-500 block rounded-sm shrink-0" />
          <div>
            <p className="font-display text-base text-ink leading-none">AuroraMart</p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all',
                isActive(href, exact)
                  ? 'bg-ink text-paper'
                  : 'text-gray-600 hover:bg-paper-dark hover:text-ink'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-paper-dark hover:text-ink rounded transition-colors mb-0.5">
          Back to Store
        </Link>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-danger hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded shadow-card"
      >
        {open ? <X className="w-4 h-4" strokeWidth={1.75} /> : <Menu className="w-4 h-4" strokeWidth={1.75} />}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        'w-56 bg-white border-r border-gray-100 flex flex-col h-full',
        'fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>
    </>
  );
}
