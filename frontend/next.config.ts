import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-*' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'p.kakaocdn.net' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
    ],
  },
};

export default nextConfig;


