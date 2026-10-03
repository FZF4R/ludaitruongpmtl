/**
 * Bình luận bài viết — CHẠY TRÊN TRÌNH DUYỆT.
 *
 * Đọc ở trình duyệt chứ không render sẵn trên server: trang bài viết là ISR
 * (cache tới 1 giờ), còn bình luận cần hiện ngay sau khi gửi.
 */
import { goiApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type BinhLuan = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  /** Đọc từ hồ sơ hiện tại của người viết, nên đổi theo khi họ sửa hồ sơ. */
  author: { name: string; dharmaName: string };
};

export type TrangBinhLuan = { data: BinhLuan[]; total: number; page: number; limit: number };

export function layBinhLuan(slug: string, page: number, locale: Locale) {
  return goiApi<TrangBinhLuan>("/v1/public/comments", { query: { slug, page, limit: 20 }, locale });
}

export function guiBinhLuan(slug: string, body: string, locale: Locale) {
  return goiApi<BinhLuan>("/v1/user/comments", { method: "POST", body: { slug, body }, locale });
}

export function xoaBinhLuan(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/comments/delete", {
    method: "POST",
    body: { id },
    locale,
  });
}
