import type { Metadata } from "next";
import { ContentListPage } from "@/components/content/content-list-page";

/**
 * Trang 1 KHÔNG đọc searchParams, nên Next sinh tĩnh được nó.
 *
 * Nếu để `?page=` trên chính route này thì cả trang trở thành dynamic —
 * kể cả lượt truy cập trang 1, vốn chiếm gần hết traffic và là trang
 * nhận backlink. Phân trang vì thế nằm ở /bai-viet/trang/[so].
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bài viết",
  description: "Pháp thoại, tuỳ bút và hỏi đáp Phật pháp, cập nhật thường xuyên.",
  alternates: { canonical: "/bai-viet" },
};

const trail = [
  { name: "Trang chủ", href: "/" },
  { name: "Bài viết", href: "/bai-viet" },
];

export default function ArticleListPage() {
  return (
    <ContentListPage
      filter={{ type: ["article", "blog"] }}
      page={1}
      basePath="/bai-viet"
      eyebrow="Chuyên mục"
      title="Bài viết"
      description="Pháp thoại, tuỳ bút và hỏi đáp Phật pháp."
      trail={trail}
      emptyTitle="Chưa có bài viết nào"
    />
  );
}
