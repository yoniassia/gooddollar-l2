/** @type {import('next').NextConfig} */
const nextConfig = {
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
