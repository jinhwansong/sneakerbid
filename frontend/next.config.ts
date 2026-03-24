import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-*' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'p.kakaocdn.net' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'http', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 'zozvdfcxrwqdpxidodtt.supabase.co', pathname: '/storage/v1/object/public/**' },
      // KicksDB / StockX 상품 이미지 (시드·경매 썸네일)
      { protocol: 'https', hostname: 'images.stockx.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;


