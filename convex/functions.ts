import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Categories ────────────────────────────────────────────────
export const listCategories = query({
  args: { withChildren: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const sorted = all.sort((a, b) => a.sortOrder - b.sortOrder);
    if (!args.withChildren) return sorted;

    const topLevel = sorted.filter((c) => !c.parentId);
    return topLevel.map((cat) => ({
      ...cat,
      children: sorted.filter((c) => c.parentId === cat._id),
    }));
  },
});

export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(), slug: v.string(), description: v.optional(v.string()),
    image: v.optional(v.string()), isActive: v.boolean(), sortOrder: v.number(),
    level: v.number(), parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", { ...args, productCount: 0 });
  },
});

// ── Cart ──────────────────────────────────────────────────────
export const getOrCreateCart = mutation({
  args: { userId: v.optional(v.id("users")), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let cart = args.userId
      ? await ctx.db.query("carts").withIndex("by_user", (q) => q.eq("userId", args.userId!)).first()
      : await ctx.db.query("carts").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId!)).first();

    if (!cart) {
      const cartId = await ctx.db.insert("carts", {
        userId: args.userId, sessionId: args.sessionId,
        couponDiscount: 0,
        expiresAt: args.userId ? undefined : Date.now() + 7 * 864e5,
      });
      return cartId;
    }
    return cart._id;
  },
});

export const getCart = query({
  args: { userId: v.optional(v.id("users")), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const cart = args.userId
      ? await ctx.db.query("carts").withIndex("by_user", (q) => q.eq("userId", args.userId!)).first()
      : await ctx.db.query("carts").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId!)).first();

    if (!cart) return null;
    const items = await ctx.db.query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id)).collect();

    const itemsWithProduct = await Promise.all(
      items.map(async (item) => ({
        ...item,
        product: await ctx.db.get(item.productId),
      }))
    );
    return { ...cart, items: itemsWithProduct };
  },
});

export const addToCart = mutation({
  args: {
    cartId: v.id("carts"),
    productId: v.id("products"),
    quantity: v.number(),
    variantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || product.status !== "active") throw new Error("Product not available");
    if (product.stockQuantity < args.quantity) throw new Error(`Only ${product.stockQuantity} in stock`);

    const existing = await ctx.db.query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    if (existing) {
      const newQty = existing.quantity + args.quantity;
      if (product.stockQuantity < newQty) throw new Error(`Only ${product.stockQuantity} in stock`);
      await ctx.db.patch(existing._id, { quantity: newQty });
    } else {
      await ctx.db.insert("cartItems", {
        cartId: args.cartId, productId: args.productId,
        variantId: args.variantId, quantity: args.quantity,
        priceAtAdd: product.price,
      });
    }
  },
});

export const updateCartItem = mutation({
  args: { itemId: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, { quantity: args.quantity });
    }
  },
});

export const removeFromCart = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

export const clearCart = mutation({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId)).collect();
    for (const item of items) await ctx.db.delete(item._id);
  },
});

// ── Analytics ─────────────────────────────────────────────────
export const trackEvent = mutation({
  args: {
    eventType: v.string(), userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()), productId: v.optional(v.id("products")),
    orderId: v.optional(v.id("orders")), source: v.optional(v.string()),
    device: v.optional(v.string()), city: v.optional(v.string()),
    country: v.optional(v.string()), metadata: v.optional(v.any()),
    revenue: v.optional(v.number()), isBotGenerated: v.optional(v.boolean()),
    botPersona: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyticsEvents", {
      ...args, isBotGenerated: args.isBotGenerated ?? false,
    });
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    // ── All events (today only) – use indexed queries per event type
    // to avoid a full-table .collect() that can exceed Convex's 4MB read cap.
    // Querying by type includes both bot and real events so the dashboard is fully populated.
    const realEventTypes = ["order.paid", "order.placed", "user.registered", "product.viewed", "cart.item_added", "checkout.started"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayRealEvents: any[] = [];

    for (const type of realEventTypes) {
      const events = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_type", (q) => q.eq("eventType", type))
        .filter((q) => q.gte(q.field("_creationTime"), todayMs))
        .take(500);
      todayRealEvents.push(...events);
    }

    const todayRevenue = todayRealEvents
      .filter((e) => e.eventType === "order.paid")
      .reduce((sum, e) => sum + (e.revenue ?? 0), 0);

    const todayOrders = todayRealEvents.filter((e) => e.eventType === "order.placed").length;
    const todayUsers  = todayRealEvents.filter((e) => e.eventType === "user.registered").length;

    // Revenue by hour (today)
    const revenueByHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) revenueByHour[h] = 0;
    todayRealEvents.filter((e) => e.eventType === "order.paid").forEach((e) => {
      const hour = new Date(e._creationTime).getHours();
      revenueByHour[hour] = (revenueByHour[hour] ?? 0) + (e.revenue ?? 0);
    });

    // Revenue by city
    const byCityMap: Record<string, number> = {};
    todayRealEvents.filter((e) => e.eventType === "order.paid" && e.city).forEach((e) => {
      byCityMap[e.city!] = (byCityMap[e.city!] ?? 0) + (e.revenue ?? 0);
    });
    const revenueByCity = Object.entries(byCityMap)
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Conversion funnel
    const funnelTypes = ["product.viewed", "cart.item_added", "checkout.started", "order.placed", "order.paid"];
    const funnel = funnelTypes.map((type) => ({
      event_type: type,
      users: new Set(
        todayRealEvents.filter((e) => e.eventType === type).map((e) => e.sessionId ?? String(e.userId))
      ).size,
    }));

    // ── Bot stats – query per persona type, capped at 200 events per type
    const botEventTypes = ["bot.session_start", "order.placed", "cart.abandoned", "order.paid"];
    const botRawEvents: typeof todayRealEvents = [];
    for (const type of botEventTypes) {
      const events = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_bot_and_type", (q) => q.eq("isBotGenerated", true).eq("eventType", type))
        .take(200);
      botRawEvents.push(...events);
    }

    const botPersonas = [...new Set(botRawEvents.map((e) => e.botPersona).filter(Boolean))] as string[];
    const botStats = botPersonas.map((persona) => {
      const pe = botRawEvents.filter((e) => e.botPersona === persona);
      const sessions     = pe.filter((e) => e.eventType === "bot.session_start").length;
      const purchases    = pe.filter((e) => e.eventType === "order.placed").length;
      const abandonments = pe.filter((e) => e.eventType === "cart.abandoned").length;
      const revenue      = pe.filter((e) => e.eventType === "order.paid").reduce((s, e) => s + (e.revenue ?? 0), 0);
      return {
        bot_persona: persona,
        sessions, purchases, abandonments, revenue,
        conversion_rate: sessions > 0 ? (purchases / sessions * 100).toFixed(1) : "0",
      };
    });

    return {
      today: { revenue: todayRevenue, orders: todayOrders, newUsers: todayUsers },
      revenueByHour: Object.entries(revenueByHour).map(([hour, revenue]) => ({ hour: Number(hour), revenue })),
      revenueByCity,
      funnel,
      botStats,
    };
  },
});

// ── Reviews ───────────────────────────────────────────────────
export const getProductReviews = query({
  args: { productId: v.id("products"), page: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const withUser = await Promise.all(all.map(async (r) => ({
      ...r, user: await ctx.db.get(r.userId),
    })));
    return withUser;
  },
});

export const createReview = mutation({
  args: {
    userId: v.id("users"), productId: v.id("products"),
    rating: v.number(), title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reviews", {
      ...args, images: [], status: "pending",
      helpfulCount: 0, isVerifiedPurchase: false,
    });
    return id;
  },
});

// ── Wishlist ──────────────────────────────────────────────────
export const getWishlist = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    return await Promise.all(items.map(async (w) => ({
      ...w, product: await ctx.db.get(w.productId),
    })));
  },
});

export const toggleWishlist = mutation({
  args: { userId: v.id("users"), productId: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("wishlists")
      .withIndex("by_user_product", (q) => q.eq("userId", args.userId).eq("productId", args.productId))
      .first();
    if (existing) { await ctx.db.delete(existing._id); return false; }
    await ctx.db.insert("wishlists", args); return true;
  },
});

// ── Users ─────────────────────────────────────────────────────
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const createUser = mutation({
  args: {
    email: v.string(), firstName: v.string(), lastName: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args, role: "customer", status: "pending_verification",
      emailVerified: false, totalOrders: 0, totalSpent: 0,
    });
  },
});

export const adminListUsers = query({
  args: { page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const all = await ctx.db.query("users").order("desc").collect();
    const page = args.page ?? 1;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      meta: { total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) },
    };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create Categories
    const categories = [
      { name: "Electronics & Gadgets", slug: "electronics-gadgets", description: "Smartphones, laptops, and more.", isActive: true, sortOrder: 1, level: 1, productCount: 0 },
      { name: "Fashion & Clothing", slug: "fashion-clothing", description: "Men, women, and kids apparel.", isActive: true, sortOrder: 2, level: 1, productCount: 0 },
      { name: "Home & Living", slug: "home-living", description: "Furniture, decor, and appliances.", isActive: true, sortOrder: 3, level: 1, productCount: 0 },
      { name: "Food & Groceries", slug: "food-groceries", description: "Fresh food and daily essentials.", isActive: true, sortOrder: 4, level: 1, productCount: 0 },
      { name: "Software & Services", slug: "software-services", description: "Digital products and subscriptions.", isActive: true, sortOrder: 5, level: 1, productCount: 0 },
    ];

    const categoryIds: Record<string, any> = {};

    for (const cat of categories) {
      const existing = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", cat.slug)).first();
      if (!existing) {
        categoryIds[cat.slug] = await ctx.db.insert("categories", cat);
      } else {
        categoryIds[cat.slug] = existing._id;
      }
    }

    // 2. Create Products
    const products = [
      {
        name: "Smartphone Pro Max", slug: "smartphone-pro-max", description: "Latest 5G smartphone with incredible camera.", shortDescription: "Next gen smartphone",
        price: 450000, status: "active", type: "physical", stockQuantity: 50, lowStockThreshold: 10, trackInventory: true,
        images: ["https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=500&auto=format&fit=crop",
        hasVariants: false, tags: ["tech", "mobile"], viewCount: 150, salesCount: 30, averageRating: 4.8, reviewCount: 12,
        isFeatured: true, isBestSeller: true, isNewArrival: false, freeShipping: true, brand: "TechCorp", categoryId: categoryIds["electronics-gadgets"],
      },
      {
        name: "Noise Cancelling Headphones", slug: "noise-cancelling-headphones", description: "Premium over-ear headphones.", shortDescription: "Immersive audio",
        price: 85000, status: "active", type: "physical", stockQuantity: 100, lowStockThreshold: 10, trackInventory: true,
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
        hasVariants: false, tags: ["audio", "tech"], viewCount: 320, salesCount: 80, averageRating: 4.5, reviewCount: 45,
        isFeatured: false, isBestSeller: true, isNewArrival: true, freeShipping: false, brand: "SoundMakers", categoryId: categoryIds["electronics-gadgets"],
      },
      {
        name: "Designer Denim Jacket", slug: "designer-denim-jacket", description: "Classic blue denim jacket.", shortDescription: "Timeless style",
        price: 25000, status: "active", type: "physical", stockQuantity: 30, lowStockThreshold: 5, trackInventory: true,
        images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop",
        hasVariants: false, tags: ["clothing", "fashion"], viewCount: 90, salesCount: 15, averageRating: 4.2, reviewCount: 8,
        isFeatured: true, isBestSeller: false, isNewArrival: true, freeShipping: true, brand: "StyleBrand", categoryId: categoryIds["fashion-clothing"],
      },
      {
        name: "Modern Coffee Table", slug: "modern-coffee-table", description: "Minimalist wooden coffee table.", shortDescription: "Sleek living room addition",
        price: 120000, status: "active", type: "physical", stockQuantity: 15, lowStockThreshold: 3, trackInventory: true,
        images: ["https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop",
        hasVariants: false, tags: ["furniture", "home"], viewCount: 200, salesCount: 5, averageRating: 5.0, reviewCount: 3,
        isFeatured: true, isBestSeller: false, isNewArrival: false, freeShipping: false, brand: "WoodWorks", categoryId: categoryIds["home-living"],
      },
    ];

    for (const prod of products) {
      const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", prod.slug)).first();
      if (!existing) {
        await ctx.db.insert("products", prod as any);
      }
    }
    return "Database seeded successfully!";
  },
});
