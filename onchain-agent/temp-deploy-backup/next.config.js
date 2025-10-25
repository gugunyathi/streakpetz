// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude XMTP WASM files from server-side bundling
      config.externals = config.externals || [];
      config.externals.push({
        '@xmtp/user-preferences-bindings-wasm': 'commonjs @xmtp/user-preferences-bindings-wasm',
        '@xmtp/xmtp-js': 'commonjs @xmtp/xmtp-js'
      });
    }
    
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },

};

module.exports = nextConfig;
