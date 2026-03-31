/** @type {import('next').NextConfig} */
const nextConfig = {

  experimental: {
    optimizePackageImports: [
      'viem',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'porto/internal': false,
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}
module.exports = nextConfig
