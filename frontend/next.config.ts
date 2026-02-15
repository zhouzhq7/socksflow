import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 优化输出
  output: 'standalone',
  
  // 图片优化配置
  images: {
    unoptimized: true,
  },
  
  // 环境变量（构建时可用）
  env: {
    NEXT_PUBLIC_APP_NAME: 'SocksFlow',
  },
  
  // 重写规则（API 代理到后端）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  
  // 响应头配置（安全和性能）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
