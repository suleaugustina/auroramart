'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Users, AlertTriangle,
  RefreshCw, Activity, CreditCard, Smartphone, Bot,
  ArrowUpRight, Package, Zap,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────
interface AnalyticsData {
  realtime: {
    total_revenue: number;
    total_orders_placed: number;
    total_orders_paid: number;
    total_payment_failures: number;
    total_cart_abandonments: number;
  };
  today: { revenue: number; orders: number; sessions: number };
  total_events: number;
  hourly: Array<{ hour: string; orders: number; revenue: number }>;
  cities: Array<{ city: string; orders_paid: number; revenue: number; total_sessions: number }>;
  products: Array<{
    product_id: string; product_name: string; category: string;
    total_views: number; total_adds_to_cart: number; total_purchased: number; total_revenue: number;
  }>;
  funnel: Array<{ step: string; unique_sessions: number }>;
  personas: Array<{
    bot_persona: string; total_sessions: number; orders_placed: number;
    orders_paid: number; abandonments: number; total_revenue: number;
  }>;
  devices: Array<{ device: string; sessions: number; sales: number }>;
  payments: Array<{
    payment_method: string; total_attempts: number;
    successful_payments: number; failed_payments: number; success_rate_percent: number;
  }>;
  fraud_alerts: Array<{
    id: number; session_id: string; alert_type: string;
    severity: string; description: string; created_at: string;
  }>;
  generated_at: string;
}

// ── Constants ──────────────────────────────────────────────────
const ORANGE = '#f95d0f';
const INK    = '#1a1714';
const DEVICE_COLORS = ['#f95d0f', '#1a1714', '#8c877f', '#fb7c37', '#706b64'];

const severityConfig: Record<string, { cls: string; dot: string }> = {
  CRITICAL: { cls: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  HIGH:     { cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  MEDIUM:   { cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  LOW:      { cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
};

// ── Helper ─────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn('card p-5 flex flex-col gap-3', accent && 'bg-ink text-paper border-ink')}>
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-9 h-9 rounded flex items-center justify-center shrink-0',
          accent ? 'bg-white/10' : 'bg-paper-dark',
        )}>
          <Icon className={cn('w-4 h-4', accent ? 'text-orange-400' : 'text-gray-600')} strokeWidth={1.5} />
        </div>
        <ArrowUpRight className={cn('w-3.5 h-3.5 mt-1', accent ? 'text-white/30' : 'text-gray-300')} />
      </div>
      <div>
        <p className={cn('font-display text-2xl leading-none', accent ? 'text-white' : 'text-ink')}>{value}</p>
        <p className={cn('text-xs mt-1.5', accent ? 'text-white/50' : 'text-gray-400')}>{label}</p>
        {sub && <p className={cn('text-[11px] mt-0.5', accent ? 'text-orange-300' : 'text-orange-500')}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-ink mb-4">{children}</p>;
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
      <Activity className="w-6 h-6 opacity-40" />
      <p className="text-xs">{msg}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <AnalyticsSkeleton />;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="w-8 h-8 text-orange-500" />
      <p className="text-sm font-medium text-ink">Failed to load analytics</p>
      <p className="text-xs text-gray-500 font-mono max-w-md text-center">{error}</p>
      <button onClick={() => load()} className="btn-primary btn-sm">Retry</button>
    </div>
  );

  if (!data) return null;

  const { realtime, today, total_events, hourly, cities, products, funnel, personas, devices, payments, fraud_alerts } = data;

  const conversionRate = realtime.total_orders_placed > 0
    ? ((realtime.total_orders_paid / realtime.total_orders_placed) * 100).toFixed(1)
    : '0';

  const avgOrderValue = realtime.total_orders_paid > 0
    ? realtime.total_revenue / realtime.total_orders_paid
    : 0;

  const kpis = [
    {
      label: 'All-time Revenue',
      value: formatNaira(realtime.total_revenue),
      sub: `${formatNaira(today.revenue)} today`,
      icon: TrendingUp,
      accent: true,
    },
    {
      label: 'Orders Paid',
      value: fmt(realtime.total_orders_paid),
      sub: `${today.orders} today`,
      icon: ShoppingBag,
    },
    {
      label: 'Avg. Order Value',
      value: formatNaira(avgOrderValue),
      sub: `${conversionRate}% conversion`,
      icon: RefreshCw,
    },
    {
      label: 'Total Events',
      value: fmt(total_events),
      sub: `${fmt(today.sessions)} sessions today`,
      icon: Activity,
    },
    {
      label: 'Cart Abandonments',
      value: fmt(realtime.total_cart_abandonments),
      icon: ShoppingBag,
    },
    {
      label: 'Payment Failures',
      value: fmt(realtime.total_payment_failures),
      icon: CreditCard,
    },
  ];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time pipeline data · auto-refreshes every 30s</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-outline btn-sm flex items-center gap-2"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} strokeWidth={1.75} />
          {lastRefresh ? `Updated ${lastRefresh}` : 'Refresh'}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Revenue + Cities */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 card p-5">
          <SectionTitle>Revenue Trend (Last 24 Hours)</SectionTitle>
          {hourly.length === 0 ? (
            <EmptyState msg="No events in the last 24 hours — run the bot simulator" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourly}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={55} />
                <Tooltip
                  formatter={(v: number) => [formatNaira(v), 'Revenue']}
                  contentStyle={{ fontFamily: 'var(--font-sans)', fontSize: 12, borderRadius: 6 }}
                />
                <Area type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <SectionTitle>Revenue by City</SectionTitle>
          {cities.length === 0 ? (
            <EmptyState msg="No city data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cities.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={70} />
                <Tooltip
                  formatter={(v: number) => [formatNaira(v), 'Revenue']}
                  contentStyle={{ fontFamily: 'var(--font-sans)', fontSize: 12, borderRadius: 6 }}
                />
                <Bar dataKey="revenue" fill={INK} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Funnel + Devices + Payments */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Conversion Funnel */}
        <div className="card p-5">
          <SectionTitle>Conversion Funnel</SectionTitle>
          {funnel.length === 0 ? (
            <EmptyState msg="No funnel data yet" />
          ) : (
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const max = funnel[0]?.unique_sessions || 1;
                const pct = Math.round((step.unique_sessions / max) * 100);
                const label = step.step.replace(/^\d+\. /, '');
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-ink">
                        {fmt(step.unique_sessions)}{' '}
                        <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-paper-darker rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device Distribution */}
        <div className="card p-5">
          <SectionTitle>Device Distribution</SectionTitle>
          {devices.length === 0 ? (
            <EmptyState msg="No device data yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="sessions"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {devices.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [fmt(v) + ' sessions', name]}
                    contentStyle={{ fontFamily: 'var(--font-sans)', fontSize: 12, borderRadius: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {devices.map((d, i) => (
                  <div key={d.device} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                      <span className="capitalize text-gray-700">{d.device}</span>
                    </div>
                    <span className="font-medium text-ink">{fmt(d.sessions)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card p-5">
          <SectionTitle>Payment Methods</SectionTitle>
          {payments.length === 0 ? (
            <EmptyState msg="No payment data yet" />
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.payment_method}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-gray-700">{p.payment_method?.replace(/_/g, ' ')}</span>
                    <span className={cn(
                      'font-medium',
                      p.success_rate_percent >= 80 ? 'text-green-600' :
                      p.success_rate_percent >= 50 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {p.success_rate_percent}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-paper-darker rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        p.success_rate_percent >= 80 ? 'bg-green-500' :
                        p.success_rate_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${p.success_rate_percent}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                    <span>{p.successful_payments} ok</span>
                    <span>{p.failed_payments} failed</span>
                    <span>{p.total_attempts} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Personas */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">

        {/* Top Products */}
        <div className="card p-5">
          <SectionTitle>Top Products</SectionTitle>
          {products.length === 0 ? (
            <EmptyState msg="No product data yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Product', 'Views', 'Cart', 'Sold', 'Revenue'].map((h) => (
                      <th key={h} className="text-left pb-2 text-gray-400 font-medium pr-3 last:pr-0 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.slice(0, 8).map((p) => (
                    <tr key={p.product_id} className="hover:bg-paper transition-colors">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                          <span className="text-gray-700 line-clamp-1 max-w-[120px]">{p.product_name || p.product_id}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{fmt(p.total_views)}</td>
                      <td className="py-2 pr-3 text-gray-500">{fmt(p.total_adds_to_cart)}</td>
                      <td className="py-2 pr-3 font-medium text-ink">{fmt(p.total_purchased)}</td>
                      <td className="py-2 text-gray-600 whitespace-nowrap">{formatNaira(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bot Personas */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.75} />
            <p className="text-sm font-medium text-ink">Bot Persona Performance</p>
          </div>
          {personas.length === 0 ? (
            <EmptyState msg="No bot persona data — run the bot simulator" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Persona', 'Sessions', 'Orders', 'Conv.', 'Revenue'].map((h) => (
                      <th key={h} className="text-left pb-2 text-gray-400 font-medium pr-3 last:pr-0 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {personas.map((p) => {
                    const conv = p.total_sessions > 0
                      ? ((p.orders_paid / p.total_sessions) * 100).toFixed(1)
                      : '0';
                    return (
                      <tr key={p.bot_persona} className="hover:bg-paper transition-colors">
                        <td className="py-2 pr-3 capitalize text-gray-700 whitespace-nowrap">
                          {p.bot_persona?.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{fmt(p.total_sessions)}</td>
                        <td className="py-2 pr-3 text-gray-500">{fmt(p.orders_paid)}</td>
                        <td className="py-2 pr-3">
                          <span className={cn(
                            'font-medium',
                            Number(conv) >= 50 ? 'text-green-600' :
                            Number(conv) >= 25 ? 'text-amber-600' : 'text-red-600'
                          )}>{conv}%</span>
                        </td>
                        <td className="py-2 text-gray-600 whitespace-nowrap">{formatNaira(p.total_revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fraud Alerts */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.75} />
          <p className="text-sm font-medium text-ink">Recent Fraud Alerts</p>
          {fraud_alerts.length > 0 && (
            <span className="ml-auto badge-orange">{fraud_alerts.length} alert{fraud_alerts.length !== 1 && 's'}</span>
          )}
        </div>
        {fraud_alerts.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-gray-400 justify-center">
            <Zap className="w-5 h-5 opacity-40" />
            <p className="text-xs">No fraud alerts detected</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {fraud_alerts.map((a) => {
              const cfg = severityConfig[a.severity] || severityConfig.LOW;
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-paper rounded text-xs">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1', cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink">{a.alert_type}</span>
                      <span className={cn('badge text-[10px]', cfg.cls)}>{a.severity}</span>
                      <span className="text-gray-400 ml-auto shrink-0">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-gray-500 mt-0.5 line-clamp-1">{a.description}</p>
                    <p className="text-gray-300 mt-0.5 font-mono text-[10px]">
                      session: {a.session_id?.slice(0, 12)}…
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 skeleton w-48 mb-8 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => <div key={i} className="card p-5 h-28" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 card p-5 h-72" />
        <div className="card p-5 h-72" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {[...Array(3)].map((_, i) => <div key={i} className="card p-5 h-64" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="card p-5 h-64" />
        <div className="card p-5 h-64" />
      </div>
      <div className="card p-5 h-48" />
    </div>
  );
}
