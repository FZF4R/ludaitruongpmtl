/**
 * Nạp từ điển cho ngôn ngữ đang xem.
 *
 * Dùng `lang()` của next/root-params thay vì truyền `lang` qua props xuống
 * từng tầng: mọi route đều nằm dưới app/[lang] nên `lang` là root param, đọc
 * được từ bất kỳ Server Component hay tiện ích chạy phía server nào. Chỉ 6
 * component trong dự án là Client Component; chúng nhận chuỗi đã dịch qua props.
 *
 * Không cần "server-only": import từ next/root-params đã tự hỏng lúc build
 * nếu bị dùng nhầm trong Client Component.
 *
 * Từ điển chỉ chạy trên server nên kích thước của chúng không tính vào bundle
 * gửi xuống trình duyệt - chỉ HTML kết quả được gửi đi.
 */
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

import vi from "@/lib/dictionaries/vi.json";

const dictionaries = {
  vi: () => Promise.resolve(vi),
  en: () => import("@/lib/dictionaries/en.json").then((m) => m.default),
  zh: () => import("@/lib/dictionaries/zh.json").then((m) => m.default),
  ko: () => import("@/lib/dictionaries/ko.json").then((m) => m.default),
} satisfies Record<Locale, () => Promise<unknown>>;

/**
 * Tiếng Việt là bản gốc và đầy đủ nhất nên dùng làm khuôn kiểu. Thiếu một khoá
 * ở en/zh/ko là lỗi biên dịch, chứ không phải một chuỗi rỗng lặng lẽ hiện ra.
 */
export type Dictionary = typeof vi;

/** Ngôn ngữ của request hiện tại, đã kiểm tra hợp lệ. */
export async function getLocale(): Promise<Locale> {
  const doc = await lang();

  // Đường dẫn không tiền tố đã được proxy viết lại thành /vi/... nên luôn có giá trị.
  if (!doc) return defaultLocale;
  if (!isLocale(doc)) notFound();

  return doc;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();

  return (await dictionaries[locale]()) as Dictionary;
}

/** Tiện dụng khi cần cả hai, tránh gọi lang() hai lần. */
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  const dict = (await dictionaries[locale]()) as Dictionary;

  return { locale, dict };
}
