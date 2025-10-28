/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add unoptimized for development to avoid 500 errors with external images
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig
