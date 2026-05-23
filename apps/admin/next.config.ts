import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
      { hostname: 'images.unsplash.com' },
    ],
  },
  // Ensure _next/static assets are served correctly on Vercel
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
