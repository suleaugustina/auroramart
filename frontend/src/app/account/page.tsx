'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Heart, MapPin, User, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { formatNaira } from '@/lib/utils';
import { useEffect } from 'react';

const MENU = [
  { icon: Package, label: 'My Orders',   sub: 'Track and manage your orders',          href: '/account/orders' },
  { icon: Heart,   label: 'Wishlist',    sub: 'Products you have saved',               href: '/account/wishlist' },
  { icon: MapPin,  label: 'Addresses',   sub: 'Manage your delivery addresses',        href: '/account/addresses' },
  { icon: User,    label: 'Profile',     sub: 'Update your personal information',      href: '/account/profile' },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login?next=/account');
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="font-display text-3xl text-ink mb-8">My Account</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="w-14 h-14 bg-paper-dark rounded-full flex items-center justify-center border border-gray-200 shrink-0">
          <span className="font-display text-xl text-ink">{user.firstName[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl text-ink">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <div className="flex gap-5 mt-2 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-ink">{user.totalOrders}</span> orders
            </span>
            <span className="text-gray-500">
              Spent <span className="font-semibold text-ink">{formatNaira(user.totalSpent)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card divide-y divide-gray-100 mb-6">
        {MENU.map(({ icon: Icon, label, sub, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-paper transition-colors group"
          >
            <div className="w-9 h-9 bg-paper-dark rounded flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink group-hover:text-orange-600 transition-colors">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" strokeWidth={1.75} />
          </Link>
        ))}
      </div>

      <button
        onClick={() => { logout(); router.push('/'); }}
        className="btn-outline w-full justify-center text-sm text-gray-600"
      >
        <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
        Sign Out
      </button>
    </div>
  );
}
