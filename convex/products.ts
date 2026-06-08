import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Public Queries ────────────────────────────────────────────

export const list = query({
  args: {
    page:           v.optional(v.number()),
    limit:          v.optional(v.number()),
    categoryId:     v.optional(v.id("categories")),
    status:         v.optional(v.string()),
    isFeatured:     v.optional(v.boolean()),
    isBestSeller:   v.optional(v.boolean()),
    isNewArrival:   v.optional(v.boolean()),
    minPrice:       v.optional(v.number()),
    maxPrice:       v.optional(v.number()),
    sortBy:         v.optional(v.string()),
    sortOrder:      v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 24;
    let products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("status"), args.status ?? "active"))
      .collect();

    if (args.categoryId) {
      products = products.filter((p) => p.categoryId === args.categoryId);
    }
    if (args.isFeatured !== undefined) {
      products = products.filter((p) => p.isFeatured === args.isFeatured);
    }
    if (args.isBestSeller !== undefined) {
      products = products.filter((p) => p.isBestSeller === args.isBestSeller);
    }
    if (args.isNewArrival !== undefined) {
      products = products.filter((p) => p.isNewArrival === args.isNewArrival);
    }
    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    // Sort
    const sortBy = args.sortBy ?? "_creationTime";
    const sortOrder = args.sortOrder ?? "desc";
    products.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    const page = args.page ?? 1;
    const total = products.length;
    const items = products.slice((page - 1) * limit, page * limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q.search("name", args.q).eq("status", "active")
      )
      .take(args.limit ?? 20);
    return results;
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit ?? 12);
  },
});

export const getBestSellers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_bestseller", (q) => q.eq("isBestSeller", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit ?? 12);
  },
});

export const getNewArrivals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("isNewArrival", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit ?? 12);
  },
});

export const getRelated = query({
  args: { productId: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", product.categoryId))
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), args.productId),
          q.eq(q.field("status"), "active")
        )
      )
      .take(args.limit ?? 8);
  },
});

// ── Admin mutations ───────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(), slug: v.string(), description: v.string(),
    shortDescription: v.optional(v.string()), price: v.number(),
    compareAtPrice: v.optional(v.number()), costPrice: v.optional(v.number()),
    status: v.string(), type: v.string(), stockQuantity: v.number(),
    lowStockThreshold: v.number(), trackInventory: v.boolean(),
    sku: v.optional(v.string()), images: v.array(v.string()),
    thumbnail: v.optional(v.string()), hasVariants: v.boolean(),
    tags: v.array(v.string()), isFeatured: v.boolean(),
    isBestSeller: v.boolean(), isNewArrival: v.boolean(),
    freeShipping: v.boolean(), brand: v.string(),
    categoryId: v.id("categories"), attributes: v.optional(v.any()),
    metaTitle: v.optional(v.string()), metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      status: args.status as any,
      type: args.type as any,
      viewCount: 0, salesCount: 0, averageRating: 0, reviewCount: 0,
    });
  },
});

export const update = mutation({
  args: { id: v.id("products"), data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.data);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const incrementView = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (product) await ctx.db.patch(args.id, { viewCount: product.viewCount + 1 });
  },
});
