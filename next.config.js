/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['dgalywyr863hv.cloudfront.net'], // Strava avatar domain
  },
  experimental: {
    suppressWarning: true,
  },
  reactStrictMode: false, // Reduces hydration warnings in development
}

module.exports = nextConfig
