'use client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
// Strip trailing slash + normalise .convex.site -> .convex.cloud
const cleanUrl = rawUrl.replace(/\/$/, '').replace(/\.convex\.site$/, '.convex.cloud');
const convex = new ConvexReactClient(cleanUrl, { skipConvexDeploymentUrlCheck: true });

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
