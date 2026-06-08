import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-NG').format(n);
}

export function calcDiscount(price: number, compareAt: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function getProductImage(product: { thumbnail?: string; images?: string[] } | null | undefined): string {
  return product?.thumbnail ?? product?.images?.[0] ?? '/placeholder.jpg';
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('_session');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('_session', id); }
  return id;
}

export function timeAgo(timestamp: number): string {
  const secs = Math.floor((Date.now() - timestamp) / 1000);
  const map: [number, string][] = [
    [31536000, 'year'], [2592000, 'month'], [604800, 'week'],
    [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second'],
  ];
  for (const [s, unit] of map) {
    const c = Math.floor(secs / s);
    if (c >= 1) return `${c} ${unit}${c !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pending',           color: 'text-amber-700 bg-amber-50 border-amber-200' },
  confirmed:        { label: 'Confirmed',          color: 'text-blue-700 bg-blue-50 border-blue-200' },
  processing:       { label: 'Processing',         color: 'text-blue-700 bg-blue-50 border-blue-200' },
  packed:           { label: 'Packed',             color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  shipped:          { label: 'Shipped',            color: 'text-violet-700 bg-violet-50 border-violet-200' },
  out_for_delivery: { label: 'Out for Delivery',   color: 'text-orange-700 bg-orange-50 border-orange-200' },
  delivered:        { label: 'Delivered',          color: 'text-green-700 bg-green-50 border-green-200' },
  cancelled:        { label: 'Cancelled',          color: 'text-red-700 bg-red-50 border-red-200' },
  refund_requested: { label: 'Refund Requested',   color: 'text-red-700 bg-red-50 border-red-200' },
  refunded:         { label: 'Refunded',           color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];
