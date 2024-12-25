/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: import('webpack').Configuration) => {
    if (!config.module) {
      config.module = { rules: [] };
    }
    config.module.rules = config.module.rules || [];
    
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'next/dist/compiled/worker-loader', options: { inline: "fallback" } },
    });
    return config;
  },
};

module.exports = nextConfig;