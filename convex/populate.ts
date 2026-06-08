import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const run = mutation({
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

    // 2. Generators
    const brands = {
      "electronics-gadgets": ["Samsung", "Apple", "Sony", "Dell", "HP", "Anker", "JBL"],
      "fashion-clothing": ["Zara", "H&M", "Nike", "Adidas", "Gucci", "Levi's"],
      "home-living": ["IKEA", "Wayfair", "LG", "Philips", "Dyson"],
      "food-groceries": ["Nestle", "Kellogg's", "Heinz", "Unilever", "Coca-Cola"],
      "software-services": ["Microsoft", "Adobe", "Autodesk", "Intuit", "Kaspersky"]
    };

    const images = {
      "electronics-gadgets": [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop"
      ],
      "fashion-clothing": [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1434389678259-24db00b4e10b?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550614000-4b95d466e872?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1489987707023-afc232d7ea38?w=500&auto=format&fit=crop"
      ],
      "home-living": [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop"
      ],
      "food-groceries": [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1587049352847-81a56d773c1c?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&auto=format&fit=crop"
      ],
      "software-services": [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop"
      ]
    };

    const adjectives = ["Premium", "Essential", "Advanced", "Classic", "Modern", "Pro", "Ultra", "Smart", "Eco"];
    const nouns = {
      "electronics-gadgets": ["Smartphone", "Laptop", "Headphones", "Tablet", "Monitor", "Keyboard", "Mouse"],
      "fashion-clothing": ["T-Shirt", "Jeans", "Jacket", "Sneakers", "Dress", "Sweater", "Watch"],
      "home-living": ["Sofa", "Lamp", "Coffee Table", "Rug", "Bookshelf", "Chair"],
      "food-groceries": ["Organic Coffee", "Cereal", "Olive Oil", "Pasta", "Green Tea", "Almonds"],
      "software-services": ["Antivirus", "Cloud Storage", "Design Suite", "VPN", "Code Editor"]
    };

    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    let added = 0;

    for (const catSlug of Object.keys(categoryIds)) {
      const catId = categoryIds[catSlug];
      const itemsCount = 20; // 20 items per category = 100 items total

      for (let i = 0; i < itemsCount; i++) {
        const adj = pick(adjectives);
        const noun = pick((nouns as any)[catSlug]);
        const brand = pick((brands as any)[catSlug]);
        const name = `${brand} ${adj} ${noun} ${rand(1, 99)}`;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        
        const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        if (existing) continue;

        const img = pick((images as any)[catSlug]);

        const prod = {
          name,
          slug,
          description: `This is a highly recommended ${noun.toLowerCase()} from ${brand}. It features ${adj.toLowerCase()} quality and excellent value.`,
          shortDescription: `${adj} ${noun}`,
          price: rand(1000, 500000),
          status: "active",
          type: "physical",
          stockQuantity: rand(5, 200),
          lowStockThreshold: 10,
          trackInventory: true,
          images: [img],
          thumbnail: img,
          hasVariants: false,
          tags: [catSlug.split('-')[0], noun.toLowerCase()],
          viewCount: rand(0, 500),
          salesCount: rand(0, 150),
          averageRating: (rand(30, 50) / 10),
          reviewCount: rand(0, 200),
          isFeatured: Math.random() > 0.8,
          isBestSeller: Math.random() > 0.8,
          isNewArrival: Math.random() > 0.7,
          freeShipping: Math.random() > 0.5,
          brand,
          categoryId: catId,
        };

        await ctx.db.insert("products", prod as any);
        added++;
      }
    }

    return `Database populated successfully! Added ${added} new products.`;
  },
});
