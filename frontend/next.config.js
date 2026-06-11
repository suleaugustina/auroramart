/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep pg and native node modules server-side only
  serverExternalPackages: ['pg', 'pg-native'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.convex.cloud' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'fakestoreapi.com' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
};
module.exports = nextConfig;
