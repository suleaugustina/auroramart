'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, ShoppingBag, Users, RefreshCw } from 'lucide-react';
import { formatNaira, formatNumber } from '@/lib/utils';

export default function AdminDashboard() {
  const stats = useQuery(api.functions.getDashboardStats, {});

  if (!stats) return <DashSkeleton />;

  const { today, revenueByHour, revenueByCity, funnel, botStats } = stats;

  const KPI = [
    { label: "Today's Revenue", value: formatNaira(today.revenue), icon: TrendingUp, change: '+12%' },
    { label: "Today's Orders",  value: formatNumber(today.orders),  icon: ShoppingBag, change: '+8%' },
    { label: 'New Users Today', value: formatNumber(today.newUsers), icon: Users,       change: '+3%' },
    { label: 'Avg Order Value', value: today.orders ? formatNaira(today.revenue / today.orders) : '₦0', icon: RefreshCw, change: '+5%' },
  ];

  const funnelLabels: Record<string, string> = {
    'product.viewed':   'Product Viewed',
    'cart.item_added':  'Added to Cart',
    'checkout.started': 'Checkout Started',
    'order.placed':     'Order Placed',
    'order.paid':       'Payment Complete',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Live overview — refreshes automatically</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-paper-dark rounded flex items-center justify-center">
                <k.icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium text-green-600">{k.change}</span>
            </div>
            <p className="font-display text-2xl text-ink">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 card p-5">
          <p className="text-sm font-medium text-ink mb-4">Revenue by Hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByHour}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f95d0f" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#f95d0f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [formatNaira(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f95d0f" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-ink mb-4">Revenue by City</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByCity.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={(v: number) => [formatNaira(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#1a1714" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel + Bot stats */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-medium text-ink mb-4">Conversion Funnel</p>
          <div className="space-y-3">
            {funnel.map((step: any) => {
              const max = funnel[0]?.users || 1;
              const pct = Math.round((step.users / max) * 100);
              return (
                <div key={step.event_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{funnelLabels[step.event_type] ?? step.event_type}</span>
                    <span className="font-medium text-ink">{formatNumber(step.users)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-paper-darker rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {funnel.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center">Run the bot simulator to generate data</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-ink mb-4">Bot Simulator Results</p>
          {botStats.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 mb-2">No bot data yet</p>
              <code className="text-xs bg-paper-dark px-2 py-1 rounded text-gray-600">npm run bots:run</code>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Persona', 'Sessions', 'Conv. %', 'Revenue'].map((h) => (
                    <th key={h} className="text-left pb-2 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {botStats.map((b: any) => (
                  <tr key={b.bot_persona} className="hover:bg-paper transition-colors">
                    <td className="py-2 capitalize text-gray-700">{b.bot_persona?.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-gray-600">{b.sessions}</td>
                    <td className="py-2 font-medium text-ink">{b.conversion_rate}%</td>
                    <td className="py-2 text-gray-600">{formatNaira(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 skeleton w-40 mb-8 rounded" />
      <div className="grid grid-cols-4 gap-4 mb-8">{[0,1,2,3].map(i => <div key={i} className="card p-5 h-28" />)}</div>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 card p-5 h-72" />
        <div className="card p-5 h-72" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5 h-64" />
        <div className="card p-5 h-64" />
      </div>
    </div>
  );
}
