import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module = config.module || { rules: [] };
      config.module.rules = config.module.rules || [];
      
      config.module.rules.push({
        test: /\.worker\.ts$/,
        use: {
          loader: 'worker-loader',
          options: {
            filename: 'static/[hash].worker.js',
            publicPath: '/_next/',
          },
        },
      });
    }

    // Fix for WebWorker
    config.output = config.output || {};
    config.output.globalObject = 'self';

    return config;
  },
  // Корректно определяем experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['http://localhost:3000']
    }
  },
  typescript: {
    ignoreBuildErrors: true // временно для разработки
  },
  eslint: {
    ignoreDuringBuilds: true // временно для разработки
  }
};

export default nextConfig;