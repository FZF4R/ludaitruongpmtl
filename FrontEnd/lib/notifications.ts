/**
 * Thông báo riêng của người đang đăng nhập — CHẠY TRÊN TRÌNH DUYỆT.
 */
import { goiApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type ThongBao = {
  id: string;
  /**
   * comment = có bình luận ở bài của bạn; reply = có người trả lời bạn;
   * warning = bạn bị cảnh cáo (contentTitle = "lần/5", excerpt = lý do).
   * published / rejected = bài của bạn được đăng / bị trả lại (excerpt = lý do);
   * edit-proposal = ban biên tập đề xuất sửa bài của bạn;
   * edit-accepted / edit-rejected = tác giả đồng ý / từ chối bản sửa của bạn.
   */
  type: "comment" | "reply" | "warning" | "published" | "rejected" | "edit-proposal" | "edit-accepted" | "edit-rejected";
  /** Đường dẫn (chưa có tiền tố ngôn ngữ) thông báo mở ra; rỗng = tự dựng theo loại. */
  link: string;
  read: boolean;
  contentSlug: string;
  contentTitle: string;
  commentId: string;
  excerpt: string;
  createdAt: string;
  actor: { name: string; avatarUrl: string };
};

export function layThongBao(locale: Locale, onlyCount = false) {
  return goiApi<{ data: ThongBao[]; unread: number }>("/v1/user/notifications", {
    query: { limit: 20, ...(onlyCount ? { onlyCount: "true" } : {}) },
    locale,
  });
}

/** Bỏ trống `ids` = đánh dấu tất cả đã đọc. */
export function danhDauDaDoc(locale: Locale, ids: string[] = []) {
  return goiApi<{ unread: number }>("/v1/user/notifications/read", {
    method: "POST",
    body: { ids },
    locale,
  });
}
