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

export type NavKey =
  | "sutras"
  | "practice"
  | "articles"
  | "calendar"
  | "library"
  | "journey"
  | "about"
  | "talks";

/** Các mục con của "Tu tập". */
export type PracticeKey =
  | "meditation"
  | "chanting"
  | "recitation"
  | "woodenFish"
  | "mala"
  | "prayers";

export type NavItem = {
  href: string;
  /** Khoá tra trong dict.nav — nhãn hiển thị lấy từ từ điển, không viết cứng ở đây. */
  key: NavKey;
  /** Có mục con thì header hiện menu thả xuống. */
  children?: { href: string; key: PracticeKey }[];
};

export const practiceNav: { href: string; key: PracticeKey }[] = [
  { href: "/tu-tap/thien-dinh", key: "meditation" },
  { href: "/tu-tap/tung-kinh", key: "chanting" },
  { href: "/tu-tap/niem-phat", key: "recitation" },
  { href: "/tu-tap/go-mo", key: "woodenFish" },
  { href: "/tu-tap/lan-chuoi-hat", key: "mala" },
  { href: "/tu-tap/cau-an-cau-sieu", key: "prayers" },
];

export const mainNav: NavItem[] = [
  { href: "/kinh-sach", key: "sutras" },
  { href: "/tu-tap", key: "practice", children: practiceNav },
  { href: "/bai-viet", key: "articles" },
  { href: "/phat-lich", key: "calendar" },
  { href: "/thu-vien", key: "library" },
  { href: "/qua-trinh-tu-tap", key: "journey" },
  { href: "/ve-chung-toi", key: "about" },
];

/**
 * Cột chân trang.
 *
 * Cố tình KHÔNG dựng lại từ mainNav: menu chính có 7 mục và mang mục con,
 * còn chân trang cần danh sách gọn theo loại nội dung — trong đó có "Bài
 * giảng", vốn không nằm trên menu chính nhưng vẫn là một khu nội dung thật.
 *
 * `key` tra trong dict.nav, còn `label` là chuỗi giữ nguyên không dịch — tên
 * chuyên mục là nội dung do ban biên tập đặt, không phải chữ giao diện.
 */
export type FooterKey = NavKey | "search" | "account";

export type FooterItem = { href: string; key?: FooterKey; label?: string };

export const footerNav: {
  titleKey: "content" | "categories" | "about";
  items: FooterItem[];
}[] = [
  {
    titleKey: "content",
    items: [
      { href: "/bai-viet", key: "articles" },
      { href: "/kinh-sach", key: "sutras" },
      { href: "/bai-giang", key: "talks" },
      { href: "/phat-lich", key: "calendar" },
      { href: "/tu-tap", key: "practice" },
    ],
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
      { href: "/ve-chung-toi", key: "about" },
      { href: "/thu-vien", key: "library" },
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
