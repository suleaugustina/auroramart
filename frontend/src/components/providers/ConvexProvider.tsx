'use client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
const cleanUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const convex = new ConvexReactClient(cleanUrl);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
