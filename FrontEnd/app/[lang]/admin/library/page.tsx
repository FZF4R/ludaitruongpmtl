import type { Metadata } from "next";
import { ContentPanel } from "@/components/admin/content-panel";

export const metadata: Metadata = { title: "Kinh sách" };

/**
 * Thư viện kinh văn: kinh, luật, luận chia theo chương.
 *
 * `coChuong` bật thêm khối soạn chương — đây là khác biệt thật sự giữa kinh
 * sách và bài viết, còn lại dùng chung <ContentPanel>.
 */
export default function AdminLibraryPage() {
  return (
    <ContentPanel
      loai="sutra"
      loaiChon={["sutra"]}
      tieuDe="Kinh sách"
      moTa="Kinh, luật, luận trong thư viện. Mỗi bộ có thể chia thành nhiều chương."
      coChuong
      coNhapXuat
    />
  );
}
