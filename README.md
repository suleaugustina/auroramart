# AuroraMart

Premium e-commerce platform built with Next.js 14, Convex, and NestJS.

## Stack

| Layer       | Technology             |
|-------------|------------------------|
| Frontend    | Next.js 14 App Router  |
| Database    | Convex (real-time)     |
| Backend API | NestJS (Node.js)       |
| Payments    | Paystack               |
| Styling     | Tailwind CSS           |
| Animation   | Framer Motion          |
| State       | Zustand + Convex hooks |
| Forms       | React Hook Form + Zod  |

## Quick Start

```bash
# Install all packages
npm run install:all

# Set up environment
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Start Convex (run in a separate terminal)
cd frontend && npx convex dev

# Start dev servers
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs
- Convex Dashboard: https://dashboard.convex.dev

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Backend (`backend/.env`)
```
PORT=4000
CONVEX_URL=https://your-deployment.convex.cloud
JWT_SECRET=your-secret-here
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

## Convex Setup

1. Install Convex CLI: `npm install -g convex`
2. Run `npx convex dev` inside the `frontend/` folder
3. This creates your deployment and generates `convex/_generated/`
4. Copy your deployment URL to `NEXT_PUBLIC_CONVEX_URL`

## Bot Simulator

Generates realistic synthetic user traffic for analytics testing:

```bash
# Default: 100 bots, 20 concurrent
npm run bots:run

# Load test: 1000 bots, 50 concurrent
npm run bots:load

# Custom
TOTAL=500 CONCURRENT=30 CONVEX_URL=https://... npm run bots:run
```

### Personas
| Persona | Purchase Rate | Behavior |
|---------|--------------|---------|
| loyal_customer | 82% | High intent, returns regularly |
| impulse_buyer | 78% | Buys fast, minimal browsing |
| fashionista | 58% | Fashion only, heavy browsing |
| bulk_buyer | 62% | Large quantities |
| deal_hunter | 52% | Price-sensitive |
| tech_enthusiast | 42% | Deep researcher |
| budget_shopper | 38% | Very price-sensitive |
| fraud_attempt | 25% | High-value, suspicious |
| new_visitor | 10% | Exploring, slow |
| window_shopper | 6% | Rarely buys |

## Pages

### Shop
- `/` — Homepage with hero, category bar, product rows
- `/shop/products` — Product listing with sidebar filters
- `/shop/products/[slug]` — Product detail with gallery, variants, reviews
- `/shop/categories/[slug]` — Category browse
- `/shop/checkout` — Multi-step checkout
- `/shop/checkout/verify` — Payment verification

### Account
- `/account` — Account overview
- `/account/orders` — Order history
- `/account/orders/[id]` — Order detail with progress tracker
- `/account/wishlist` — Saved products
- `/account/addresses` — Delivery addresses

### Auth
- `/auth/login` — Sign in
- `/auth/register` — Create account
- `/auth/forgot-password` — Password reset

### Admin
- `/admin` — Live dashboard with charts
- `/admin/products` — Product management
- `/admin/orders` — Order management with inline status updates
- `/admin/users` — User management
- `/admin/categories` — Category tree management
- `/admin/inventory` — Stock alerts

## Deployment

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard.

### Backend → Vercel / Railway / Hetzner
```bash
cd backend
vercel --prod
# or
docker-compose up -d
```

### Database → Convex Cloud
Free tier available. Production plans start at $25/month.

## Design

- **Colors**: Off-black (`#1a1714`), off-white (`#f7f4ef`), orange (`#f95d0f`), warm grays
- **Typography**: DM Serif Display (headings) + DM Sans (body)
- **No emoji icons** — Lucide React icons throughout
- **Human aesthetic** — editorial, clean, functional
