import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['demo1492.ddns.net', 'call-center-automation.vercel.app'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
