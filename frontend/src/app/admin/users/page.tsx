'use client';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Search } from 'lucide-react';
import { formatNaira, timeAgo, cn } from '@/lib/utils';

const ROLE_COLOR: Record<string, string> = {
  customer:    'badge-gray',
  vendor:      'text-blue-700 bg-blue-50',
  admin:       'badge-orange',
  super_admin: 'text-purple-700 bg-purple-50',
};

const STATUS_COLOR: Record<string, string> = {
  active:                'badge-success',
  pending_verification:  'badge-warning',
  suspended:             'badge-danger',
  inactive:              'badge-gray',
};

export default function AdminUsersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const data  = useQuery(api.functions.adminListUsers, { page, limit: 20 });
  const users = data?.items?.filter((u: any) =>
    !search ||
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  ) ?? null;
  const meta = data?.meta;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Users</h1>
          <p className="text-sm text-gray-400 mt-1">{meta?.total ?? 0} registered users</p>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…" className="input pl-9 text-sm" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-paper">
            <tr>
              {['User', 'Role', 'Status', 'Orders', 'Total Spent', 'Joined', 'Last Login'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 uppercase tracking-widest font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users === null
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 skeleton rounded-full" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 skeleton w-28 rounded" />
                          <div className="h-2.5 skeleton w-40 rounded" />
                        </div>
                      </div>
                    </td>
                    {[0,1,2,3,4,5].map((j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              : users.map((user: any) => (
                  <tr key={user._id} className="hover:bg-paper transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-paper-dark rounded-full border border-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-ink">
                            {user.firstName?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge text-[10px] capitalize ${ROLE_COLOR[user.role] ?? 'badge-gray'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge text-[10px] capitalize ${STATUS_COLOR[user.status] ?? 'badge-gray'}`}>
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 font-medium">{user.totalOrders}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{formatNaira(user.totalSpent)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(user._creationTime)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never'}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {meta.totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
