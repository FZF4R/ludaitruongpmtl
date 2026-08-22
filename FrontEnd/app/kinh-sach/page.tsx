import type { Metadata } from "next";
import { ContentListPage } from "@/components/content/content-list-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kinh sách",
  description:
    "Kinh, luật, luận trình bày theo chương, giữ nguyên bản dịch và ghi rõ xuất xứ.",
  alternates: { canonical: "/kinh-sach" },
};

export default function SutraListPage() {
  return (
    <ContentListPage
      filter={{ type: "sutra" }}
      page={1}
      basePath="/kinh-sach"
      eyebrow="Kinh, luật, luận"
      title="Kinh sách"
      description="Đọc theo chương. Mỗi chương là một đường dẫn riêng để tiện chia sẻ và đánh dấu."
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Kinh sách", href: "/kinh-sach" },
      ]}
      emptyTitle="Chưa có kinh sách nào"
    />
  );
}
