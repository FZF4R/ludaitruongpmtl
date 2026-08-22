import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ảnh bìa do admin tải lên qua Sails. Thêm domain CDN vào đây khi có.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Loại bỏ header tiết lộ framework.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
