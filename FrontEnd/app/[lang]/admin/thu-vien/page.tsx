import type { Metadata } from "next";
import { ContentPanel } from "@/components/admin/content-panel";

export const metadata: Metadata = { title: "Thư viện" };

/**
 * Nội dung thư viện (ảnh, review chùa đền, Phật - Bồ Tát, nhạc thiền, audio
 * kinh) - quyền `library.manage`. Nội dung Cộng tác viên gửi nằm ở "Chờ duyệt".
 */
export default function AdminThuVienPage() {
  return (
    <ContentPanel
      loai="library"
      loaiChon={["library"]}
      tieuDe="Thư viện"
      moTa="Ảnh, review chùa đền, Phật - Bồ Tát, nhạc thiền, audio kinh. Nội dung cộng tác viên gửi cần duyệt trước khi hiện."
    />
  );
}
