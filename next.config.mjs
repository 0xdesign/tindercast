/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during builds
  eslint: {
    // Don't run ESLint during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'pbs.twimg.com',
      'avatars.githubusercontent.com',
      'res.cloudinary.com',
      'i.imgur.com',
      'cdn.stamp.fyi',
      'ipfs.zora.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
