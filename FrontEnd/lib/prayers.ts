/**
 * Lời cầu an / cầu siêu — CHẠY TRÊN TRÌNH DUYỆT.
 *
 * Người đã đăng nhập đọc qua /v1/user/prayers/list để biết lời nào của mình
 * (nút xoá) và hôm nay mình đã viết chưa; khách đọc bản công khai.
 */
import { goiApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type LoaiNguyen = "cau-an" | "cau-sieu";

export type LoiNguyen = {
  id: string;
  kind: LoaiNguyen;
  forName: string;
  body: string;
  anonymous: boolean;
  /** Đã được kiểm duyệt chọn hiện trong slideshow nổi bật. */
  featured: boolean;
  /** Của người đang xem (chỉ có ở bản đã đăng nhập). */
  mine: boolean;
  createdAt: string;
  /** Rỗng hết khi ẩn danh. */
  author: { name: string; dharmaName: string; avatarUrl: string };
};

export type TrangLoiNguyen = {
  data: LoiNguyen[];
  total: number;
  /** Số lời đã viết hôm nay (toàn site). */
  today: number;
  /** Chỉ có ở bản đã đăng nhập: đã viết đủ số lời tối đa hôm nay. */
  wroteToday?: boolean;
  /** Chỉ có ở bản đã đăng nhập: số lời còn được viết hôm nay (tối đa 3). */
  remainingToday?: number;
  page: number;
  limit: number;
};

export function layLoiNguyen(
  { page, kind, daDangNhap }: { page: number; kind: LoaiNguyen | ""; daDangNhap: boolean },
  locale: Locale,
) {
  return goiApi<TrangLoiNguyen>(daDangNhap ? "/v1/user/prayers/list" : "/v1/public/prayers", {
    query: { page, limit: 8, kind },
    locale,
  });
}

export function guiLoiNguyen(
  than: { kind: LoaiNguyen; forName: string; body: string; anonymous: boolean },
  locale: Locale,
) {
  return goiApi<LoiNguyen>("/v1/user/prayers", { method: "POST", body: than, locale });
}

/** Lời nguyện nổi bật cho slideshow trang chủ (công khai). */
export function layLoiNguyenNoiBat(locale: Locale) {
  return goiApi<LoiNguyen[]>("/v1/public/prayers/featured", { locale });
}

/** Người kiểm duyệt (comment.moderate) chọn / bỏ chọn một lời làm nổi bật. */
export function datNoiBat(id: string, featured: boolean, locale: Locale) {
  return goiApi<{ id: string; featured: boolean }>("/v1/admin/prayers/feature", {
    method: "POST",
    body: { id, featured },
    locale,
  });
}

export function xoaLoiNguyen(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/prayers/delete", { method: "POST", body: { id }, locale });
}
