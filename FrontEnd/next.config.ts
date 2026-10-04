import type { NextConfig } from "next";

/*
 * Ảnh do admin tải lên (ảnh xoay vòng trang chủ, ảnh bìa) nằm ở API Sails.
 * Lấy host từ NEXT_PUBLIC_API_URL để đổi tên miền lúc triển khai không phải
 * sửa cả tệp này.
 */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/v1/public/**",
      },
    ],
    // Next 16 chặn tối ưu ảnh từ IP nội bộ (chống SSRF). Lúc dev API chạy ở
    // localhost nên phải mở; lúc chạy thật API ở tên miền công khai, giữ chặn.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    formats: ["image/avif", "image/webp"],
    // Next 16 bắt khai danh sách chất lượng được phép. 75 cho ảnh thường;
    // 90 cho ảnh nền trang chủ phủ toàn màn hình, nơi nén mạnh lộ rõ vệt.
    qualities: [75, 90],
  },

  // Loại bỏ header tiết lộ framework.
  poweredByHeader: false,

  /**
   * Bốn mục tu tập cũ đã gộp thành hai trang (Tụng kinh / Niệm Phật, Gõ mõ /
   * Chuỗi hạt). 308 ở đây thay vì redirect trong trang: trang đã stream thì
   * Next chỉ chuyển hướng phía trình duyệt, Google không thấy mã chuyển hướng.
   */
  async redirects() {
    const doiTen: [string, string][] = [
      ["tung-kinh", "tung-kinh-niem-phat"],
      ["niem-phat", "tung-kinh-niem-phat"],
      ["go-mo", "go-mo-chuoi-hat"],
      ["lan-chuoi-hat", "go-mo-chuoi-hat"],
    ];
    return [
      // Trang /tim-kiem đã bỏ: link cũ chuyển sang tìm trong Bài viết (giữ ?q=).
      { source: "/tim-kiem", destination: "/bai-viet/tim-kiem", permanent: true },
      { source: "/:lang(en|zh|ko)/tim-kiem", destination: "/:lang/bai-viet/tim-kiem", permanent: true },
      ...doiTen.flatMap(([cu, moi]) => [
      { source: `/tu-tap/${cu}`, destination: `/tu-tap/${moi}`, permanent: true },
      { source: `/:lang(en|zh|ko)/tu-tap/${cu}`, destination: `/:lang/tu-tap/${moi}`, permanent: true },
      ]),
    ];
  },
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
