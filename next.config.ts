/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
