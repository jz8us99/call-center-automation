import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
  webpack: (config, { isServer }) => {
    // Suppress specific warnings from Supabase realtime-js
    config.infrastructureLogging = {
      level: 'error',
    };

    // Handle the critical dependency warning from @supabase/realtime-js
    config.module.exprContextCritical = false;

    return config;
  },
};

export default withNextIntl(nextConfig);
