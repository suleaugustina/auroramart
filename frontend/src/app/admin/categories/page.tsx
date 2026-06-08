'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const cats     = useQuery(api.functions.listCategories, { withChildren: true }) ?? null;

  const topLevel = cats?.filter((c: any) => !c.parentId) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Categories</h1>
          <p className="text-sm text-gray-400 mt-1">Manage product categories and subcategories</p>
        </div>
        <button className="btn-orange btn-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Category
        </button>
      </div>

      {cats === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 skeleton rounded" />
              <div className="flex-1 space-y-2"><div className="h-4 skeleton w-40 rounded" /><div className="h-3 skeleton w-24 rounded" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((cat: any) => (
            <div key={cat._id} className="card overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-paper transition-colors group">
                <div className="w-10 h-10 bg-paper-dark rounded border border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-base font-display text-ink">{cat.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat.productCount} products &middot; {cat.children?.length ?? 0} subcategories
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-ink rounded hover:bg-paper-dark transition-all">
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-danger rounded hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border ${cat.isActive ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                  {cat.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>

              {cat.children?.length > 0 && (
                <div className="border-t border-gray-100 bg-paper divide-y divide-gray-100">
                  {cat.children.map((sub: any) => (
                    <div key={sub._id} className="flex items-center gap-3 px-5 py-3 hover:bg-paper-dark transition-colors group/sub">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-6 shrink-0" strokeWidth={2} />
                      <span className="text-sm text-gray-600">{sub.name}</span>
                      <span className="text-xs text-gray-400">({sub.productCount} products)</span>
                      <div className="ml-auto flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                        <button className="p-1 text-gray-400 hover:text-ink rounded transition-all"><Edit2 className="w-3 h-3" strokeWidth={1.75} /></button>
                        <button className="p-1 text-gray-400 hover:text-danger rounded transition-all"><Trash2 className="w-3 h-3" strokeWidth={1.75} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
