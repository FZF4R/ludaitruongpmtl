/**
 * Cấu hình chung của site. Mọi nơi cần tên, mô tả, URL tuyệt đối
 * đều lấy từ đây để metadata, sitemap và JSON-LD không lệch nhau.
 */

export const site = {
  name: "Sen Việt",
  tagline: "Chia sẻ nội dung Phật pháp",
  description:
    "Kho bài viết, kinh sách, bài giảng audio và video Phật pháp dành cho Phật tử Việt Nam, kèm Phật lịch và các ngày vía trong năm.",
  locale: "vi_VN",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type NavItem = {
  href: string;
  label: string;
  /** Mô tả ngắn hiện trong menu mobile. */
  hint?: string;
};

export const mainNav: NavItem[] = [
  { href: "/bai-viet", label: "Bài viết", hint: "Pháp thoại, tuỳ bút, hỏi đáp" },
  { href: "/kinh-sach", label: "Kinh sách", hint: "Kinh, luật, luận theo chương" },
  { href: "/bai-giang", label: "Bài giảng", hint: "Audio và video" },
  { href: "/phat-lich", label: "Phật lịch", hint: "Lịch âm, ngày vía, ngày rằm" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Nội dung",
    items: mainNav,
  },
  {
    title: "Chuyên mục",
    items: [
      { href: "/danh-muc/kinh-dien", label: "Kinh điển" },
      { href: "/danh-muc/thien-tap", label: "Thiền tập" },
      { href: "/danh-muc/nghi-le", label: "Nghi lễ" },
      { href: "/danh-muc/phat-phap-ung-dung", label: "Phật pháp ứng dụng" },
    ],
  },
  {
    title: "Về trang",
    items: [
      { href: "/tim-kiem", label: "Tìm kiếm" },
      { href: "/tai-khoan", label: "Tài khoản" },
      { href: "/rss.xml", label: "RSS" },
    ],
  },
];

/** Nhãn tiếng Việt cho từng loại nội dung. */
export const contentTypeLabel = {
  article: "Bài viết",
  blog: "Tuỳ bút",
  sutra: "Kinh sách",
  audio: "Bài giảng audio",
  video: "Bài giảng video",
} as const;

/** Route gốc của mỗi loại nội dung. Dùng để dựng href và sitemap. */
export const contentTypeBase = {
  article: "/bai-viet",
  blog: "/bai-viet",
  sutra: "/kinh-sach",
  audio: "/bai-giang",
  video: "/bai-giang",
} as const;
