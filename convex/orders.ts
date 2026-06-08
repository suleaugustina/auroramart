import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.optional(v.string()),
      quantity: v.number(),
    })),
    shippingAddress: v.object({
      fullName: v.string(), phone: v.string(), street: v.string(),
      city: v.string(), state: v.string(), country: v.string(),
      landmark: v.optional(v.string()),
    }),
    couponCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
    isBotGenerated: v.optional(v.boolean()),
    botPersona: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let subtotal = 0;
    const orderItems = [];

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stockQuantity < item.quantity)
        throw new Error(`Insufficient stock for "${product.name}"`);

      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      orderItems.push({
        productId: item.productId, variantId: item.variantId,
        productName: product.name,
        productImage: product.thumbnail ?? product.images[0],
        quantity: item.quantity, unitPrice, totalPrice, isReviewed: false,
      });
    }

    const shippingFee = subtotal >= 50000 ? 0 : 1500;
    const discount = 0;
    const total = subtotal + shippingFee - discount;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `AUR-${date}-${rand}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber, userId: args.userId,
      subtotal, shippingFee, discount, tax: 0, total, currency: "NGN",
      status: "pending", paymentStatus: "pending",
      shippingAddress: args.shippingAddress,
      couponCode: args.couponCode, notes: args.notes,
      source: args.source ?? "web",
      isBotGenerated: args.isBotGenerated ?? false,
      botPersona: args.botPersona,
      statusHistory: [{ status: "pending", timestamp: Date.now() }],
    });

    for (const item of orderItems) {
      await ctx.db.insert("orderItems", { orderId, ...item });
    }

    // Decrement stock
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newQty = product.stockQuantity - item.quantity;
        await ctx.db.patch(item.productId, {
          stockQuantity: newQty,
          salesCount: product.salesCount + item.quantity,
          status: newQty === 0 ? "out_of_stock" : product.status,
        });
      }
    }

    return { orderId, orderNumber, total };
  },
});

export const getByUser = query({
  args: { userId: v.id("users"), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const all = await ctx.db.query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc").collect();

    const page = args.page ?? 1;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      meta: { total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) },
    };
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    const items = await ctx.db.query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.id)).collect();
    return { ...order, items };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      statusHistory: [...order.statusHistory, { status: args.status, timestamp: Date.now(), note: args.note }],
      ...(args.status === "delivered" ? { deliveredAt: Date.now() } : {}),
    });
  },
});

export const markPaid = mutation({
  args: {
    id: v.id("orders"),
    paystackRef: v.string(),
    paystackTxId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    await ctx.db.patch(args.id, {
      paymentStatus: "paid",
      paystackRef: args.paystackRef,
      paystackTxId: args.paystackTxId,
      status: "confirmed",
      statusHistory: [...order.statusHistory, { status: "confirmed", timestamp: Date.now(), note: "Payment confirmed" }],
    });

    // Update user stats
    const user = await ctx.db.get(order.userId);
    if (user) {
      await ctx.db.patch(order.userId, {
        totalOrders: user.totalOrders + 1,
        totalSpent: user.totalSpent + order.total,
      });
    }
  },
});

export const cancel = mutation({
  args: { id: v.id("orders"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    if (order.userId !== args.userId) throw new Error("Not authorized");
    if (!["pending", "confirmed"].includes(order.status))
      throw new Error("Order cannot be cancelled at this stage");

    await ctx.db.patch(args.id, {
      status: "cancelled",
      statusHistory: [...order.statusHistory, { status: "cancelled", timestamp: Date.now(), note: "Cancelled by customer" }],
    });
  },
});

// Admin: all orders
export const adminList = query({
  args: { page: v.optional(v.number()), limit: v.optional(v.number()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    let all = await ctx.db.query("orders").order("desc").collect();
    if (args.status) all = all.filter((o) => o.status === args.status);
    const page = args.page ?? 1;
    return {
      items: all.slice((page - 1) * limit, page * limit),
      meta: { total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) },
    };
  },
});
