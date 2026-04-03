/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers leaking referrer to third-party origins
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Enable XSS filter in older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Require HTTPS for 1 year (only active in production)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
    : []),
  // Permissions policy — deny access to camera, mic, geolocation
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content-Security-Policy
  // Allows: self, specific CDNs for fonts/images, wagmi/viem RPC endpoints,
  //         CoinGecko price feeds, and inline styles (needed by Tailwind).
  // 'unsafe-eval' is required by wagmi/viem WebAssembly modules.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + wagmi/rainbowkit bundles; unsafe-eval for WASM
      "script-src 'self' 'unsafe-eval'",
      // Styles: self + inline (Tailwind injects via style attributes)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (token icons) + trusted CDNs
      "img-src 'self' data: https:",
      // Connect: self + known blockchain/price-feed endpoints
      [
        "connect-src 'self'",
        'https://*.alchemyapi.io',
        'https://*.g.alchemy.com',
        'wss://*.alchemyapi.io',
        'wss://*.g.alchemy.com',
        'https://api.coingecko.com',
        'https://*.infura.io',
        'wss://*.infura.io',
        'https://api.walletconnect.com',
        'wss://*.walletconnect.com',
        'https://explorer-api.walletconnect.com',
        'https://rpc.gooddollar.org',
        'https://clapi.gooddollar.org',
      ].join(' '),
      // Iframes: deny (no wallet iframes needed)
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

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
