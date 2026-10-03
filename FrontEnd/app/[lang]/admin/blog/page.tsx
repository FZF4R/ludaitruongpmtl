import type { Metadata } from "next";
import { ContentPanel } from "@/components/admin/content-panel";

export const metadata: Metadata = { title: "Bài viết" };

/**
 * Bài viết và tuỳ bút, gồm cả bài người dùng gửi lên.
 *
 * Dùng chung <ContentPanel> với trang kinh sách; hai trang chỉ khác `loai`.
 */
export default function AdminBlogPage() {
  return (
    <ContentPanel
      loai="article,blog"
      loaiChon={["article", "blog"]}
      tieuDe="Bài viết"
      moTa="Toàn bộ bài viết và tuỳ bút, kể cả bản nháp và bài đang chờ duyệt."
    />
  );
}
