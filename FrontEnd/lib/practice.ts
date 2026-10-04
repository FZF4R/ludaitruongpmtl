/**
 * Công cụ tu tập — CHẠY TRÊN TRÌNH DUYỆT: âm thanh từng mục và nhật ký tu tập.
 */
import { goiApi, urlApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type MucTuTap = "tung-kinh" | "thien-dinh" | "go-mo" | "cau-an";
/** chuong = chuông; mo = mõ; am-nen = âm nền lặp; tung-mau = tụng mẫu; huong-dan = có hướng dẫn. */
export type LoaiAmThanh = "chuong" | "mo" | "am-nen" | "tung-mau" | "huong-dan" | "hat";

export type AmThanh = {
  id: string;
  category: MucTuTap;
  kind: LoaiAmThanh;
  title: string;
  /** URL phát được (đã ghép host API nếu là tệp tải lên). */
  src: string;
  loop: boolean;
};

export async function layAmThanh(category: MucTuTap, locale?: Locale): Promise<AmThanh[]> {
  const ds = await goiApi<AmThanh[]>("/v1/public/sounds", { query: { category }, locale });
  // Tệp tải lên trả đường dẫn tương đối trên API; link ngoài giữ nguyên.
  return ds.map((a) => ({ ...a, src: /^https?:\/\//i.test(a.src) ? a.src : urlApi(a.src) }));
}

/* ------------------------------------------------------------------ */
/* Nhật ký tu tập                                                      */
/* ------------------------------------------------------------------ */

/** thien: giây; tung-kinh: số lần tụng; niem-phat / go-mo / chuoi-hat: số câu / tiếng / hạt. */
export type LoaiNhatKy = "tung-kinh" | "niem-phat" | "thien" | "go-mo" | "chuoi-hat";

/**
 * Ghi một buổi tu. Gõ mõ / lần chuỗi / thiền phải kèm `sessionId` (moPhien):
 * máy chủ hạ số liệu vượt thời gian thật (`adjusted`) và trả số đã lưu.
 */
export function ghiNhatKy(than: { type: LoaiNhatKy; amount: number; note?: string; sessionId?: string }, locale: Locale) {
  return goiApi<{ id: string; amount: number; adjusted: boolean }>("/v1/user/practice/log", { method: "POST", body: than, locale });
}

/** Loại cần phiên do máy chủ mở (chống bộ đếm giả). */
export const LOAI_CAN_PHIEN: LoaiNhatKy[] = ["thien", "go-mo", "chuoi-hat"];

export function moPhien(type: LoaiNhatKy, locale: Locale) {
  return goiApi<{ sessionId: string }>("/v1/user/practice/session", { method: "POST", body: { type }, locale });
}

/* Bộ cấu hình thiền người dùng tự lưu */
export type BoCauHinh<T = Record<string, unknown>> = { id: string; name: string; config: T; lastUsedAt: number };

/** `kind`: thien = Đồng hồ thiền; cau-an = âm nền cầu nguyện. */
export function layBoCauHinh(locale: Locale, kind: "thien" | "cau-an" = "thien") {
  return goiApi<BoCauHinh[]>("/v1/user/practice/presets", { query: { kind }, locale });
}

export function luuBoCauHinh(
  than: { id?: string; name?: string; config?: Record<string, unknown>; used?: boolean; kind?: "thien" | "cau-an" },
  locale: Locale,
) {
  return goiApi<BoCauHinh>("/v1/user/practice/presets/save", { method: "POST", body: than, locale });
}

export function xoaBoCauHinh(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/practice/presets/delete", { method: "POST", body: { id }, locale });
}

export type ThongKeTuTap = {
  totals: Record<LoaiNhatKy, { today: number; week: number; all: number; sessions: number }>;
  streak: number;
  activeDays: number;
  days: { day: string; values: Partial<Record<LoaiNhatKy, number>> }[];
  recent: { id: string; type: LoaiNhatKy; amount: number; note: string; createdAt: string }[];
};

export function layThongKeTuTap(locale: Locale) {
  return goiApi<ThongKeTuTap>("/v1/user/practice/stats", { locale });
}

/* Nhạc riêng của tài khoản (âm nền cầu nguyện...) */
export type NhacRieng = { id: string; name: string; url: string; sizeBytes: number };

export async function layNhacRieng(locale: Locale) {
  const ds = await goiApi<NhacRieng[]>("/v1/user/practice/audio", { locale });
  return ds.map((n) => ({ ...n, url: urlApi(n.url) }));
}

/** Tải một tệp audio (≤ 10 MB, tối đa 10 tệp / tài khoản) lên máy chủ. */
export async function taiNhacRieng(tep: File, locale: Locale) {
  const file = await new Promise<string>((ok, hong) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => hong(r.error);
    r.readAsDataURL(tep);
  });
  const kq = await goiApi<NhacRieng>("/v1/user/practice/audio/upload", { method: "POST", body: { file, name: tep.name }, locale });
  return { ...kq, url: urlApi(kq.url) };
}

export function xoaNhacRieng(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/practice/audio/delete", { method: "POST", body: { id }, locale });
}
