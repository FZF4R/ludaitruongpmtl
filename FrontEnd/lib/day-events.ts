/**
 * Sự kiện theo ngày dương admin gắn trên lịch — CHẠY TRÊN TRÌNH DUYỆT (tải
 * trực tiếp, không qua cache ISR, để admin thêm xong là thấy ngay).
 */
import { goiApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type SuKienNgayDuong = { id: string; date: string; title: string; imageUrl: string; body: string };

/** `from`, `to`: "YYYY-MM-DD". */
export function laySuKienNgay(from: string, to: string, locale?: Locale) {
  return goiApi<SuKienNgayDuong[]>("/v1/public/day-events", { query: { from, to }, locale });
}
