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
  /** Rỗng = bình luận gốc; có = câu trả lời của bình luận gốc này. */
  parentId: string;
  /** Người được trả lời (khi trả lời một câu trả lời) - hiện "@tên". */
  replyTo?: { userId: string; name: string };
  /** Chỉ có ở bình luận gốc trong danh sách: các câu trả lời, cũ trước. */
  replies?: BinhLuan[];
  body: string;
  /** Chỉ có trong phản hồi lúc gửi: bình luận chứa từ cấm, đã lưu nhưng không hiện. */
  flagged?: boolean;
  createdAt: string;
  /** Đọc từ hồ sơ hiện tại của người viết, nên đổi theo khi họ sửa hồ sơ. */
  author: { name: string; dharmaName: string; avatarUrl?: string };
};

/** `total` đếm bình luận gốc (để phân trang), `totalAll` đếm cả câu trả lời. */
export type TrangBinhLuan = {
  data: BinhLuan[];
  total: number;
  totalAll: number;
  page: number;
  limit: number;
};

export function layBinhLuan(slug: string, page: number, locale: Locale) {
  return goiApi<TrangBinhLuan>("/v1/public/comments", { query: { slug, page, limit: 20 }, locale });
}

/** `parentId` có = trả lời bình luận đó (backend tự gắn về bình luận gốc). */
export function guiBinhLuan(slug: string, body: string, locale: Locale, parentId?: string) {
  return goiApi<BinhLuan>("/v1/user/comments", {
    method: "POST",
    body: { slug, body, ...(parentId ? { parentId } : {}) },
    locale,
  });
}

export function xoaBinhLuan(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/comments/delete", {
    method: "POST",
    body: { id },
    locale,
  });
}
