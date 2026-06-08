import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create Categories
    const categories = [
      {
        name: "Electronics & Gadgets",
        slug: "electronics-gadgets",
        description: "Smartphones, laptops, and more.",
        isActive: true,
        sortOrder: 1,
        level: 1,
        productCount: 0,
      },
      {
        name: "Fashion & Clothing",
        slug: "fashion-clothing",
        description: "Men, women, and kids apparel.",
        isActive: true,
        sortOrder: 2,
        level: 1,
        productCount: 0,
      },
      {
        name: "Home & Living",
        slug: "home-living",
        description: "Furniture, decor, and appliances.",
        isActive: true,
        sortOrder: 3,
        level: 1,
        productCount: 0,
      },
      {
        name: "Food & Groceries",
        slug: "food-groceries",
        description: "Fresh food and daily essentials.",
        isActive: true,
        sortOrder: 4,
        level: 1,
        productCount: 0,
      },
      {
        name: "Software & Services",
        slug: "software-services",
        description: "Digital products and subscriptions.",
        isActive: true,
        sortOrder: 5,
        level: 1,
        productCount: 0,
      },
    ];

    const categoryIds: Record<string, any> = {};

    for (const cat of categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
        .first();

      if (!existing) {
        categoryIds[cat.slug] = await ctx.db.insert("categories", cat);
      } else {
        categoryIds[cat.slug] = existing._id;
      }
    }

    // 2. Create Products
    const products = [
      {
        name: "Smartphone Pro Max",
        slug: "smartphone-pro-max",
        description: "Latest 5G smartphone with incredible camera.",
        shortDescription: "Next gen smartphone",
        price: 450000,
        status: "active",
        type: "physical",
        stockQuantity: 50,
        lowStockThreshold: 10,
        trackInventory: true,
        images: ["https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=500&auto=format&fit=crop",
        hasVariants: false,
        tags: ["tech", "mobile"],
        viewCount: 150,
        salesCount: 30,
        averageRating: 4.8,
        reviewCount: 12,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        freeShipping: true,
        brand: "TechCorp",
        categoryId: categoryIds["electronics-gadgets"],
      },
      {
        name: "Noise Cancelling Headphones",
        slug: "noise-cancelling-headphones",
        description: "Premium over-ear headphones.",
        shortDescription: "Immersive audio",
        price: 85000,
        status: "active",
        type: "physical",
        stockQuantity: 100,
        lowStockThreshold: 10,
        trackInventory: true,
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
        hasVariants: false,
        tags: ["audio", "tech"],
        viewCount: 320,
        salesCount: 80,
        averageRating: 4.5,
        reviewCount: 45,
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: true,
        freeShipping: false,
        brand: "SoundMakers",
        categoryId: categoryIds["electronics-gadgets"],
      },
      {
        name: "Designer Denim Jacket",
        slug: "designer-denim-jacket",
        description: "Classic blue denim jacket.",
        shortDescription: "Timeless style",
        price: 25000,
        status: "active",
        type: "physical",
        stockQuantity: 30,
        lowStockThreshold: 5,
        trackInventory: true,
        images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop",
        hasVariants: false,
        tags: ["clothing", "fashion"],
        viewCount: 90,
        salesCount: 15,
        averageRating: 4.2,
        reviewCount: 8,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        freeShipping: true,
        brand: "StyleBrand",
        categoryId: categoryIds["fashion-clothing"],
      },
      {
        name: "Modern Coffee Table",
        slug: "modern-coffee-table",
        description: "Minimalist wooden coffee table.",
        shortDescription: "Sleek living room addition",
        price: 120000,
        status: "active",
        type: "physical",
        stockQuantity: 15,
        lowStockThreshold: 3,
        trackInventory: true,
        images: ["https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop"],
        thumbnail: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop",
        hasVariants: false,
        tags: ["furniture", "home"],
        viewCount: 200,
        salesCount: 5,
        averageRating: 5.0,
        reviewCount: 3,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: false,
        freeShipping: false,
        brand: "WoodWorks",
        categoryId: categoryIds["home-living"],
      },
    ];

    for (const prod of products) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", prod.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("products", prod as any);
      }
    }
    
    return "Database seeded successfully!";
  },
});
