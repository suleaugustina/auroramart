import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users ────────────────────────────────────────────────
  users: defineTable({
    clerkId:       v.optional(v.string()),
    email:         v.string(),
    firstName:     v.string(),
    lastName:      v.string(),
    phone:         v.optional(v.string()),
    avatar:        v.optional(v.string()),
    role:          v.union(v.literal("customer"), v.literal("vendor"), v.literal("admin"), v.literal("super_admin")),
    status:        v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"), v.literal("pending_verification")),
    emailVerified: v.boolean(),
    passwordHash:  v.optional(v.string()),
    refreshToken:  v.optional(v.string()),
    lastLoginAt:   v.optional(v.number()),
    lastLoginIp:   v.optional(v.string()),
    totalOrders:   v.number(),
    totalSpent:    v.number(),
    preferences:   v.optional(v.object({
      currency:      v.optional(v.string()),
      emailNotifs:   v.optional(v.boolean()),
    })),
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"])
    .index("by_role", ["role"]),

  // ── Addresses ────────────────────────────────────────────
  addresses: defineTable({
    userId:     v.id("users"),
    label:      v.string(),
    fullName:   v.string(),
    phone:      v.string(),
    street:     v.string(),
    city:       v.string(),
    state:      v.string(),
    country:    v.string(),
    postalCode: v.optional(v.string()),
    landmark:   v.optional(v.string()),
    isDefault:  v.boolean(),
  }).index("by_user", ["userId"]),

  // ── Categories ───────────────────────────────────────────
  categories: defineTable({
    name:         v.string(),
    slug:         v.string(),
    description:  v.optional(v.string()),
    image:        v.optional(v.string()),
    isActive:     v.boolean(),
    sortOrder:    v.number(),
    level:        v.number(),
    productCount: v.number(),
    parentId:     v.optional(v.id("categories")),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_active", ["isActive"]),

  // ── Products ─────────────────────────────────────────────
  products: defineTable({
    name:             v.string(),
    slug:             v.string(),
    description:      v.string(),
    shortDescription: v.optional(v.string()),
    price:            v.number(),
    compareAtPrice:   v.optional(v.number()),
    costPrice:        v.optional(v.number()),
    status:           v.union(v.literal("draft"), v.literal("active"), v.literal("out_of_stock"), v.literal("discontinued")),
    type:             v.union(v.literal("physical"), v.literal("digital"), v.literal("service")),
    stockQuantity:    v.number(),
    lowStockThreshold:v.number(),
    trackInventory:   v.boolean(),
    sku:              v.optional(v.string()),
    barcode:          v.optional(v.string()),
    images:           v.array(v.string()),
    thumbnail:        v.optional(v.string()),
    hasVariants:      v.boolean(),
    variants:         v.optional(v.array(v.object({
      id:      v.string(),
      name:    v.string(),
      options: v.any(),
      price:   v.number(),
      stock:   v.number(),
      sku:     v.optional(v.string()),
    }))),
    attributes:       v.optional(v.any()),
    tags:             v.array(v.string()),
    viewCount:        v.number(),
    salesCount:       v.number(),
    averageRating:    v.number(),
    reviewCount:      v.number(),
    isFeatured:       v.boolean(),
    isBestSeller:     v.boolean(),
    isNewArrival:     v.boolean(),
    freeShipping:     v.boolean(),
    weight:           v.optional(v.number()),
    brand:            v.string(),
    categoryId:       v.id("categories"),
    metaTitle:        v.optional(v.string()),
    metaDescription:  v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_featured", ["isFeatured"])
    .index("by_bestseller", ["isBestSeller"])
    .index("by_new_arrival", ["isNewArrival"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["status", "categoryId"],
    }),

  // ── Carts ────────────────────────────────────────────────
  carts: defineTable({
    userId:        v.optional(v.id("users")),
    sessionId:     v.optional(v.string()),
    couponCode:    v.optional(v.string()),
    couponDiscount:v.number(),
    expiresAt:     v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  cartItems: defineTable({
    cartId:     v.id("carts"),
    productId:  v.id("products"),
    variantId:  v.optional(v.string()),
    quantity:   v.number(),
    priceAtAdd: v.number(),
  })
    .index("by_cart", ["cartId"])
    .index("by_product", ["productId"]),

  // ── Orders ───────────────────────────────────────────────
  orders: defineTable({
    orderNumber:      v.string(),
    userId:           v.id("users"),
    subtotal:         v.number(),
    shippingFee:      v.number(),
    discount:         v.number(),
    tax:              v.number(),
    total:            v.number(),
    currency:         v.string(),
    status:           v.string(),
    paymentStatus:    v.string(),
    paymentMethod:    v.optional(v.string()),
    paystackRef:      v.optional(v.string()),
    paystackTxId:     v.optional(v.string()),
    shippingAddress:  v.object({
      fullName:  v.string(),
      phone:     v.string(),
      street:    v.string(),
      city:      v.string(),
      state:     v.string(),
      country:   v.string(),
      landmark:  v.optional(v.string()),
    }),
    trackingNumber:   v.optional(v.string()),
    deliveredAt:      v.optional(v.number()),
    couponCode:       v.optional(v.string()),
    statusHistory:    v.array(v.object({
      status:    v.string(),
      timestamp: v.number(),
      note:      v.optional(v.string()),
    })),
    source:           v.string(),
    isBotGenerated:   v.boolean(),
    botPersona:       v.optional(v.string()),
    notes:            v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_bot", ["isBotGenerated"]),

  orderItems: defineTable({
    orderId:      v.id("orders"),
    productId:    v.id("products"),
    productName:  v.string(),
    productImage: v.optional(v.string()),
    variantId:    v.optional(v.string()),
    variantName:  v.optional(v.string()),
    quantity:     v.number(),
    unitPrice:    v.number(),
    totalPrice:   v.number(),
    isReviewed:   v.boolean(),
  })
    .index("by_order", ["orderId"])
    .index("by_product", ["productId"]),

  // ── Reviews ──────────────────────────────────────────────
  reviews: defineTable({
    userId:             v.id("users"),
    productId:          v.id("products"),
    rating:             v.number(),
    title:              v.optional(v.string()),
    body:               v.optional(v.string()),
    images:             v.array(v.string()),
    status:             v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    helpfulCount:       v.number(),
    isVerifiedPurchase: v.boolean(),
    adminReply:         v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ── Wishlists ────────────────────────────────────────────
  wishlists: defineTable({
    userId:    v.id("users"),
    productId: v.id("products"),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  // ── Coupons ──────────────────────────────────────────────
  coupons: defineTable({
    code:           v.string(),
    type:           v.union(v.literal("percentage"), v.literal("fixed"), v.literal("free_shipping")),
    value:          v.number(),
    minOrderAmount: v.number(),
    maxDiscount:    v.optional(v.number()),
    usageLimit:     v.optional(v.number()),
    usageCount:     v.number(),
    perUserLimit:   v.number(),
    isActive:       v.boolean(),
    startsAt:       v.optional(v.number()),
    expiresAt:      v.optional(v.number()),
    description:    v.optional(v.string()),
  }).index("by_code", ["code"]),

  // ── Analytics Events ─────────────────────────────────────
  analyticsEvents: defineTable({
    eventType:      v.string(),
    userId:         v.optional(v.id("users")),
    sessionId:      v.optional(v.string()),
    productId:      v.optional(v.id("products")),
    orderId:        v.optional(v.id("orders")),
    source:         v.optional(v.string()),
    device:         v.optional(v.string()),
    city:           v.optional(v.string()),
    country:        v.optional(v.string()),
    metadata:       v.optional(v.any()),
    revenue:        v.optional(v.number()),
    isBotGenerated: v.boolean(),
    botPersona:     v.optional(v.string()),
  })
    .index("by_type", ["eventType"])
    .index("by_user", ["userId"])
    .index("by_bot", ["isBotGenerated"])
    .index("by_session", ["sessionId"]),

  // ── Inventory Alerts ─────────────────────────────────────
  inventoryAlerts: defineTable({
    productId:  v.id("products"),
    alertType:  v.union(v.literal("low_stock"), v.literal("out_of_stock"), v.literal("restock")),
    quantity:   v.number(),
    isResolved: v.boolean(),
    note:       v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_resolved", ["isResolved"]),

  // ── Notifications ────────────────────────────────────────
  notifications: defineTable({
    userId:    v.id("users"),
    type:      v.string(),
    title:     v.string(),
    body:      v.string(),
    isRead:    v.boolean(),
    link:      v.optional(v.string()),
    metadata:  v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
});
