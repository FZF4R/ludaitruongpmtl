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
  /** Khoá tra trong dict.nav — nhãn hiển thị lấy từ từ điển, không viết cứng ở đây. */
  key: NavKey;
};

export type NavKey = "articles" | "sutras" | "talks" | "calendar";

export const mainNav: NavItem[] = [
  { href: "/bai-viet", key: "articles" },
  { href: "/kinh-sach", key: "sutras" },
  { href: "/bai-giang", key: "talks" },
  { href: "/phat-lich", key: "calendar" },
];

/**
 * Cột chân trang. `key` tra trong dict.nav, còn `label` là chuỗi giữ nguyên
 * không dịch — tên chuyên mục là nội dung do ban biên tập đặt, không phải
 * chữ giao diện.
 */
export type FooterKey = NavKey | "search" | "account";

export type FooterItem = { href: string; key?: FooterKey; label?: string };

export const footerNav: {
  titleKey: "content" | "categories" | "about";
  items: FooterItem[];
}[] = [
  {
    titleKey: "content",
    items: mainNav.map((item) => ({ href: item.href, key: item.key })),
  },
  {
    titleKey: "categories",
    items: [
      { href: "/danh-muc/kinh-dien", label: "Kinh điển" },
      { href: "/danh-muc/thien-tap", label: "Thiền tập" },
      { href: "/danh-muc/nghi-le", label: "Nghi lễ" },
      { href: "/danh-muc/phat-phap-ung-dung", label: "Phật pháp ứng dụng" },
    ],
  },
  {
    titleKey: "about",
    items: [
      { href: "/tim-kiem", key: "search" },
      { href: "/tai-khoan", key: "account" },
      { href: "/rss.xml", label: "RSS" },
    ],
  },
];

/** Route gốc của mỗi loại nội dung. Dùng để dựng href và sitemap. */
export const contentTypeBase = {
  article: "/bai-viet",
  blog: "/bai-viet",
  sutra: "/kinh-sach",
  audio: "/bai-giang",
  video: "/bai-giang",
} as const;
