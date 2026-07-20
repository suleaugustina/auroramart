#!/usr/bin/env ts-node
"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 *  AURORAMART BOT SIMULATOR
 *  ─────────────────────────────────────────────────────────────
 *  Generates realistic synthetic user traffic directly into
 *  Convex database for BI pipeline validation and analytics.
 *
 *  Uses the Convex HTTP API (not the JS client) so it can run
 *  standalone without the frontend.
 *
 *  Run:
 *    npm run start                     # 100 bots, 20 concurrent
 *    TOTAL=1000 CONCURRENT=50 npm run start
 *    npm run load-test                 # 1000 bots, 50 concurrent
 *
 *  Env:
 *    CONVEX_URL      — your Convex deployment URL
 *    TOTAL           — total bots to simulate (default 100)
 *    CONCURRENT      — parallel bots at once (default 20)
 *    DELAY_MS        — ms between bot actions (default 800)
 * ═══════════════════════════════════════════════════════════════
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const browser_1 = require("convex/browser");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load env — tries .env.local at workspace root (local dev), then .env in same dir.
// On Railway/Docker, CONVEX_URL is injected directly — these are no-ops there.
const envPaths = [
    path.join(__dirname, '../../.env.local'), // local: bots/dist/ -> workspace root
    path.join(__dirname, '../.env.local'), // fallback
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '.env'),
];
for (const envPath of envPaths) {
    const result = dotenv.config({ path: envPath });
    if (!result.error)
        break; // stop at first found file
}
// ── Config ────────────────────────────────────────────────────
const rawConvexUrl = process.env.CONVEX_URL ?? 'http://localhost:3000';
// Strip trailing slash, then normalise .convex.site -> .convex.cloud
// (.site is the HTTP Actions domain; .cloud is the deployment URL for client queries/mutations)
const CONVEX_URL = rawConvexUrl
    .replace(/\/$/, '') // remove trailing slash
    .replace(/\.convex\.site$/, '.convex.cloud'); // fix common Railway env var mistake
const COLLECTOR_URL = process.env.COLLECTOR_URL ?? 'http://localhost:5001';
// ── Resource budget (Convex free tier: ~1M calls/month) ──────────
// Each bot session ≈ 45 Convex calls. Budget targets:
//   20 bots × 45 calls = 900/batch × 12 batches/day = 10,800/day × 30d = 324,000/month ✓
// DO NOT raise TOTAL above 30 or lower daemon sleep below 60 min.
const TOTAL_BOTS = parseInt(process.env.TOTAL ?? '20'); // ⬇ reduced from 100
const CONCURRENT = parseInt(process.env.CONCURRENT ?? '3'); // ⬇ reduced from 5
const DELAY_MS = parseInt(process.env.DELAY_MS ?? '1500'); // ⬆ slower actions = fewer OCC conflicts
const STAGGER_MS = parseInt(process.env.STAGGER_MS ?? '500'); // ms between bot starts within a batch
const API_BASE = process.env.API_URL ?? CONVEX_URL;
const DAEMON = process.env.DAEMON === 'true';
// Daemon sleep range — must stay ≥ 60 min to stay within monthly budget
const DAEMON_SLEEP_MIN = parseInt(process.env.DAEMON_SLEEP_MIN ?? '60'); // minutes
const DAEMON_SLEEP_MAX = parseInt(process.env.DAEMON_SLEEP_MAX ?? '120'); // minutes
const client = new browser_1.ConvexHttpClient(CONVEX_URL, { skipConvexDeploymentUrlCheck: true });
// ── Persona Profiles ──────────────────────────────────────────
const PERSONAS = {
    impulse_buyer: { purchaseProb: 0.78, avgProductsViewed: 3, preferredCategories: ['fashion-clothing', 'electronics-gadgets'], priceRange: [2000, 80000], avgQty: [1, 2], description: 'Buys quickly, minimal research' },
    window_shopper: { purchaseProb: 0.06, avgProductsViewed: 18, preferredCategories: ['home-living', 'fashion-clothing'], priceRange: [500, 500000], avgQty: [1, 1], description: 'Browses extensively, rarely buys' },
    deal_hunter: { purchaseProb: 0.52, avgProductsViewed: 8, preferredCategories: ['food-groceries', 'home-living'], priceRange: [500, 20000], avgQty: [1, 3], description: 'Price-focused, hunts discounts' },
    loyal_customer: { purchaseProb: 0.82, avgProductsViewed: 4, preferredCategories: ['food-groceries', 'electronics-gadgets'], priceRange: [1000, 100000], avgQty: [1, 2], description: 'Returns regularly, high conversion' },
    new_visitor: { purchaseProb: 0.10, avgProductsViewed: 12, preferredCategories: ['electronics-gadgets', 'fashion-clothing'], priceRange: [1000, 50000], avgQty: [1, 1], description: 'First-timer, slow and curious' },
    fraud_attempt: { purchaseProb: 0.25, avgProductsViewed: 2, preferredCategories: ['electronics-gadgets', 'software-services'], priceRange: [100000, 800000], avgQty: [1, 5], description: 'High-value, suspicious patterns' },
    bulk_buyer: { purchaseProb: 0.62, avgProductsViewed: 5, preferredCategories: ['food-groceries', 'home-living'], priceRange: [10000, 300000], avgQty: [5, 20], description: 'Large quantity purchases' },
    tech_enthusiast: { purchaseProb: 0.42, avgProductsViewed: 14, preferredCategories: ['electronics-gadgets', 'software-services'], priceRange: [10000, 600000], avgQty: [1, 2], description: 'Deep researcher, tech-focused' },
    fashionista: { purchaseProb: 0.58, avgProductsViewed: 22, preferredCategories: ['fashion-clothing'], priceRange: [5000, 200000], avgQty: [1, 4], description: 'Fashion-obsessed, browsing-heavy' },
    budget_shopper: { purchaseProb: 0.38, avgProductsViewed: 9, preferredCategories: ['food-groceries', 'fashion-clothing'], priceRange: [200, 15000], avgQty: [1, 2], description: 'Extremely price-sensitive' },
};
// ── Nigerian Data ─────────────────────────────────────────────
const FIRST_NAMES = ['Emeka', 'Chioma', 'Tunde', 'Amaka', 'Seun', 'Ngozi', 'Biodun', 'Fatima', 'Musa', 'Aisha', 'Chukwu', 'Blessing', 'David', 'Grace', 'Solomon', 'Precious', 'Emmanuel', 'Joy', 'Kemi', 'Bola', 'Chidi', 'Adaeze', 'Ifeanyi', 'Yetunde'];
const LAST_NAMES = ['Okonkwo', 'Adeyemi', 'Bello', 'Nwosu', 'Okafor', 'Ibrahim', 'Eze', 'Adeleke', 'Musa', 'Obi', 'Abubakar', 'Chukwu', 'Olawale', 'Nnamdi', 'Yakubu', 'Uche', 'Sani', 'Oghenekaro', 'Akintola', 'Danjuma', 'Onyeka'];
const CITIES = ['Lagos', 'Abuja', 'Benin City', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Aba'];
const DEVICES = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet']; // mobile-weighted
const PAYMENT_METHODS = ['card', 'bank_transfer', 'ussd', 'mobile_money'];
const NIGERIAN_STREETS = ['Adekunle Street', 'Okafor Avenue', 'Bello Road', 'Nnamdi Azikiwe Street', 'Herbert Macaulay Way', 'Lagos Island', 'Allen Avenue', 'Ogui Road'];
// ── Utilities ─────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base) => base * (0.5 + Math.random());
// ── Convex HTTP API caller (with retry + exponential backoff) ──
async function convexMutation(fn, args, retries = 4) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await client.mutation(fn, args);
        }
        catch (e) {
            const isOCC = e?.message?.includes('OCC') || e?.message?.includes('optimistic concurrency');
            const isRetryable = isOCC || e?.message?.includes('rate limit') || e?.message?.includes('throttl');
            if (attempt < retries && isRetryable) {
                const backoff = 200 * Math.pow(2, attempt) + Math.random() * 100;
                await sleep(backoff);
                continue;
            }
            // Non-retryable or exhausted — log and return null
            if (!isOCC)
                console.error(`Mutation ${fn} failed:`, e instanceof Error ? e.message : e);
            return null;
        }
    }
    return null;
}
async function convexQuery(fn, args, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await client.query(fn, args);
        }
        catch (e) {
            if (attempt < retries) {
                await sleep(150 * Math.pow(2, attempt));
                continue;
            }
            console.error(`Query ${fn} failed:`, e instanceof Error ? e.message : e);
            return null;
        }
    }
    return null;
}
// ── Bot Class ─────────────────────────────────────────────────
class AuroraMartBot {
    persona;
    cfg;
    city;
    device;
    sessionId;
    firstName;
    lastName;
    userId = null;
    cartId = null;
    cartItems = [];
    stats = { productsViewed: 0, addedToCart: 0, purchases: 0, abandonments: 0, revenue: 0, errors: 0 };
    constructor(persona) {
        this.persona = persona;
        this.cfg = PERSONAS[persona];
        this.city = pick(CITIES);
        this.device = pick(DEVICES);
        this.sessionId = crypto.randomUUID();
        this.firstName = pick(FIRST_NAMES);
        this.lastName = pick(LAST_NAMES);
    }
    async run(staggerMs = 0) {
        try {
            // Stagger start within a batch to reduce write contention
            if (staggerMs > 0)
                await sleep(staggerMs);
            await this.track('bot.session_start');
            await this.createUser();
            await sleep(jitter(DELAY_MS));
            const products = await this.browseProducts();
            await sleep(jitter(DELAY_MS));
            if (products.length > 0) {
                await this.buildCart(products);
                await sleep(jitter(DELAY_MS * 1.5));
                await this.checkout();
            }
            await this.track('bot.session_end', { metadata: { stats: this.stats } });
        }
        catch {
            this.stats.errors++;
        }
        return this.stats;
    }
    async createUser() {
        // Create a lightweight bot user
        const email = `bot.${this.firstName.toLowerCase()}.${rand(1000, 9999)}@testmail.dev`;
        const userId = await convexMutation('functions:createUser', {
            email,
            firstName: this.firstName,
            lastName: this.lastName,
            passwordHash: '$2a$12$botuserpasswordhash', // placeholder
        });
        this.userId = userId ?? null;
        if (this.userId) {
            this.cartId = await convexMutation('functions:getOrCreateCart', {
                userId: this.userId,
                sessionId: this.sessionId,
            });
        }
    }
    async browseProducts() {
        const viewed = [];
        const count = rand(Math.max(1, this.cfg.avgProductsViewed - 3), this.cfg.avgProductsViewed + 3);
        for (let i = 0; i < count; i++) {
            const category = pick(this.cfg.preferredCategories);
            const results = await convexQuery('products:list', {
                page: 1, limit: 20,
                minPrice: this.cfg.priceRange[0],
                maxPrice: this.cfg.priceRange[1],
            });
            const products = results?.items ?? [];
            if (products.length > 0) {
                const product = pick(products);
                viewed.push(product);
                this.stats.productsViewed++;
                await this.track('product.viewed', {
                    productId: product._id,
                    metadata: { name: product.name, price: product.price, category },
                });
                await convexMutation('products:incrementView', { id: product._id });
                await sleep(jitter(DELAY_MS * 2));
            }
        }
        return viewed;
    }
    async buildCart(products) {
        if (!this.cartId)
            return;
        const toAdd = Math.max(1, Math.ceil(products.length * 0.4));
        for (let i = 0; i < toAdd && i < products.length; i++) {
            const product = products[i];
            const qty = rand(this.cfg.avgQty[0], this.cfg.avgQty[1]);
            try {
                await convexMutation('functions:addToCart', {
                    cartId: this.cartId,
                    productId: product._id,
                    quantity: qty,
                });
                this.cartItems.push({ ...product, quantity: qty });
                this.stats.addedToCart++;
                await this.track('cart.item_added', {
                    productId: product._id,
                    metadata: { quantity: qty, price: product.price },
                });
            }
            catch { }
            await sleep(jitter(DELAY_MS));
        }
    }
    async checkout() {
        if (!this.cartItems.length || !this.userId)
            return;
        const cartValue = this.cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        // Cart abandonment check
        if (Math.random() >= this.cfg.purchaseProb) {
            await this.track('cart.abandoned', {
                revenue: cartValue,
                metadata: { reason: pick(['price_shock', 'distraction', 'no_payment', 'slow_page', 'just_browsing']) },
            });
            this.stats.abandonments++;
            return;
        }
        try {
            await this.track('checkout.started');
            await sleep(jitter(DELAY_MS * 4));
            const order = await convexMutation('orders:create', {
                userId: this.userId,
                items: this.cartItems.map((i) => ({
                    productId: i._id,
                    quantity: i.quantity,
                })),
                shippingAddress: {
                    fullName: `${this.firstName} ${this.lastName}`,
                    phone: `0${rand(7000000000, 9099999999)}`,
                    street: `${rand(1, 200)} ${pick(NIGERIAN_STREETS)}`,
                    city: this.city,
                    state: this.city === 'Lagos' ? 'Lagos' : `${this.city} State`,
                    country: 'Nigeria',
                },
                source: 'bot_test',
                isBotGenerated: true,
                botPersona: this.persona,
            });
            if (order?.orderId) {
                this.stats.purchases++;
                this.stats.revenue += cartValue;
                await this.track('order.placed', {
                    orderId: order.orderId,
                    revenue: cartValue,
                    metadata: { paymentMethod: pick(PAYMENT_METHODS), orderNumber: order.orderNumber },
                });
                // Simulate payment (88% success)
                if (Math.random() < 0.88) {
                    await convexMutation('orders:markPaid', {
                        id: order.orderId,
                        paystackRef: `test_${crypto.randomUUID().slice(0, 8)}`,
                        paystackTxId: `${rand(100000, 999999)}`,
                    });
                    await this.track('order.paid', { orderId: order.orderId, revenue: cartValue });
                }
                else {
                    await this.track('payment.failed', {
                        orderId: order.orderId,
                        metadata: { reason: 'insufficient_funds' },
                    });
                }
            }
        }
        catch {
            this.stats.errors++;
        }
    }
    async track(eventType, extra = {}) {
        const payload = {
            eventType,
            userId: this.userId ?? undefined,
            sessionId: this.sessionId,
            device: this.device,
            city: this.city,
            country: 'Nigeria',
            source: 'bot_test',
            isBotGenerated: true,
            botPersona: this.persona,
            ...extra,
        };
        // 1. Write to Convex (main application database)
        await convexMutation('functions:trackEvent', payload);
        // 2. Send to Analytics Collector (direct-to-PostgreSQL pipeline)
        try {
            await axios_1.default.post(`${COLLECTOR_URL}/events`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 3000, // Fail-fast so bot run is never blocked
            });
        }
        catch {
            // Silently ignore if collector is not reachable
        }
    }
}
// ── Simulation Runner ──────────────────────────────────────────
async function run() {
    do {
        const personas = Object.keys(PERSONAS);
        const bots = Array.from({ length: TOTAL_BOTS }, (_, i) => new AuroraMartBot(personas[i % personas.length]));
        const allResults = [];
        console.log(`
╔═══════════════════════════════════════════╗
║       AURORAMART BOT SIMULATOR            ║
╠═══════════════════════════════════════════╣
║  Target:      ${API_BASE.padEnd(27)}║
║  Total bots:  ${String(TOTAL_BOTS).padEnd(27)}║
║  Concurrent:  ${String(CONCURRENT).padEnd(27)}║
║  Mode:        ${(DAEMON ? 'Daemon (Continuous)' : 'Single Run').padEnd(27)}║
╚═══════════════════════════════════════════╝`);
        const start = Date.now();
        for (let i = 0; i < bots.length; i += CONCURRENT) {
            const batch = bots.slice(i, i + CONCURRENT);
            const n = Math.floor(i / CONCURRENT) + 1;
            const total = Math.ceil(bots.length / CONCURRENT);
            process.stdout.write(`  Batch ${n}/${total} (${batch.length} bots)… `);
            const settled = await Promise.allSettled(batch.map((b, idx) => b.run(idx * STAGGER_MS)));
            settled.forEach((r) => { if (r.status === 'fulfilled')
                allResults.push(r.value); });
            console.log(`done (${Date.now() - start}ms elapsed)`);
            if (i + CONCURRENT < bots.length)
                await sleep(2000);
        }
        // Summary
        const purchases = allResults.reduce((s, r) => s + r.purchases, 0);
        const abandonments = allResults.reduce((s, r) => s + r.abandonments, 0);
        const revenue = allResults.reduce((s, r) => s + r.revenue, 0);
        const views = allResults.reduce((s, r) => s + r.productsViewed, 0);
        // Per-persona breakdown
        const byPersona = {};
        bots.forEach((bot, idx) => {
            const r = allResults[idx];
            if (!r)
                return;
            const p = bot.persona;
            if (!byPersona[p])
                byPersona[p] = { sessions: 0, purchases: 0, revenue: 0 };
            byPersona[p].sessions++;
            byPersona[p].purchases += r.purchases;
            byPersona[p].revenue += r.revenue;
        });
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`
╔═══════════════════════════════════════════╗
║        SIMULATION COMPLETE                ║
╠═══════════════════════════════════════════╣
║  Duration:      ${elapsed.padEnd(26)}s║
║  Bots ran:      ${String(allResults.length).padEnd(27)}║
║  Views:         ${String(views).padEnd(27)}║
║  Purchases:     ${String(purchases).padEnd(27)}║
║  Abandonments:  ${String(abandonments).padEnd(27)}║
║  Revenue:       ₦${String(revenue.toLocaleString()).padEnd(26)}║
╠═══════════════════════════════════════════╣
║  CONVERSION BY PERSONA                    ║`);
        Object.entries(byPersona)
            .sort(([, a], [, b]) => (b.purchases / b.sessions) - (a.purchases / a.sessions))
            .forEach(([persona, s]) => {
            const rate = s.sessions > 0 ? ((s.purchases / s.sessions) * 100).toFixed(1) : '0.0';
            const label = `${persona.replace(/_/g, ' ')} (${rate}%)`;
            console.log(`║  ${label.padEnd(43)}║`);
        });
        console.log(`╚═══════════════════════════════════════════╝`);
        if (DAEMON) {
            // Sleep 60–120 min between batches to stay within Convex free-tier budget (~1M calls/month).
            // Each batch of 20 bots uses ~900 calls; 12 batches/day × 900 = ~10,800/day = ~324k/month.
            const waitMinutes = rand(DAEMON_SLEEP_MIN, DAEMON_SLEEP_MAX);
            const nextRun = new Date(Date.now() + waitMinutes * 60 * 1000).toLocaleTimeString();
            console.log(`\n[Daemon Mode] Budget-safe sleep: ${waitMinutes} min. Next batch at ${nextRun}`);
            await sleep(waitMinutes * 60 * 1000);
        }
    } while (DAEMON);
}
run().catch(console.error);
