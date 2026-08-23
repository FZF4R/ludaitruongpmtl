/**
 * Cấu hình ngôn ngữ.
 *
 * Tệp này KHÔNG được dùng "server-only": bộ chọn ngôn ngữ là Client Component
 * và cần chung danh sách ngôn ngữ với phía server. Chỉ để dữ liệu tĩnh và hàm
 * thuần ở đây, không đọc cookie hay gọi API.
 *
 * Tiếng Việt là mặc định và KHÔNG có tiền tố trên URL: /bai-viet giữ nguyên
 * như trước, ba ngôn ngữ còn lại nằm dưới /en, /zh, /ko. Nhờ vậy mọi đường dẫn
 * đã được đánh chỉ mục không phải chuyển hướng.
 */

export const locales = ["vi", "en", "zh", "ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

/** Nhãn trong bộ chọn, luôn viết bằng chính ngôn ngữ đó chứ không dịch sang tiếng Việt. */
export const localeNames: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ko: "한국어",
};

/** Mã BCP-47 cho <html lang>, Intl.* và thẻ hreflang. */
export const localeTags: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
  zh: "zh-CN",
  ko: "ko-KR",
};

/** Mã ngôn ngữ gửi kèm header x-language cho backend Sails. */
export const localeApiCodes: Record<Locale, string> = {
  vi: "vi",
  en: "en",
  zh: "zh",
  ko: "ko",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Tách tiền tố ngôn ngữ khỏi đường dẫn công khai.
 * "/en/bai-viet" -> { locale: "en", path: "/bai-viet" }
 * "/bai-viet"    -> { locale: "vi", path: "/bai-viet" }
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const doan = pathname.split("/").filter(Boolean);
  const dau = doan[0] ?? "";

  if (isLocale(dau) && dau !== defaultLocale) {
    return { locale: dau, path: `/${doan.slice(1).join("/")}` };
  }

  // /vi/... vẫn nhận ra được để proxy chuyển hướng về dạng không tiền tố.
  if (dau === defaultLocale) {
    return { locale: defaultLocale, path: `/${doan.slice(1).join("/")}` };
  }

  return { locale: defaultLocale, path: pathname || "/" };
}

/**
 * Dựng đường dẫn công khai cho một ngôn ngữ.
 * localePath("en", "/bai-viet") -> "/en/bai-viet"
 * localePath("vi", "/bai-viet") -> "/bai-viet"
 */
export function localePath(locale: Locale, path: string): string {
  const sach = path === "/" ? "" : path.replace(/\/+$/, "");

  if (locale === defaultLocale) return sach || "/";

  return `/${locale}${sach}`;
}
